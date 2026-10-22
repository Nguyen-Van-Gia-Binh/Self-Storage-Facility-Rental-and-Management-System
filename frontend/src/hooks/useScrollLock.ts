import { useEffect } from 'react';

let lockCount = 0;
let originalBodyOverflow = '';
let originalMainOverflow = '';

/**
 * Khóa cuộn màn hình khi Modal/Lightbox mở.
 * Khóa an toàn cả `document.body` lẫn container `<main>` (nơi có overflow-y-auto trong DashboardLayout).
 * Sử dụng lockCount để hỗ trợ nhiều Modal/Lightbox lồng nhau mà không bị mất trạng thái khóa.
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    const mainElement = document.querySelector('main');

    if (lockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalMainOverflow = mainElement?.style.overflow ?? '';

      document.body.style.overflow = 'hidden';
      if (mainElement) {
        mainElement.style.overflow = 'hidden';
      }
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        const currentMain = document.querySelector('main');
        if (currentMain) {
          currentMain.style.overflow = originalMainOverflow;
        }
      }
    };
  }, [isLocked]);
}
