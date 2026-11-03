// Silent Background Auto-Updater for DeskLog
// Checks and downloads updates silently in background, then installs on app exit.

import { check } from '@tauri-apps/plugin-updater';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriEnv } from '../api/tauri';

let isInitialized = false;

/**
 * Initializes the silent auto-updater.
 * - Detects and downloads updates quietly in the background without user intervention.
 * - Only arms the window close event AFTER the package has completely finished downloading.
 * - Uses a strict finally block to ensure the window ALWAYS closes instantly.
 */
export async function initSilentAutoUpdater(): Promise<void> {
  if (!isTauriEnv() || isInitialized) return;
  isInitialized = true;

  // Run update check 5 seconds after launch to keep startup lightning fast
  setTimeout(async () => {
    try {
      const update = await check();
      if (!update) {
        // No update available: keep native window close completely untouched
        return;
      }

      // Download update package in background
      await update.download();

      // ONLY arm the close listener once the update is 100% downloaded and ready on disk
      try {
        const currentWin = getCurrentWindow();
        await currentWin.onCloseRequested(async (event) => {
          // Take control to trigger the silent installer
          event.preventDefault();
          try {
            await update.install({ restartAfterInstall: false });
          } catch (installErr) {
            console.warn('Silent update install failed on exit:', installErr);
          } finally {
            // GUARANTEE the window closes under ALL circumstances
            try {
              await currentWin.destroy();
            } catch (destroyErr) {
              console.error('Failed to destroy window on exit:', destroyErr);
            }
          }
        });
        console.log(`Update v${update.version} ready. Will install silently when app closes.`);
      } catch (attachErr) {
        console.warn('Could not attach silent update listener to window close:', attachErr);
      }
    } catch (err) {
      // Fail silently without disrupting normal user workflow
      console.warn('Silent update check failed:', err);
    }
  }, 5000);
}
