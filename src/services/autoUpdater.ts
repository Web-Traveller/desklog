// Silent Background Auto-Updater for DeskLog
// Checks and downloads updates silently in background, then installs on app exit.

import { check, Update } from '@tauri-apps/plugin-updater';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriEnv } from '../api/tauri';

let downloadedUpdate: Update | null = null;
let isInitialized = false;

/**
 * Initializes the completely silent auto-updater.
 * - Detects and downloads updates quietly in the background without user intervention.
 * - Installs the downloaded update when the user closes the application.
 * - Next time the user opens the application, they are seamlessly on the new version.
 */
export async function initSilentAutoUpdater(): Promise<void> {
  if (!isTauriEnv() || isInitialized) return;
  isInitialized = true;

  // 1. Hook into window close event to apply downloaded update on exit
  try {
    const currentWin = getCurrentWindow();
    await currentWin.onCloseRequested(async () => {
      if (downloadedUpdate) {
        try {
          // Install without auto-restarting right now (the user just chose to close the app)
          await downloadedUpdate.install({ restartAfterInstall: false });
        } catch (installErr) {
          console.warn('Silent update install on exit failed:', installErr);
        }
      }
    });
  } catch (err) {
    console.warn('Failed to register window close listener for silent update:', err);
  }

  // 2. Perform silent check and background download after a 5s delay
  setTimeout(async () => {
    try {
      const update = await check();
      if (update) {
        // Silently download the update in the background
        await update.download();
        downloadedUpdate = update;
        console.log(`Silent update v${update.version} downloaded successfully. It will install when the app is closed.`);
      }
    } catch (err) {
      // Fail silently without disrupting normal user workflow
      console.warn('Silent update check failed:', err);
    }
  }, 5000);
}
