import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Lock, LogIn, UserPlus, Plus } from 'lucide-react';

/**
 * MyUnitsGuestPrompt — Card Yêu cầu đăng nhập thân thiện dành cho khách vãng lai
 */
export const MyUnitsGuestPrompt: React.FC = () => {
  return (
    <Card className="p-8 sm:p-12 text-center bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4 max-w-2xl mx-auto my-6">
      <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto text-brand-600 shadow-xs">
        <Lock className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Vui lòng đăng nhập để xem kho của tôi
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Bạn cần đăng nhập tài khoản khách hàng để tra cứu danh sách các ô kho đang thuê, xem mã PIN mở cửa, gia hạn hợp đồng hoặc đăng ký trả kho.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link to="/auth/login?redirect=/customer/my-units" className="w-full sm:w-auto">
          <Button variant="primary" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" />
            Đăng nhập ngay
          </Button>
        </Link>
        <Link to="/auth/register" className="w-full sm:w-auto">
          <Button variant="outline" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            Đăng ký tài khoản
          </Button>
        </Link>
        <Link to="/customer" className="w-full sm:w-auto">
          <Button variant="outline" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2 text-brand-600 border-brand-200 hover:bg-brand-50">
            <Plus className="w-4 h-4" />
            Tìm ô kho mới
          </Button>
        </Link>
      </div>
    </Card>
  );
};
