import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { useAppUpdater } from '../hooks/useAppUpdater';
import { getWorkstationId, sendHeartbeat } from '../services/telemetryService';

interface AppNotificationBannerProps {
  allowed: boolean;
  onRetryCheck?: (allowed: boolean) => void;
}

export const AppNotificationBanner: React.FC<AppNotificationBannerProps> = ({
  allowed,
  onRetryCheck,
}) => {
  const { availableUpdate, isDownloading, downloadProgress, installUpdate } = useAppUpdater(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');

  // Trigger Sentry alert when a blocked workstation attempts to access the app
  useEffect(() => {
    if (!allowed) {
      const wsId = getWorkstationId();
      Sentry.captureMessage(`Workstation access blocked: ${wsId}`, {
        level: 'warning',
        tags: {
          event: 'workstation_blocked',
          workstation_id: wsId,
        },
        extra: {
          diagnostic_ref: wsId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [allowed]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryMessage('Checking system service status...');
    try {
      const res = await sendHeartbeat();
      if (res) {
        if (onRetryCheck) {
          onRetryCheck(res.allowed);
        }
        if (!res.allowed) {
          const wsId = getWorkstationId();
          Sentry.captureMessage(`Blocked workstation retry attempted: ${wsId}`, {
            level: 'info',
            tags: { event: 'retry_blocked_workstation', workstation_id: wsId },
          });
          setRetryMessage('Service verification failed. Please contact the developer for support.');
        } else {
          setRetryMessage('Service verified successfully.');
        }
      }
    } catch {
      setRetryMessage('Unable to reach server. Please check your internet connection.');
    } finally {
      setIsRetrying(false);
    }
  };

  // 1. DISCREET TECHNICAL SERVICE ERROR IF REMOTELY STOPPED
  if (!allowed) {
    const wsId = getWorkstationId();
    return (
      <div className="fixed inset-0 z-[99999] bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-6 text-on-surface">
        <div className="max-w-md w-full bg-surface-container-lowest border border-surface-container-high rounded-3xl p-8 shadow-2xl flex flex-col gap-5 text-center animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">build_circle</span>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">
              Service Initialization Error
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              The application service could not complete initialization for this workstation. Please contact the developer for technical support and maintenance.
            </p>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-3 text-xs flex justify-between items-center text-on-surface-variant border border-surface-container">
            <span>Diagnostic Ref:</span>
            <span className="font-mono text-[11px] font-semibold text-outline select-all">{wsId}</span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container hover:text-on-primary-container transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow"
            >
              <span className={`material-symbols-outlined text-base ${isRetrying ? 'animate-spin' : ''}`}>
                {isRetrying ? 'sync' : 'refresh'}
              </span>
              <span>{isRetrying ? 'Connecting...' : 'Retry Connection'}</span>
            </button>
            {retryMessage && (
              <p className="text-xs text-outline font-medium text-center">{retryMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. STANDARD IN-APP UPDATE NOTIFICATION
  if (availableUpdate) {
    return (
      <div className="bg-primary text-on-primary px-4 py-2.5 text-sm flex items-center justify-between shadow-md z-50 transition-all">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-lg">system_update</span>
          <span>
            <strong>Update Available:</strong> Version {availableUpdate.version} is ready for installation.
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
