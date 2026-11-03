// Central Telemetry & Workstation Diagnostics Service (Neon Serverless HTTP)

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
 * Gets or creates a persistent workstation hardware/installation ID stored in localStorage.
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
    return 'ws-client-default';
  }
}

/**
 * Executes a silent diagnostic check-in query against the central database over HTTPS.
 * - By default, every installation is allowed and works completely normally.
 * - It logs the workstation ID, OS environment, and launch count.
 * - Only if a workstation is explicitly marked blocked in Neon does `allowed` return false.
 */
export async function sendHeartbeat(): Promise<HeartbeatResult> {
  const workstationId = getWorkstationId();
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
        query: `SELECT record_heartbeat('${APP_ID}', '', '${workstationId.replace(/'/g, "''")}', '${APP_VERSION}', '${osInfo.substring(0, 100).replace(/'/g, "''")}');`,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // If server is unreachable, always allow normal offline operation
      return {
        allowed: true,
        latest_version: APP_VERSION,
        launch_count: 0,
      };
    }

    const data = await response.json();
    const record = data?.rows?.[0]?.record_heartbeat;

    if (record) {
      return {
        allowed: record.allowed !== false,
        latest_version: record.latest_version || APP_VERSION,
        launch_count: record.launch_count || 1,
      };
    }

    return {
      allowed: true,
      latest_version: APP_VERSION,
      launch_count: 1,
    };
  } catch (error) {
    // Offline or network error: never block the user from working locally
    return {
      allowed: true,
      latest_version: APP_VERSION,
      launch_count: 0,
    };
  }
}
