// Silent Background Auto-Updater for DeskLog
// Inspired by production silent update pattern (hammer-pro-journal)
// Downloads updates quietly in background; installs silently when user exits.

import { check, Update } from '@tauri-apps/plugin-updater';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriEnv } from '../api/tauri';

// Module-level singletons — persist across React StrictMode double-mounts
let isHookAttached = false;
let isDownloading = false;
let downloadedUpdate: Update | null = null;

const INITIAL_DELAY_MS = 3500;           // 3.5s post-boot check (keeps startup fast)
const PERIODIC_INTERVAL_MS = 30 * 60 * 1000; // Re-check every 30 minutes

/**
 * Inner: check GitHub for a new version and silently download it in the background.
 * Guards against concurrent calls, duplicate downloads, and double hook attachment.
 */
async function checkAndDownloadUpdate(): Promise<void> {
  // Skip if: hook already armed (update ready), or a download is in-flight
  if (isHookAttached || isDownloading) return;

  try {
    const update = await check();
    if (!update) {
      // No update available — native window close is untouched
      return;
    }

    console.log(`[UPDATER] New version v${update.version} available. Downloading silently...`);
    isDownloading = true;

    await update.download();

    // Store reference BEFORE setting isHookAttached so close handler is always non-null
    downloadedUpdate = update;
    isDownloading = false;

    console.log(`[UPDATER] v${update.version} downloaded and ready on disk. Arming close hook...`);

    // Only arm the close listener once — at this point downloadedUpdate is guaranteed non-null
    isHookAttached = true;
    try {
      const currentWin = getCurrentWindow();
      await currentWin.onCloseRequested(async (event) => {
        // Intercept the native close to run the silent installer first
        event.preventDefault();

        try {
          console.log('[UPDATER] User closed app. Running silent NSIS installer (/S)...');
          // install() with quiet installMode (tauri.conf.json) runs NSIS with /S flag.
          // restartAfterInstall: false — NSIS finishes, then we destroy the window cleanly.
          const installPromise = downloadedUpdate!.install({ restartAfterInstall: false });
          // 5-second safety net: if NSIS spawn hangs for any OS reason, we still close.
          const safetyTimeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));
          await Promise.race([installPromise, safetyTimeout]);
        } catch (installErr) {
          console.warn('[UPDATER] Silent install error (non-fatal):', installErr);
        } finally {
          // GUARANTEED window destruction under ALL conditions — no more hang-on-close
          try {
            await currentWin.destroy();
          } catch (destroyErr) {
            console.error('[UPDATER] destroy() failed:', destroyErr);
          }
        }
      });
    } catch (attachErr) {
      // If hook attachment fails, reset the flag so next periodic check can retry
      isHookAttached = false;
      console.warn('[UPDATER] onCloseRequested attach failed, will retry next check:', attachErr);
    }
  } catch (err) {
    isDownloading = false;
    // Always fail silently — never block the user from working offline
    console.warn('[UPDATER] Background check/download error:', err);
  }
}

/**
 * Initializes the silent auto-updater.
 * - Fires once at 3.5s after app boot.
 * - Then re-checks every 30 minutes (for users who leave the app open all day).
 * - Returns a cleanup function for React effect unmounting.
 *
 * NOTE: Safe to call from React StrictMode (double-mount) because module-level
 * flags prevent duplicate downloads/hook registrations across mount cycles.
 */
export function initSilentAutoUpdater(): () => void {
  if (!isTauriEnv()) return () => {};

  const initialTimer = setTimeout(() => {
    checkAndDownloadUpdate().catch(() => {});
  }, INITIAL_DELAY_MS);

  const periodicInterval = setInterval(() => {
    checkAndDownloadUpdate().catch(() => {});
  }, PERIODIC_INTERVAL_MS);

  return () => {
    clearTimeout(initialTimer);
    clearInterval(periodicInterval);
  };
}
