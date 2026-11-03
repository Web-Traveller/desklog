import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { getWorkstationId, sendHeartbeat } from '../services/telemetryService';
import { APP_VERSION } from '../constants/version';

interface AppNotificationBannerProps {
  allowed: boolean;
  onRetryCheck?: (allowed: boolean) => void;
}

const DEVELOPER_PHONE = '+91 8975805393';
const DEVELOPER_PHONE_RAW = '+918975805393';

export const AppNotificationBanner: React.FC<AppNotificationBannerProps> = ({
  allowed,
  onRetryCheck,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');
  const [copiedText, setCopiedText] = useState<'phone' | 'ref' | null>(null);

  // Trigger rich, detailed Sentry alert with high priority whenever an unauthorized/blocked workstation opens the app
  useEffect(() => {
    if (!allowed) {
      const wsId = getWorkstationId();
      const os = typeof navigator !== 'undefined' ? `${navigator.platform || 'Desktop'} (${navigator.userAgent})` : 'Desktop';
      const screenRes = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : 'Unknown';
      const timeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Unknown';
      const lang = typeof navigator !== 'undefined' ? navigator.language : 'Unknown';
      const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 'Unknown';

      Sentry.captureMessage(`[ALERT] Blocked Workstation Access Attempt: ${wsId}`, {
        level: 'error',
        tags: {
          event: 'workstation_blocked',
          workstation_id: wsId,
          app_version: APP_VERSION,
          platform: typeof navigator !== 'undefined' ? navigator.platform || 'Desktop' : 'Desktop',
          timezone: timeZone,
        },
        extra: {
          workstation_id: wsId,
          app_version: APP_VERSION,
          os_info: os,
          screen_resolution: screenRes,
          timezone: timeZone,
          system_language: lang,
          cpu_cores: cores,
          developer_contact: DEVELOPER_PHONE,
          timestamp: new Date().toISOString(),
          status: 'BLOCKED_BY_DEVELOPER',
        },
      });
    }
  }, [allowed]);

  const handleCopy = (text: string, type: 'phone' | 'ref') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryMessage('Contacting validation server...');
    try {
      // Contact Neon to get fresh real-time status
      const res = await sendHeartbeat();
      if (res) {
        if (onRetryCheck) {
          onRetryCheck(res.allowed);
        }
        if (!res.allowed) {
          const wsId = getWorkstationId();
          Sentry.captureMessage(`[ALERT] Blocked workstation retry failed: ${wsId}`, {
            level: 'error',
            tags: { event: 'retry_blocked_workstation', workstation_id: wsId },
            extra: {
              workstation_id: wsId,
              timestamp: new Date().toISOString(),
              retry_attempted: true,
            },
          });
          setRetryMessage('Verification failed. Workstation remains restricted. Please contact developer.');
        } else {
          setRetryMessage('Service verified successfully. Loading system...');
        }
      }
    } catch {
      setRetryMessage('Unable to reach validation server. Please check your internet connection.');
    } finally {
      setIsRetrying(false);
    }
  };

  // FULL-SCREEN DISCREET TECHNICAL SERVICE ERROR IF REMOTELY BLOCKED
  if (!allowed) {
    const wsId = getWorkstationId();
    const whatsappUrl = `https://wa.me/918975805393?text=${encodeURIComponent(
      `Hello, I am getting Service Initialization Error 0x8004100E on DeskLog (Ref: ${wsId}). Please assist.`
    )}`;

    return (
      <div className="fixed inset-0 z-[99999] bg-neutral-950/95 backdrop-blur-md flex items-center justify-center p-6 text-on-surface">
        <div className="max-w-md w-full bg-surface-container-lowest border border-surface-container-high rounded-3xl p-8 shadow-2xl flex flex-col gap-5 text-center animate-scaleUp">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-3xl">build_circle</span>
          </div>

          {/* Error Message */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">
              Service Initialization Error
            </h2>
            <p className="text-xs font-mono text-outline uppercase tracking-wider">
              Runtime Validation Code: 0x8004100E
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed pt-1">
              The application service could not complete initialization for this workstation. Please contact the developer for technical support and maintenance.
            </p>
          </div>

          {/* Contact Developer Card */}
          <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface">Developer / Technical Support:</span>
              <button
                type="button"
                onClick={() => handleCopy(DEVELOPER_PHONE, 'phone')}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">
                  {copiedText === 'phone' ? 'check' : 'content_copy'}
                </span>
                {copiedText === 'phone' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="text-base font-bold text-primary font-mono tracking-wide">
              {DEVELOPER_PHONE}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${DEVELOPER_PHONE_RAW}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition"
              >
                <span className="material-symbols-outlined text-sm text-primary">call</span>
                Call Developer
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition border border-emerald-500/20"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
                WhatsApp
              </a>
            </div>
          </div>

          {/* Diagnostic Ref */}
          <div className="bg-surface-container-lowest rounded-xl p-3 text-xs flex justify-between items-center text-on-surface-variant border border-surface-container">
            <span className="text-[11px] text-outline">System Diagnostic Ref:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-on-surface select-all">{wsId}</span>
              <button
                type="button"
                onClick={() => handleCopy(wsId, 'ref')}
                title="Copy Reference ID"
                className="text-outline hover:text-primary transition"
              >
                <span className="material-symbols-outlined text-xs">
                  {copiedText === 'ref' ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Action / Retry */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container hover:text-on-primary-container transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow"
            >
              <span className={`material-symbols-outlined text-base ${isRetrying ? 'animate-spin' : ''}`}>
                {isRetrying ? 'sync' : 'refresh'}
              </span>
              <span>{isRetrying ? 'Verifying...' : 'Re-check Service Status'}</span>
            </button>
            {retryMessage && (
              <p className="text-xs text-outline font-medium text-center">{retryMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
