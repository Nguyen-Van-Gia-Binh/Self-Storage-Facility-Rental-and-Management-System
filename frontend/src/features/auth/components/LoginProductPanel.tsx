import React from 'react';
import authHeroImg from '@/assets/images/auth-hero-3d.jpg';

/**
 * Cột hình của màn đăng nhập: nền mint và ảnh cơ sở, hiển thị trọn khung.
 */
export const LoginProductPanel: React.FC = () => {
  return (
    <aside className="hidden overflow-y-auto bg-gradient-to-br from-brand-950 via-brand-800 to-brand-500 text-white lg:flex lg:w-1/2">
      <div className="m-auto w-full px-10 py-12 xl:px-16">
        <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
          Quản lý kho thông minh,
          <br />
          vận hành tối ưu.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100">
          Truy cập kho 24/7 và mở khóa thông minh trên thiết bị của bạn.
        </p>

        <div className="relative mt-8 w-full">
          <img
            src={authHeroImg}
            alt="Mô hình dịch vụ kho tự quản SmartStorage"
            className="h-auto w-full rounded-2xl"
          />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-[11px] text-white">
            <span className="rounded-full border border-white/20 bg-black/45 px-2.5 py-1 font-semibold">
              Cơ sở mở cửa 24/7
            </span>
            <span className="rounded-full border border-teal-400/30 bg-teal-900/80 px-2.5 py-1 font-medium">
              Hệ thống Smart Lock
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
