import { useState, useEffect, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
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

export function useAppUpdater(autoCheck: boolean = true) {
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
    } catch (err: any) {
      console.warn('Update check failed:', err);
      const errMsg = err?.message || String(err);
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

      await state.availableUpdate.downloadAndInstall((event) => {
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
            statusMessage: 'Update installed! Restarting...',
          }));
        }
      });
    } catch (err: any) {
      console.error('Update install failed:', err);
      setState(prev => ({
        ...prev,
        isDownloading: false,
        error: err?.message || String(err),
        statusMessage: `Failed to install update: ${err?.message || err}`,
      }));
    }
  }, [state.availableUpdate]);

  useEffect(() => {
    if (autoCheck) {
      // Small delay on app boot to ensure main UI is loaded first
      const timer = setTimeout(() => {
        checkForUpdates(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoCheck, checkForUpdates]);

  return {
    ...state,
    checkForUpdates,
    installUpdate,
  };
}
