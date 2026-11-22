import { useEffect } from 'react';

let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';

export function lockScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  lockCount++;
}

export function unlockScroll(): void {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
  }
}

/**
 * React hook that prevents background body/HTML scrolling while a modal/popup is open.
 * Uses reference counting so nested modals (e.g. Confirm over Edit) correctly maintain
 * scroll lock until the last modal closes.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isLocked]);
}
