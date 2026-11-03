import React, { useState } from 'react';
import { useAppUpdater } from '../hooks/useAppUpdater';
import { getWorkstationId, setLicenseKey, sendHeartbeat } from '../services/telemetryService';

interface AppNotificationBannerProps {
  licenseStatus: string;
  appActive: boolean;
  onRefreshLicense?: (status: string, active: boolean) => void;
}

export const AppNotificationBanner: React.FC<AppNotificationBannerProps> = ({
  licenseStatus,
  appActive,
  onRefreshLicense,
}) => {
  const { availableUpdate, isDownloading, downloadProgress, installUpdate } = useAppUpdater(true);
  const [newKey, setNewKey] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage('Checking with cloud license server...');
    if (newKey.trim()) {
      setLicenseKey(newKey.trim());
    }
    try {
      const res = await sendHeartbeat();
      if (res) {
        if (onRefreshLicense) {
          onRefreshLicense(res.status, res.app_active);
        }
        if (res.status === 'SUSPENDED' || !res.app_active) {
          setRefreshMessage('Status: License is still suspended. Please contact developer.');
        } else {
          setRefreshMessage('Success: License reactivated!');
        }
      }
    } catch {
      setRefreshMessage('Unable to reach license server. Check internet connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 1. FULL-SCREEN BLOCKING LOCK IF SUSPENDED OR INACTIVE
  if (!appActive || licenseStatus === 'SUSPENDED') {
    const wsId = getWorkstationId();
    return (
      <div className="fixed inset-0 z-[99999] bg-neutral-900/95 backdrop-blur-lg flex items-center justify-center p-6 text-on-surface">
        <div className="max-w-md w-full bg-surface-container-lowest border border-error/30 rounded-3xl p-8 shadow-2xl flex flex-col gap-5 text-center animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">block</span>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">
              Software License Suspended
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Commercial access to DeskLog for this installation has been suspended by the developer. Please clear any outstanding project invoices or contact your software provider to reactivate your license.
            </p>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-4 text-xs flex flex-col gap-2 text-left border border-surface-container">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Workstation ID:</span>
              <span className="font-mono text-[11px] font-semibold text-primary">{wsId}</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>License Status:</span>
              <span className="font-mono text-error font-bold uppercase">{licenseStatus}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label className="text-xs text-on-surface-variant font-medium">
              Enter New License Key:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. DSK-XXXX-XXXX"
                className="flex-1 px-3 py-2 text-xs bg-surface-container-low border border-surface-container rounded-xl font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container hover:text-on-primary-container transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow"
            >
              <span className={`material-symbols-outlined text-base ${isRefreshing ? 'animate-spin' : ''}`}>
                {isRefreshing ? 'sync' : 'refresh'}
              </span>
              <span>{isRefreshing ? 'Verifying...' : 'Check & Reactivate License'}</span>
            </button>
            {refreshMessage && (
              <p className="text-xs text-outline font-medium text-center">{refreshMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. IN-APP UPDATE NOTIFICATION BANNER
  if (availableUpdate) {
    return (
      <div className="bg-primary text-on-primary px-4 py-2.5 text-sm flex items-center justify-between shadow-md z-50 transition-all">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-lg">system_update</span>
          <span>
            <strong>New Update Available:</strong> Version {availableUpdate.version} is ready for installation.
          </span>
        </div>
        <div>
          {isDownloading ? (
            <span className="text-xs font-semibold px-3 py-1 bg-white/20 rounded-full">
              Downloading... {downloadProgress}%
            </span>
          ) : (
            <button
              onClick={installUpdate}
              className="text-xs bg-white text-primary font-bold px-3 py-1.5 rounded-full shadow hover:bg-neutral-100 transition active:scale-95"
            >
              Download & Restart
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
