// Central Telemetry & Workstation Diagnostics Service (Dual-Engine: Native Rust + Webview Fallback)
// Ensures 100% reliable connection to Neon over HTTPS regardless of WebView2 / CORS / CSP limitations.

import { invoke } from '@tauri-apps/api/core';
import { isTauriEnv } from '../api/tauri';
import { APP_VERSION } from '../constants/version';

const NEON_SQL_ENDPOINT = 'https://ep-falling-heart-aztfzlgo.c-3.ap-southeast-1.aws.neon.tech/sql';
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_AO7bZ1BzMiyx@ep-falling-heart-aztfzlgo.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const APP_ID = 'desklog';

export interface HeartbeatResult {
  allowed: boolean;
  latest_version: string;
  launch_count: number;
}

/**
 * Checks if this machine has previously been marked as blocked.
 */
export function isDeviceBlockedLocally(): boolean {
  try {
    return localStorage.getItem('desklog_blocked') === 'true';
  } catch {
    return false;
  }
}

/**
 * Gets the persistent workstation installation ID stored in localStorage.
 */
export function getWorkstationId(): string {
  try {
    const cached = localStorage.getItem('app_workstation_id');
    if (cached && cached.trim()) {
      return cached.trim();
    }
  } catch {}
  return 'ws-client-default';
}

/**
 * Synchronizes workstation ID with Rust's native workstation_id.txt.
 */
export async function syncWorkstationId(): Promise<string> {
  if (isTauriEnv()) {
    try {
      const nativeId = await invoke<string>('get_workstation_id');
      if (nativeId && nativeId.trim()) {
        const cleanId = nativeId.trim();
        try {
          localStorage.setItem('app_workstation_id', cleanId);
        } catch {}
        return cleanId;
      }
    } catch (e) {
      console.warn('[TELEMETRY] Failed to fetch native workstation id:', e);
    }
  }

  // Fallback if web or native command failed
  try {
    let wsId = localStorage.getItem('app_workstation_id');
    if (!wsId) {
      wsId =
        'ws-' +
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
      localStorage.setItem('app_workstation_id', wsId);
    }
    return wsId;
  } catch {
    return 'ws-client-default';
  }
}

/**
 * Builds a clean, compact OS identifier string strictly truncated to 80 chars.
 * Ensures PostgreSQL varchar column constraints are NEVER violated.
 */
function getOsInfo(): string {
  try {
    const platform = typeof navigator !== 'undefined' ? navigator.platform || 'Desktop' : 'Desktop';
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const raw = `${platform} (${ua})`.replace(/\s+/g, ' ').trim();
    return raw.substring(0, 80);
  } catch {
    return 'Windows Desktop';
  }
}

/**
 * Executes a silent diagnostic check-in against Neon over HTTPS.
 *
 * Primary: Native Rust subprocess with CREATE_NO_WINDOW (zero console popups)
 * -> Bypasses WebView2 CORS, CSP, and web security limitations.
 *
 * Fallback: Browser fetch with credentials: 'omit' and mode: 'cors'.
 *
 * Offline-first: If network is unreachable, defaults to allowed: true unless locally blocked.
 */
export async function sendHeartbeat(): Promise<HeartbeatResult> {
  const workstationId = await syncWorkstationId();
  const osInfo = getOsInfo();

  const FALLBACK: HeartbeatResult = {
    allowed: !isDeviceBlockedLocally(),
    latest_version: APP_VERSION,
    launch_count: 0,
  };

  // 1. Primary: Native Rust Command (Windows OS curl with CREATE_NO_WINDOW)
  if (isTauriEnv()) {
    try {
      console.log(`[TELEMETRY] Calling native Rust heartbeat for: ${workstationId}...`);
      const rawJson = await invoke<string>('send_heartbeat_native', {
        workstation_id: workstationId,
        workstationId: workstationId,
        app_version: APP_VERSION,
        appVersion: APP_VERSION,
        os_info: osInfo,
        osInfo: osInfo,
      });

      const data = JSON.parse(rawJson);
      console.log('[TELEMETRY] Native response:', data);

      const rawRecord = data?.rows?.[0]?.record_heartbeat;
      const record = typeof rawRecord === 'string' ? JSON.parse(rawRecord) : rawRecord;

      if (record && typeof record === 'object') {
        const isAllowed = record.allowed !== false;
        const result: HeartbeatResult = {
          allowed: isAllowed,
          latest_version: record.latest_version || APP_VERSION,
          launch_count: Number(record.launch_count) || 1,
        };

        try {
          if (!isAllowed) {
            localStorage.setItem('desklog_blocked', 'true');
          } else {
            localStorage.removeItem('desklog_blocked');
          }
          localStorage.setItem('telemetry_last_success', JSON.stringify({ result, time: new Date().toISOString() }));
        } catch {}

        return result;
      }
    } catch (nativeErr) {
      console.warn('[TELEMETRY] Native command failed, falling back to web fetch:', nativeErr);
    }
  }

  // 2. Fallback: Browser Fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(NEON_SQL_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Neon-Connection-String': NEON_CONNECTION_STRING,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT record_heartbeat($1, $2, $3, $4, $5)',
        params: [APP_ID, '', workstationId, APP_VERSION, osInfo],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawRecord = data?.rows?.[0]?.record_heartbeat;
      const record = typeof rawRecord === 'string' ? JSON.parse(rawRecord) : rawRecord;

      if (record && typeof record === 'object') {
        const isAllowed = record.allowed !== false;
        const result: HeartbeatResult = {
          allowed: isAllowed,
          latest_version: record.latest_version || APP_VERSION,
          launch_count: Number(record.launch_count) || 1,
        };

        try {
          if (!isAllowed) {
            localStorage.setItem('desklog_blocked', 'true');
          } else {
            localStorage.removeItem('desklog_blocked');
          }
        } catch {}

        return result;
      }
    }
  } catch (webErr) {
    console.warn('[TELEMETRY] Web fetch fallback error:', webErr);
  }

  return FALLBACK;
}
