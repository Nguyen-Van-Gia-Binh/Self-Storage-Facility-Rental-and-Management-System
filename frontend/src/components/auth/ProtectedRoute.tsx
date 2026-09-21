// frontend/src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { tokenStorage, type UserRole } from '@/utils/tokenStorage';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const location = useLocation();
  const isAuthenticated = tokenStorage.isAuthenticated();

  // 1. Chưa đăng nhập -> chuyển hướng về Login, lưu lại trang đích để sau khi login quay lại
  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // 2. Đã đăng nhập nhưng không đủ vai trò cho phép -> 403 Forbidden
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = tokenStorage.hasRole(allowedRoles);
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 3. Hợp lệ -> cho phép truy cập
  return <>{children}</>;
};
