// frontend/src/components/auth/UnauthorizedPage.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokenStorage } from '@/utils/tokenStorage';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = tokenStorage.getUser();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Truy cập bị từ chối (403)
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Tài khoản của bạn hiện tại không có quyền truy cập vào phân hệ này.
        </p>

        {currentUser && (
          <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-700 text-left mb-6 space-y-1">
            <p>
              <span className="font-semibold">Họ tên:</span> {currentUser.fullName}
            </p>
            <p>
              <span className="font-semibold">Vai trò hiện tại:</span>{' '}
              <span className="inline-block px-2 py-0.5 rounded bg-slate-200 font-bold text-slate-800">
                {currentUser.role}
              </span>
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            ← Quay lại
          </button>
          <Link
            to="/"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Về Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};
