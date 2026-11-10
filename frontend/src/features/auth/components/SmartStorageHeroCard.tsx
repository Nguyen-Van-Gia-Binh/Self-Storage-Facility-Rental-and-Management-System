import React, { useRef, useEffect } from 'react';
import { LockKeyhole, ScanLine } from 'lucide-react';
import authHeroImg from '@/assets/images/auth-hero-3d.jpg';

/**
 * Thẻ hiển thị mô hình 3D SmartStorage đứng vững chãi, chuyển động tinh tế bên trong (60fps GPU-only):
 * - Khung ảnh cố định vững vàng (không lắc ngang/nhấp nhô gây chóng mặt), chỉ thở zoom siêu nhẹ 2.5%
 * - Các điểm chuyển động sống bên trong mô hình: Tia quét Laser QR trên điện thoại, đèn Barie 24/7,
 *   ánh đèn ô kho thông minh, bảng hiệu SmartStorage và đèn pha xe tải
 * - Tương tác 3D Parallax cực êm chỉ khi rê chuột vào (0 re-render React)
 */
export const SmartStorageHeroCard: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * 5;   // Nghiêng rất nhẹ ±2.5deg khi di chuột
    const rotateX = (0.5 - y) * 3.5; // Nghiêng nhẹ ±1.75deg theo trục dọc
    const glareX = Math.round(x * 100);
    const glareY = Math.round(y * 100);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      el.classList.add('is-hovering');
      el.style.setProperty('--tilt-rx', `${rotateX.toFixed(2)}deg`);
      el.style.setProperty('--tilt-ry', `${rotateY.toFixed(2)}deg`);
      el.style.setProperty('--glare-x', `${glareX}%`);
      el.style.setProperty('--glare-y', `${glareY}%`);
      el.style.setProperty('--glare-opacity', '1');
    });
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    el.classList.remove('is-hovering');
    el.style.setProperty('--tilt-rx', '0deg');
    el.style.setProperty('--tilt-ry', '0deg');
    el.style.setProperty('--glare-opacity', '0');
  };

  return (
    <div
      ref={cardRef}
      data-testid="smart-storage-hero-tilt"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ aspectRatio: '1024 / 682' }}
      className="hero-steady-tilt relative w-full rounded-2xl overflow-hidden border border-white/25 hover:border-emerald-300/60 bg-white/10 shadow-2xl backdrop-blur-md group select-none"
    >
      {/* Lớp 1: Toàn cảnh ảnh & các điểm chuyển động khớp 100% tọa độ */}
      <div className="relative w-full h-full hero-ken-burns">
        <img
          src={authHeroImg}
          alt="Mô hình dịch vụ kho tự quản SmartStorage"
          draggable={false}
          className="w-full h-full object-cover object-center"
        />

        {/* 1a. Tia laser quét mã QR trên màn hình điện thoại cô gái */}
        <div
          aria-hidden="true"
          style={{
            left: '10.2%',
            top: '51.2%',
            width: '4.5%',
            height: '6.8%',
            transform: 'rotate(-11deg)',
          }}
          className="absolute overflow-hidden rounded-[2px] border border-emerald-400/50 bg-emerald-400/10 pointer-events-none"
        >
          <div className="w-full h-[2px] bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.9)] hero-qr-laser" />
        </div>

        {/* 1b. Ánh đèn thông minh bên trong các ô kho tầng 1 & tầng 2 */}
        <div
          aria-hidden="true"
          style={{ left: '34.2%', top: '34%', width: '5%', height: '6%' }}
          className="absolute rounded-full bg-emerald-300/35 blur-sm pointer-events-none hero-unit-glow"
        />
        <div
          aria-hidden="true"
          style={{ left: '41.2%', top: '47%', width: '5%', height: '6%', animationDelay: '1.8s' }}
          className="absolute rounded-full bg-emerald-200/35 blur-sm pointer-events-none hero-unit-glow"
        />

        {/* 1c. Đèn tín hiệu cảm biến cổng barie thông minh 24/7 */}
        <div
          aria-hidden="true"
          style={{ left: '59.6%', top: '62.5%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-85" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400/90 shadow-[0_0_10px_rgba(52,211,153,1)]" />
          </span>
        </div>

        {/* 1d. Hào quang phát sáng nhẹ tại bảng hiệu SmartStorage */}
        <div
          aria-hidden="true"
          style={{ left: '53%', top: '34.5%', width: '14%', height: '7%' }}
          className="absolute rounded-full bg-emerald-200/25 blur-md pointer-events-none hero-neon-pulse"
        />

        {/* 1e. Đèn pha xe tải giao nhận */}
        <div
          aria-hidden="true"
          style={{ left: '84.3%', top: '62.2%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-100/90 blur-[2px] shadow-[0_0_10px_3px_rgba(254,243,199,0.9)] pointer-events-none hero-neon-pulse"
        />
        <div
          aria-hidden="true"
          style={{ left: '87.9%', top: '62.8%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-100/90 blur-[2px] shadow-[0_0_10px_3px_rgba(254,243,199,0.9)] pointer-events-none hero-neon-pulse"
        />
      </div>

      {/* Lớp 2: Vệt sáng quét qua bề mặt kính tòa nhà */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none hero-light-sheen"
      />

      {/* Lớp 3: Phản chiếu ánh sáng bám theo con trỏ chuột */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: 'var(--glare-opacity, 0)',
          background:
            'radial-gradient(circle 200px at var(--glare-x, 50%) var(--glare-y, 50%), rgba(158, 212, 196, 0.22), transparent 70%)',
        }}
      />

      {/* Lớp 4: Hạt sáng IoT bay nhẹ */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="hero-particle-1 absolute left-[16%] bottom-12 w-1.5 h-1.5 rounded-full bg-emerald-300/80 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
        <span className="hero-particle-2 absolute left-[52%] bottom-14 w-1 h-1 rounded-full bg-teal-200/80 shadow-[0_0_6px_rgba(153,246,228,0.85)]" />
        <span className="hero-particle-3 absolute left-[82%] bottom-12 w-1.5 h-1.5 rounded-full bg-emerald-200/75 shadow-[0_0_8px_rgba(167,243,208,0.85)]" />
      </div>

      {/* Lớp 5: Gradient chân thẻ giúp chữ dễ đọc */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#0e3f37]/85 via-transparent to-transparent pointer-events-none"
      />

      {/* Lớp 6: Hai huy hiệu trạng thái trực tiếp */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
        <span className="font-semibold flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Cơ sở mở cửa 24/7
        </span>

        <span className="text-[11px] text-teal-100 bg-teal-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-teal-400/30 font-medium inline-flex items-center gap-1.5 shadow-sm">
          <ScanLine className="w-3 h-3 text-emerald-300 animate-pulse" />
          <LockKeyhole className="w-3 h-3 text-emerald-300" />
          Hệ thống Smart Lock
        </span>
      </div>
    </div>
  );
};
