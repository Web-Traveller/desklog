// Central Telemetry & License Service for Tauri Apps (Neon Serverless HTTP)

import { APP_VERSION } from '../constants/version';

const NEON_SQL_ENDPOINT = 'https://ep-falling-heart-aztfzlgo.c-3.ap-southeast-1.aws.neon.tech/sql';
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_AO7bZ1BzMiyx@ep-falling-heart-aztfzlgo.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const APP_ID = 'desklog';

export interface HeartbeatResult {
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'UNREGISTERED' | 'UNLICENSED' | 'OFFLINE';
  app_active: boolean;
  latest_version: string;
  launch_count: number;
}

/**
 * Gets or creates a persistent workstation ID stored in localStorage.
 */
export function getWorkstationId(): string {
  try {
    let wsId = localStorage.getItem('app_workstation_id');
    if (!wsId) {
      wsId = 'ws-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
      localStorage.setItem('app_workstation_id', wsId);
    }
    return wsId;
  } catch {
    return 'ws-fallback-client';
  }
}

/**
 * Gets the current saved license key, or empty string.
 */
export function getLicenseKey(): string {
  try {
    return localStorage.getItem('app_license_key') || '';
  } catch {
    return '';
  }
}

/**
 * Saves a new license key to local storage.
 */
export function setLicenseKey(key: string): void {
  try {
    localStorage.setItem('app_license_key', key.trim());
  } catch (err) {
    console.error('Failed to save license key:', err);
  }
}

/**
 * Executes a heartbeat query against the central Neon database over HTTPS.
 * This tracks workstation launches and returns the license / app active status.
 */
export async function sendHeartbeat(): Promise<HeartbeatResult> {
  const workstationId = getWorkstationId();
  const licenseKey = getLicenseKey();
  const osInfo = typeof navigator !== 'undefined' ? `${navigator.platform || 'Desktop'} (${navigator.userAgent})` : 'Desktop';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(NEON_SQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Neon-Connection-String': NEON_CONNECTION_STRING,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `SELECT record_heartbeat('${APP_ID}', '${licenseKey.replace(/'/g, "''")}', '${workstationId.replace(/'/g, "''")}', '${APP_VERSION}', '${osInfo.substring(0, 100).replace(/'/g, "''")}');`,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Heartbeat server responded with HTTP ${response.status}`);
      return {
        status: 'OFFLINE',
        app_active: true,
        latest_version: APP_VERSION,
        launch_count: 0,
      };
    }

    const data = await response.json();
    const record = data?.rows?.[0]?.record_heartbeat;

    if (record) {
      return {
        status: record.status || 'ACTIVE',
        app_active: record.app_active ?? true,
        latest_version: record.latest_version || APP_VERSION,
        launch_count: record.launch_count || 1,
      };
    }

    return {
      status: 'ACTIVE',
      app_active: true,
      latest_version: APP_VERSION,
      launch_count: 1,
    };
  } catch (error) {
    // Offline or network error: never crash the local application
    console.warn('Heartbeat check offline or unreachable:', error);
    return {
      status: 'OFFLINE',
      app_active: true,
      latest_version: APP_VERSION,
      launch_count: 0,
    };
  }
}
