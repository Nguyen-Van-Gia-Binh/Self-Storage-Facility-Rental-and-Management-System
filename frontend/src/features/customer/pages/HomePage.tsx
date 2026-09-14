import React from 'react';
import { 
  Building2, 
  Layers, 
  Calendar, 
  UserCheck, 
  QrCode, 
  TicketCheck, 
  KeyRound, 
  LifeBuoy, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Search
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const HomePage: React.FC = () => {
  // Danh sách 8 màn hình chuẩn hóa từ WIREFRAMES-CUSTOMER.md (T1.13)
  const screens = [
    {
      id: 'SCR-SC-01',
      title: 'Khám phá & Tìm kiếm cơ sở',
      desc: 'Bộ lọc cơ sở theo Thành phố/Quận, bảng giá khởi điểm và mặt bằng kho.',
      useCase: 'UC-F1-01, 02',
      step: 'Khám phá',
      icon: <Building2 className="w-5 h-5 text-brand-600" />,
      color: 'bg-brand-50 border-brand-200',
    },
    {
      id: 'SCR-SC-01B',
      title: 'Chọn kích thước & Loại ô kho',
      desc: 'Kho tiêu chuẩn hoặc máy lạnh (Climate-controlled), các kích thước S, M, L, XL.',
      useCase: 'UC-F1-03, BR-AVL-01',
      step: 'Bước 1',
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      id: 'SCR-SC-02',
      title: 'Chọn thời hạn thuê',
      desc: 'Thuê từ 1, 3, 6 đến 12 tháng. Tự động tính tiền thuê và tiền cọc Deposit 1 tháng.',
      useCase: 'UC-F1-04, BR-DEP-01',
      step: 'Bước 2',
      icon: <Calendar className="w-5 h-5 text-sky-600" />,
      color: 'bg-sky-50 border-sky-200',
    },
    {
      id: 'SCR-SC-02B',
      title: 'Thông tin cá nhân & CCCD',
      desc: 'Khai báo thông tin định danh phục vụ đối chiếu thực địa khi nhận kho tại quầy.',
      useCase: 'UC-F1-05, BR-CHK-01',
      step: 'Bước 3',
      icon: <UserCheck className="w-5 h-5 text-violet-600" />,
      color: 'bg-violet-50 border-violet-200',
    },
    {
      id: 'SCR-SC-03',
      title: 'Thanh toán VietQR động',
      desc: 'QR thanh toán tự động, đếm ngược thời gian giữ slot 48 giờ theo BR-DEP-03.',
      useCase: 'UC-F1-06, BR-DEP-03',
      step: 'Bước 4',
      icon: <QrCode className="w-5 h-5 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-200',
    },
    {
      id: 'SCR-SC-03.1',
      title: 'Thẻ nhận kho điện tử (Move-in Pass)',
      desc: 'Vé QR đón tiếp tại quầy check-in, số phòng kho dự kiến và lịch hẹn tiếp đón.',
      useCase: 'UC-F1-09, BR-CHK-05',
      step: 'Vé Check-in',
      icon: <TicketCheck className="w-5 h-5 text-teal-600" />,
      color: 'bg-teal-50 border-teal-200',
    },
    {
      id: 'SCR-SC-04',
      title: 'Quản lý kho & Quyền mở cửa',
      desc: 'Quản lý hợp đồng Active, gia hạn hợp đồng (Flow 6) và yêu cầu hoàn trả cọc (Flow 3).',
      useCase: 'UC-F2-06, BR-ACC-01',
      step: 'My Rentals',
      icon: <KeyRound className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200',
    },
    {
      id: 'SCR-SC-06',
      title: 'Trung tâm hỗ trợ khách hàng',
      desc: 'Gửi ticket yêu cầu hỗ trợ sự cố, kẹt khoá và theo dõi xử lý trực tiếp.',
      useCase: 'UC-F7-01, Flow 7',
      step: 'Hỗ trợ',
      icon: <LifeBuoy className="w-5 h-5 text-rose-600" />,
      color: 'bg-rose-50 border-rose-200',
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Hệ thống kho tự quản thông minh hàng đầu</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Hệ Thống Thuê Kho Tự Quản Thông Minh{' '}
              <span className="text-brand-600">SmartStorage</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Cổng thông tin khách hàng thuê kho tự quản, tích hợp đặt chỗ online, thanh toán VietQR và thẻ mở cửa kỹ thuật số an toàn 24/7.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button size="lg" className="gap-2 shadow-md shadow-brand-500/25">
                Khám phá kho ngay <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg">
                Xem quy trình đặt kho
              </Button>
            </div>
          </div>

          {/* Search Demo Bar */}
          <div className="mt-12 max-w-3xl mx-auto bg-white p-3 rounded-2xl shadow-lg border border-slate-200/80 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input 
                placeholder="Nhập địa chỉ hoặc khu vực (Vd: Quận 7, TP. Thủ Đức...)" 
                className="border-0 focus:ring-0 text-sm"
              />
            </div>
            <Button className="gap-2 shrink-0">
              <Search className="w-4 h-4" /> Tìm cơ sở
            </Button>
          </div>
        </div>
      </section>

      {/* Wireframe Screens Mapping Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4" /> Dịch vụ & Tiện ích
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Quy Trình & Dịch Vụ Khách Hàng
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Trải nghiệm thuê kho tự quản trọn vẹn từ lúc đặt chỗ đến khi nhận phòng và quản lý chìa khóa số.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {screens.map((screen) => (
            <Card key={screen.id} hoverable className="flex flex-col justify-between h-full border-slate-200 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`p-2.5 rounded-xl border ${screen.color}`}>
                    {screen.icon}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {screen.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {screen.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {screen.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Tìm hiểu thêm</span>
                <span className="text-brand-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Chi tiết →
                </span>
              </div>
            </Card>
          ))}

        </div>
      </section>
    </div>
  );
};

