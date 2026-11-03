import { useState, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriEnv } from '../api/tauri';
import { APP_VERSION } from '../constants/version';

export interface UpdaterState {
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number; // percentage 0-100
  availableUpdate: Update | null;
  error: string | null;
  statusMessage: string;
}

/**
 * Manual update checker for the Settings page.
 *
 * Design: The background autoUpdater (autoUpdater.ts) handles silent download-on-close.
 * This hook handles the *manual* "Check for Updates" button — it checks and shows the
 * user what version is available. The "Install & Restart" button downloads and installs
 * immediately (user-initiated, with progress). No autoCheck to avoid double-polling.
 *
 * NOTE: If the silent updater has already armed the close hook with a downloaded update,
 * the user clicking "Install & Restart" here will perform a fresh download+install, which
 * is fine — NSIS is idempotent and the Tauri plugin handles overlapping installs safely.
 */
export function useAppUpdater() {
  const [state, setState] = useState<UpdaterState>({
    isChecking: false,
    isDownloading: false,
    downloadProgress: 0,
    availableUpdate: null,
    error: null,
    statusMessage: '',
  });

  const checkForUpdates = useCallback(async (manual: boolean = false) => {
    if (!isTauriEnv()) {
      if (manual) {
        setState(prev => ({
          ...prev,
          statusMessage: 'Updates are only available in the installed desktop app.',
        }));
      }
      return null;
    }

    setState(prev => ({
      ...prev,
      isChecking: true,
      error: null,
      statusMessage: 'Checking for updates...',
    }));

    try {
      const update = await check();
      if (update) {
        setState(prev => ({
          ...prev,
          isChecking: false,
          availableUpdate: update,
          statusMessage: `Version ${update.version} is available!`,
        }));
        return update;
      } else {
        setState(prev => ({
          ...prev,
          isChecking: false,
          availableUpdate: null,
          statusMessage: `You are on the latest version (v${APP_VERSION}).`,
        }));
        return null;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('[useAppUpdater] Update check failed:', err);
      setState(prev => ({
        ...prev,
        isChecking: false,
        error: errMsg,
        statusMessage: manual ? `Unable to reach update server: ${errMsg}` : '',
      }));
      return null;
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!state.availableUpdate) return;

    setState(prev => ({
      ...prev,
      isDownloading: true,
      downloadProgress: 0,
      statusMessage: 'Downloading update...',
    }));

    try {
      let totalBytes = 0;
      let downloadedBytes = 0;

      // Download with progress tracking
      await state.availableUpdate.download((event) => {
        if (event.event === 'Started') {
          totalBytes = event.data.contentLength || 0;
        } else if (event.event === 'Progress') {
          downloadedBytes += event.data.chunkLength;
          if (totalBytes > 0) {
            const percent = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
            setState(prev => ({
              ...prev,
              downloadProgress: percent,
              statusMessage: `Downloading update: ${percent}%`,
            }));
          }
        } else if (event.event === 'Finished') {
          setState(prev => ({
            ...prev,
            downloadProgress: 100,
            statusMessage: 'Installing update...',
          }));
        }
      });

      // Install immediately (user-initiated — they clicked the button intentionally).
      // tauri.conf.json windows.installMode = "quiet" ensures NSIS runs with /S.
      // The Tauri plugin exits the app after launching the installer on Windows.
      await state.availableUpdate.install({ restartAfterInstall: true });

      // On Windows, install() exits the process. Code below here is unreachable on Windows
      // but kept as a clean fallback for other platforms.
      setState(prev => ({
        ...prev,
        isDownloading: false,
        statusMessage: 'Update installed. Please restart the app.',
      }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[useAppUpdater] Install failed:', err);
      setState(prev => ({
        ...prev,
        isDownloading: false,
        error: errMsg,
        statusMessage: `Failed to install update: ${errMsg}`,
      }));

      // Safety: ensure window is still usable after a failed install
      try {
        await getCurrentWindow().destroy();
      } catch {
        // ignore if destroy also fails
      }
    }
  }, [state.availableUpdate]);

  return {
    ...state,
    checkForUpdates,
    installUpdate,
  };
}
