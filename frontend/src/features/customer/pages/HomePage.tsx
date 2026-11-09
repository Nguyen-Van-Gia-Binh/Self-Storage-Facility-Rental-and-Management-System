import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Warehouse,
  MapPin,
  Thermometer,
  DoorOpen,
  Network,
  ArrowRight,
  Video,
  Search,
  CheckCircle2,
  Radio,
  Truck,
  Box,
  KeyRound,
  ChevronDown,
  Headphones,
  ShieldCheck,
  Loader2,
  LockOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFacilityDirectory } from '../hooks/useFacilityDirectory';
import { HomeFacilityCard } from '../components/HomeFacilityCard';

export const HomePage: React.FC = () => {
  const { facilities, isLoading } = useFacilityDirectory();
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả thành phố');
  const [selectedStorageType, setSelectedStorageType] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const pageSize = 6;

  // Trích xuất danh sách Thành phố từ dữ liệu cơ sở thật
  const availableCities = useMemo(() => {
    const set = new Set(facilities.map((f) => f.city));
    return ['Tất cả thành phố', ...Array.from(set)];
  }, [facilities]);

  // Bộ lọc cơ sở theo thành phố và loại kho
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchCity = selectedCity === 'Tất cả thành phố' || f.city === selectedCity;
      return matchCity;
    });
  }, [facilities, selectedCity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCity]);

  const totalPages = Math.max(1, Math.ceil(filteredFacilities.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFacilities = useMemo(() => {
    return filteredFacilities.slice(startIndex, startIndex + pageSize);
  }, [filteredFacilities, startIndex, pageSize]);

  const scrollToId = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="bg-[#f2f9f7] text-[#0a1614] antialiased font-sans selection:bg-[#57b29a] selection:text-white">
      {/* 0. TOP UTILITY / ANNOUNCEMENT BAR (Dub.co clean style) */}
      <div className="bg-[#0a1614] text-slate-300 py-2 border-b border-slate-800 text-xs">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#57b29a]/20 text-[#57b29a] font-mono text-[11px] font-semibold border border-[#57b29a]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#57b29a] animate-pulse" /> Q2 PROMO
            </span>
            <span className="text-slate-300 text-xs font-normal">
              Ưu đãi thuê kho quý 2: Giảm ngay 40% cho hợp đồng từ 6 tháng. Mã:{' '}
              <strong className="text-white font-mono tracking-wider font-semibold">SMARTVN40</strong>
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium">
            <a
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              href="tel:19008899"
            >
              <Phone className="w-3.5 h-3.5 text-[#57b29a]" />
              Hotline: 1900 8899 (24/7)
            </a>
            <span className="h-3 w-px bg-slate-800 hidden sm:block" />
            <Link
              className="flex items-center gap-1 text-[#57b29a] hover:text-[#439782] transition-colors"
              to="/customer/my-units"
            >
              <LockOpen className="w-3.5 h-3.5" />
              Client Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 1. HERO SECTION DESKTOP & MOBILE */}
      <section className="relative bg-[#0a1614] overflow-hidden border-b border-slate-800">
        {/* Hero Background Photography Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            alt="SmartStorage Modern Self Storage Facility"
            className="w-full h-full object-cover opacity-35 object-right lg:object-[80%_center]"
            src="/assets/landing/hero-green.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1614] via-[#0a1614]/90 to-[#0a1614]/50 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1614] via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Copy & Value Proposition */}
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#57b29a]/15 text-[#57b29a] border border-[#57b29a]/30 text-xs font-medium font-mono">
                <span className="w-2 h-2 rounded-full bg-[#57b29a]" /> NỀN TẢNG KHO TỰ QUẢN THÔNG MINH
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.18]">
                Hệ Thống Kho Tự Quản{' '}
                <span className="text-[#57b29a] underline decoration-[#57b29a]/50 decoration-2 underline-offset-8">
                  Thông Minh &amp; An Toàn
                </span>{' '}
                Số 1 Việt Nam
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Lưu trữ đa dụng linh hoạt từ mini 1m² đến công nghiệp 100m². Tích hợp kiểm soát nhiệt ẩm ProSens,
                hệ thống khoá kỹ thuật số Insomniac Bluetooth 1-chạm, an ninh 4 lớp và gói bảo hiểm vật tư tiêu chuẩn 500 triệu đồng.
              </p>

              {/* 3 Quick Metrics Cards in Clean SaaS Style */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
                <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 text-[#57b29a]">
                    <Thermometer className="w-5 h-5" />
                    <span className="font-bold text-lg sm:text-xl text-white">100%</span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-[11px] text-slate-300 uppercase block mt-1 tracking-tight">
                    Khí Hậu Hóa Chuẩn
                  </span>
                </div>

                <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 text-[#57b29a]">
                    <DoorOpen className="w-5 h-5" />
                    <span className="font-bold text-lg sm:text-xl text-white">24/7</span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-[11px] text-slate-300 uppercase block mt-1 tracking-tight">
                    Ra Vào Bằng App
                  </span>
                </div>

                <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 text-[#57b29a]">
                    <Network className="w-5 h-5" />
                    <span className="font-bold text-lg sm:text-xl text-white">
                      {facilities.length > 0 ? `${facilities.length} Điểm` : '03 Điểm'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-[11px] text-slate-300 uppercase block mt-1 tracking-tight">
                    HCMC &amp; Hà Nội
                  </span>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToId('filter-bar')}
                  className="px-6 py-3 rounded-xl bg-[#57b29a] text-white font-semibold text-sm hover:bg-[#439782] transition-all shadow-sm flex items-center gap-2 active:scale-[0.98] cursor-pointer"
                >
                  <span>Tìm Kho &amp; Báo Giá Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToId('iot-tech')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4 text-[#57b29a]" />
                  <span>Xem Trực Tiếp Cơ Sở</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick-Filter Bar Anchored at the Bottom Edge of Hero (Dub.co SaaS style) */}
          <div className="mt-10 bg-white p-5 rounded-2xl border border-slate-200 shadow-md" id="filter-bar">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                scrollToId('branches');
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >
              {/* Filter 1: Chi Nhánh */}
              <div>
                <label className="block font-medium text-xs text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#57b29a]" /> Chọn Chi Nhánh / Tỉnh Thành
                  </span>
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-[#f2f9f7]/60 border border-slate-200 rounded-xl px-3 py-2.5 font-sans text-[#0a1614] text-xs font-medium focus:border-[#57b29a] focus:ring-1 focus:ring-[#57b29a] outline-none"
                >
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Loại Kho */}
              <div>
                <label className="block font-medium text-xs text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#57b29a]" /> Loại Hình Kho Lưu Trữ
                  </span>
                </label>
                <select
                  value={selectedStorageType}
                  onChange={(e) => setSelectedStorageType(e.target.value)}
                  className="w-full bg-[#f2f9f7]/60 border border-slate-200 rounded-xl px-3 py-2.5 font-sans text-[#0a1614] text-xs font-medium focus:border-[#57b29a] focus:ring-1 focus:ring-[#57b29a] outline-none"
                >
                  <option value="all">Tất cả loại kho</option>
                  <option value="standard">Kho Tiêu Chuẩn</option>
                  <option value="climate">Kho Máy Lạnh (Kiểm soát nhiệt ẩm)</option>
                </select>
              </div>

              {/* Filter 3: Diện Tích */}
              <div>
                <label className="block font-medium text-xs text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-[#57b29a]" /> Nhu Cầu Diện Tích (m²)
                  </span>
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full bg-[#f2f9f7]/60 border border-slate-200 rounded-xl px-3 py-2.5 font-sans text-[#0a1614] text-xs font-medium focus:border-[#57b29a] focus:ring-1 focus:ring-[#57b29a] outline-none"
                >
                  <option value="all">Tất cả diện tích</option>
                  <option value="mini">Mini Box (1m² - 4m² | Cá nhân)</option>
                  <option value="med">Kho Vừa (5m² - 10m² | Shop online)</option>
                  <option value="large">Kho Lớn (&gt;15m² | Doanh nghiệp &amp; Pallet)</option>
                </select>
              </div>

              {/* Filter 4: CTA Button */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-[#57b29a] text-white hover:bg-[#439782] transition-all py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Kiểm Tra Phòng Trống</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. DANH MỤC CÁC DÒNG KHO LƯU TRỮ CHUYÊN BIỆT (2 Dòng Kho Chuẩn: Tiêu Chuẩn & Máy Lạnh) */}
      <section className="py-16 bg-[#f2f9f7]" id="unit-types">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-[#57b29a] text-xs font-semibold uppercase tracking-wider block mb-2">
              CHUẨN HOÁ CƠ SỞ VẬT CHẤT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
              Danh Mục Các Dòng Kho Chuyên Biệt
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Hệ thống cung cấp 2 giải pháp lưu trữ tối ưu: Kho Tiêu Chuẩn thông thoáng tự nhiên và Kho Máy Lạnh kiểm soát nhiệt ẩm 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* CARD 1: Kho Tiêu Chuẩn */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md hover:border-[#57b29a]/40 transition-all">
              <div className="relative h-56 overflow-hidden bg-slate-100">
                <img
                  alt="Kho Tiêu Chuẩn"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpk7YAec-IooxmQWDZKBzHeE99-JnTcfvn4LwEyaM0v2lFFTz1mPfzqd6vdOIgxUwo1p9VpKrp2mwSgw6HR64kfqQo1faAzS_Hozwc9FrLnjENu9Qqe5obg4-716OJPxsmsurimk7_wXDN7j9eCw93o2OydAZt-D-C2CDCJZcc5VpgrI-_DgcllNob0BJ7kqtgYUG4bF_188hR8oOFmOP3YM1UB1E7Uo0OKnuAkgzK7lq64s71pTyIng"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#0a1614]/80 text-white backdrop-blur-sm">
                    KHO TIÊU CHUẨN
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" /> Còn trống
                  </span>
                </div>
                <span className="absolute bottom-3 right-3 bg-white text-slate-700 font-mono px-2 py-0.5 rounded-md shadow-sm text-xs font-medium border border-slate-200">
                  Độ ẩm &lt; 60%
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-bold text-lg text-[#0a1614]">Kho Tiêu Chuẩn</h3>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through">550.000đ</span>
                      <p className="font-bold text-xl text-[#57b29a] leading-none">
                        350.000đ<span className="text-xs font-normal text-slate-500">/tháng</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Lý tưởng cho nội thất gia đình, đồ đạc dọn nhà, hồ sơ doanh nghiệp, vali hành lý và hàng hóa thông thường.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Cửa cuốn tôn mạ kẽm cách âm, vách ngăn chống cháy EI60
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Hệ thống thông gió tự nhiên, kiểm soát độ ẩm dưới 60%
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      PCCC Sprinkler tự động đạt chuẩn thẩm duyệt CA PCCC
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Mã PIN Smart Lock riêng biệt cho từng ô kho, bảo mật 24/7
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">Diện tích: 1.0 - 25m²</span>
                  <Link
                    to="/customer/units?type=standard"
                    className="px-4 py-2 bg-[#f2f9f7] hover:bg-[#57b29a] hover:text-white text-[#0a1614] font-semibold rounded-xl transition-colors text-xs border border-slate-200 shadow-2xs"
                  >
                    Xem chi tiết kho
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD 2: Kho Máy Lạnh */}
            <div className="bg-white rounded-2xl border-2 border-[#57b29a] shadow-md flex flex-col overflow-hidden relative">
              <div className="bg-[#57b29a] text-white text-center py-1 font-mono text-[11px] tracking-wider font-semibold">
                ★ ĐIỀU HÒA KIỂM SOÁT NHIỆT ẨM CHUYÊN DỤNG 24/7
              </div>
              <div className="relative h-56 overflow-hidden bg-slate-100">
                <img
                  alt="Kho Máy Lạnh Nhiệt Độ Chuẩn 20C - 25C"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0XY2LeW1WWmvEX6Bhjzb77Mp1vjlOSj6Nh0o3YwvOO6NRp5XVrUDJR60FJRIKZuQ2hFEfl7z6UMTSrPQdlnHo3dmkxJ6HvZdOWPhB9gwiYdrVA-3YJxl6S8yFn5GMQBOrQYeCNdrteHcweCFkmlpQQYusyDlrzl1dQuBPH_QyBCcw5bWLrkgIcZxJaXXIl8bubJuJeKPLT9Cs_fMGhh1KVyLP_pLn434g8zCquc8QyJr8bhdElhrhTA"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#57b29a] text-white">
                    KHO MÁY LẠNH (20°C - 25°C)
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1 animate-pulse" /> Đã đặt chỗ 85%
                  </span>
                </div>
                <span className="absolute bottom-3 right-3 bg-white text-[#57b29a] font-mono px-2 py-0.5 rounded-md shadow-sm text-xs font-bold border border-slate-200">
                  IoT ProSens Live
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-bold text-lg text-[#0a1614]">Kho Máy Lạnh</h3>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through">1.050.000đ</span>
                      <p className="font-bold text-xl text-[#57b29a] leading-none">
                        500.000đ<span className="text-xs font-normal text-slate-500">/tháng</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Chuyên biệt cho mỹ phẩm cao cấp, thực phẩm chức năng, thiết bị điện tử, đồ gỗ đắt tiền và tài liệu nhạy cảm nhiệt ẩm.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Dải nhiệt ổn định 20°C - 25°C máy lạnh Daikin VRV 24/7
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Cảm biến IoT ProSens truyền số liệu nhiệt ẩm trực tiếp app
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Sàn sơn Epoxy kháng khuẩn chuẩn GMP, chống bụi ẩm
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#57b29a] shrink-0" />
                      Mã PIN Smart Lock riêng biệt cho từng ô kho, bảo mật 24/7
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">Diện tích: 1.0 - 25m²</span>
                  <Link
                    to="/customer/units?type=climate"
                    className="px-4 py-2 bg-[#57b29a] hover:bg-[#439782] text-white font-semibold rounded-xl transition-colors text-xs shadow-sm"
                  >
                    Đặt chỗ ngay
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HẠ TẦNG CÔNG NGHỆ & AN NINH IOT (Dark Deep Pine Obsidian SaaS Showcase) */}
      <section className="py-16 bg-[#0a1614] text-slate-100 relative overflow-hidden" id="iot-tech">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-slate-800 pb-6">
            <div>
              <span className="font-mono text-[#57b29a] text-xs font-semibold uppercase tracking-widest block mb-1">
                KIẾN TRÚC AN NINH ĐA TẦNG
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Hạ Tầng Công Nghệ IoT SmartStorage™
              </h2>
            </div>
            <p className="text-slate-400 max-w-md text-xs font-normal mt-3 md:mt-0 leading-relaxed">
              Tự động hóa hoàn toàn quy trình nhận kho. Khách hàng trực tiếp làm chủ khoang chứa thông qua giao thức mã hóa
              quân sự AES-256 trên Smartphone.
            </p>
          </div>

          {/* 4-Column Technical Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* ITEM 1: Khóa Insomniac SmartLock */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-[#57b29a]/60 transition-all group shadow-sm">
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-4 border border-slate-800">
                  <img
                    alt="Khóa Thông Minh Bluetooth Insomniac"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_N3sbCbvXWjzKDbKF0tLVjHSDPStYTUY6WM2x9ilnlYQxEZnVBMQgJ37BcBGgj4IF5ML6Yp0SilmJYbpy7l6nEiBBs33IGPay_CGTfJiXV5agbnzlmUXAtNfpim1qQEKwBAZ33INO1sfKZ0EUbP7gnRb4WMTYu63YatQedTsy5pNSfJ9KP2PSiW3EC1B_wcCYFxXsdGHlNeDiq_qLo3XNXQQGqjgIwYLURHBmheNntvTAVh6WCVaaRg"
                  />
                  <span className="absolute top-2 right-2 bg-black/80 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> BLE 5.3 Active
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2 text-[#57b29a]">
                  <LockOpen className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-white">Khóa Insomniac SmartLock™</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mở khoang bằng 1 chạm Bluetooth qua app hoặc chia sẻ mã PIN OTP cho nhân viên/người thân khi giao nhận hàng.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 flex justify-between">
                <span>NHẬN DIỆN: 0.2s</span>
                <span className="text-[#57b29a]">PIN: 24 THÁNG</span>
              </div>
            </div>

            {/* ITEM 2: Cảm biến IoT ProSens */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-[#57b29a]/60 transition-all group shadow-sm">
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-4 border border-slate-800">
                  <img
                    alt="Cảm biến IoT ProSens QM-211"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl5CDevTdG9ASQOOJRtLuPxcvH19ncwZUyw45m9tSg66KOuZh7vehVzioOWzQjjn05Bl4Du72dfNpgNXqVqptXwYngcqChaIJAcuRiLE9djACxar16ZFsbH9qssN5ZCNz7jOjyE36itcgZ8qMi5CaaeC5OjCPLcj8A2dKKOAQPh_KtG4xqLyyQqw_avrsVD7qbDiboOUJ4r91sxdVXXwTC5GotwFGZ3GQAViJwLrsKXPRsqwd5AYKtCQ"
                  />
                  <span className="absolute top-2 right-2 bg-black/80 text-[#57b29a] font-mono text-[10px] px-2 py-0.5 rounded-full border border-[#57b29a]/40 flex items-center gap-1">
                    <Radio className="w-3 h-3" /> Telemetry 5s
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2 text-[#57b29a]">
                  <Thermometer className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-white">Cảm Biến IoT ProSens</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Giám sát 24/7 độ ẩm, nhiệt độ và khói vi lượng bên trong từng khoang. Cảnh báo tức thời qua SMS nếu phát hiện biến thiên bất thường.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 flex justify-between">
                <span>SAI SỐ: ±0.3°C</span>
                <span className="text-[#57b29a]">ẨM: ±2% RH</span>
              </div>
            </div>

            {/* ITEM 3: Camera AI An Ninh 360 */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-[#57b29a]/60 transition-all group shadow-sm">
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-4 border border-slate-800">
                  <img
                    alt="Camera AI An Ninh 360 Độ"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHc4FFiWpIsKyXTKpMiDrG9bF2VTp4lzT8L8I23RchGA7qpVzoC3w0V7njxi9g0fow-CMnJpIq0PBoWbWluLrIznwoGoYZhOBoSm7ylw5t1HQme1Dp-zldELVjPzEEzNp6v3bo05GAO8UScO0l7PibiZAIxeaI6yP8qFvIhR4QpmEkq1ykRUqfMOBOjL7rpubjl2KnPdfX22ATG-Kre7LgvoEla03WG2hOwoMTa0diFCa1isZSgdORmw"
                  />
                  <span className="absolute top-2 right-2 bg-black/80 text-rose-400 font-mono text-[10px] px-2 py-0.5 rounded-full border border-rose-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> REC 4K CLOUD
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2 text-[#57b29a]">
                  <Video className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-white">Camera AI An Ninh 360°</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhận diện khuôn mặt tại cổng ra vào, phát hiện xâm nhập ngoài giờ, hồng ngoại ban đêm tầm nhìn 35m và lưu trữ an toàn 60 ngày.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 flex justify-between">
                <span>4K UHD</span>
                <span className="text-[#57b29a]">LƯU TRỮ: 60 NGÀY</span>
              </div>
            </div>

            {/* ITEM 4: Lối vào Drive-up & Bến bãi */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-[#57b29a]/60 transition-all group shadow-sm">
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-4 border border-slate-800">
                  <img
                    alt="Lối vào Drive-up bến bãi container"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuALvCUJ_tcnlDLRybkrTgKo6tFQQUdHcB6jXgcu0ZMEH8vsCYyzQSJhQBgOrveC26LjnjhzWvaIvicdhCgwDKGDW6eLSBO_sjZ-JjdquCJpmoBluBuS21oHJPIHq5MTJFuMSo5XQ0Gz1P4gl-dcErGdIfk5LoZOOdf5fLlPjVhkt0RgVAVS-zfjKoPfDDjsUB5KgCo8dw2LLmSZx5RMrBRxQDni1dXVtZHxcKs2_P-Py47ftBHGiGd23A"
                  />
                  <span className="absolute top-2 right-2 bg-black/80 text-[#96b3cf] font-mono text-[10px] px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Dock Leveler Sẵn
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2 text-[#57b29a]">
                  <Truck className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-white">Drive-up &amp; Xe Nâng Hàng</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Đường nội bộ rộng 8-10m. Trang bị xe nâng tự động 2.5 tấn, bàn nâng hạ dock leveler và xe đẩy thủy lực miễn phí cho khách hàng.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 flex justify-between">
                <span>TẢI XE: 10 TẤN</span>
                <span className="text-[#57b29a]">LỐI XE: 8M RỘNG</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GIẢI PHÁP LƯU TRỮ CHO MỌI NHU CẦU (Lifestyle & Business Grid 3 Cột) */}
      <section className="py-16 bg-[#f2f9f7] border-b border-slate-200">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
            <div>
              <span className="font-mono text-[#57b29a] text-xs font-semibold uppercase tracking-wider block mb-1">
                KHÔNG GIAN LINH HOẠT
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
                Giải Pháp Cho Từng Nhu Cầu Thực Tế
              </h2>
            </div>
            <p className="text-slate-600 text-xs max-w-md mt-2 md:mt-0 leading-relaxed">
              Đơn giản hóa việc lưu trữ ngắn hạn và dài hạn với chính sách hợp đồng tính theo từng tháng không ràng buộc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lifestyle 1: Chuyển Nhà & Sửa Nhà */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img
                    alt="Lưu trữ đồ đạc dọn nhà sửa nhà"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvgKpzavFnbJtlMMp4wMBP0x7n-6-_jma5xn00O8vyqossQBJDRv5HMjCSTqcYhXHYR8XP539KDWMMPa7MMboNr7RndCiq6tLMjLTz49F81RkwJEXiALSffZCu4fdgh4EQPXU7ricLLa8XuZswHyCt2wORf7qsTlpZ5otux5tV7jAWkzQDSXTomBghJdOGY01p4FnyGen4dZxAINdlQ-bIi938QecYXMwC4TUc67k7rn4HevY70NejRA"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaf7f3] text-[#006b58] border border-[#57b29a]/30">
                      CÁ NHÂN &amp; GIA ĐÌNH
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-base text-[#0a1614] mb-2">Chuyển Nhà &amp; Sửa Chữa Nhà Ở</h3>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Gửi trọn bộ nội thất sofa, giường nệm, đồ điện gia dụng trong thời gian tu sửa nhà cửa mà không lo trầy xước hay ẩm ướt.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-0">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                  <span>Khuyến nghị: 5m² - 12m²</span>
                  <span className="text-[#57b29a] font-semibold">Hỗ trợ xe tải</span>
                </div>
              </div>
            </div>

            {/* Lifestyle 2: Shop Online & E-Commerce */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img
                    alt="Kho lưu trữ hàng thương mại điện tử"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAksrjo-WqN1o1kEY5JV8J0ailb5BkfTTYzYiyHY6xURLOMPNDDBjPreuhbVfaVZIQNw6hl2kDXCAZ25Re6o8492toIS-KwRA_LuFDOE0qXxNW__WRt2jlBu3oGLLSQ88XiTO2OxAZju0yCFAKB1Q2FR1aN2ZszXcKgJelknyAo055AxX70aOVAWrOa_CEj-LbnP_Puq9IOyejDeOs-rnqz8e034dL5imXGanps6BbQWxXtDZMZ1Qle0g"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaf7f3] text-[#006b58] border border-[#57b29a]/30">
                      KINH DOANH ONLINE
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-base text-[#0a1614] mb-2">Shop Thời Trang &amp; E-Commerce</h3>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Kho trung tâm nội thành giúp shipper lấy hàng nhanh chóng. Quản lý kho bằng mã vạch, bàn đóng gói tiêu chuẩn ngay trước cửa kho.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-0">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                  <span>Khuyến nghị: 10m² - 25m²</span>
                  <span className="text-[#57b29a] font-semibold">Nhận hàng hộ 24/7</span>
                </div>
              </div>
            </div>

            {/* Lifestyle 3: Doanh Nghiệp & Hồ Sơ Bảo Mật */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img
                    alt="Kho hồ sơ tài liệu bảo mật cho doanh nghiệp"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAI3O42re2632VCGoMCc8VGmxraJYIoPdiuS66Ye_S9XGjoMHS_IqF2k-aLGz7ZrK34SFLbpInvXDyjAZAl_lpYANiT5RCQofbaPzr8peQROIAxiTYDQXTLP5mRyWmgkOMzzyFY0q1t72QVl48Py-_MLzinuJkEceeog8XCzIkNhSJ2tnWfa8fz4DIDNTAN8Mj-R895Rbd2DnYiXQJ4CA3JLUAA-izTsejkfQI6_myUTMy6L_Vj32nGvg"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaf7f3] text-[#006b58] border border-[#57b29a]/30">
                      DOANH NGHIỆP B2B
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-base text-[#0a1614] mb-2">Hồ Sơ Kế Toán &amp; Thiết Bị Văn Phòng</h3>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Lưu trữ chứng từ thuế, hợp đồng bảo mật, thiết bị sự kiện. Có hợp đồng xuất hóa đơn VAT đầy đủ, ký bảo mật NDA nghiêm ngặt.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-0">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                  <span>Khuyến nghị: 15m² - 50m²</span>
                  <span className="text-[#57b29a] font-semibold">Kệ sắt tiêu chuẩn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MẠNG LƯỚI CHI NHÁNH CƠ SỞ THỰC TẾ (Dynamic Data From Backend API) */}
      <section className="py-16 bg-[#f2f9f7] border-b border-slate-200" id="branches">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-[#57b29a] text-xs font-semibold uppercase tracking-wider block mb-1">
              VỊ TRÍ ĐẮC ĐỊA NỘI ĐÔ
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
              Mạng Lưới Cơ Sở SmartStorage Toàn Quốc
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Nằm ngay các trục đường vành đai và khu trung tâm, xe tải lưu thông không cấm giờ.
            </p>
          </div>

          {/* City Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {availableCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCity === city
                    ? 'bg-[#57b29a] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Grid cơ sở thật */}
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#57b29a] animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Đang tải danh sách cơ sở từ hệ thống...</p>
            </div>
          ) : paginatedFacilities.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-600">Không tìm thấy cơ sở nào phù hợp tiêu chí.</p>
              <button
                type="button"
                onClick={() => setSelectedCity('Tất cả thành phố')}
                className="mt-3 px-4 py-1.5 bg-[#57b29a] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Xem tất cả cơ sở
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedFacilities.map((fac, idx) => (
                <HomeFacilityCard key={fac.id} facility={fac} index={startIndex + idx} />
              ))}
            </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  scrollToId('branches');
                }}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    setCurrentPage(page);
                    scrollToId('branches');
                  }}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#57b29a] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  scrollToId('branches');
                }}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 6. QUY TRÌNH THUÊ KHO SỐ HÓA 3 BƯỚC */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-[#57b29a] text-xs font-semibold uppercase tracking-wider block mb-1">
              THỦ TỤC 100% ONLINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
              Nhận Kho Trong 3 Bước Trong 60 Giây
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Không cần chờ nhân viên trực quầy. Mọi thao tác ký hợp đồng và cấp khóa được số hóa tự động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-[#f2f9f7] p-6 rounded-2xl border border-slate-200 text-center shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center text-[#57b29a] shadow-sm border border-slate-200">
                <Box className="w-7 h-7" />
              </div>
              <span className="font-mono text-[11px] text-[#57b29a] font-bold block mb-1 tracking-wider">
                BƯỚC 01
              </span>
              <h3 className="font-bold text-base text-[#0a1614] mb-2">Chọn Kho &amp; Đặt Trực Tuyến</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lựa chọn kích thước từ 1m² đến 50m², cơ sở mong muốn và thời hạn thuê. Ký hợp đồng điện tử e-Sign bảo mật.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#f2f9f7] p-6 rounded-2xl border-2 border-[#57b29a] text-center shadow-md relative">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#57b29a] flex items-center justify-center text-white shadow-sm">
                <KeyRound className="w-7 h-7" />
              </div>
              <span className="font-mono text-[11px] text-[#57b29a] font-bold block mb-1 tracking-wider">
                BƯỚC 02
              </span>
              <h3 className="font-bold text-base text-[#0a1614] mb-2">Nhận Mã PIN &amp; Smart Key</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống kích hoạt khóa số Insomniac ngay tức thì. Mã số an toàn và Bluetooth Key được gửi qua SMS/Zalo.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#f2f9f7] p-6 rounded-2xl border border-slate-200 text-center shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center text-[#0a1614] shadow-sm border border-slate-200">
                <Truck className="w-7 h-7" />
              </div>
              <span className="font-mono text-[11px] text-[#57b29a] font-bold block mb-1 tracking-wider">
                BƯỚC 03
              </span>
              <h3 className="font-bold text-base text-[#0a1614] mb-2">Lái Xe Vào &amp; Cất Đồ 24/7</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quẹt app mở barrier tự động, lái xe đến tận cửa khoang lưu trữ, sử dụng xe nâng và cất giữ đồ đạc an toàn tuyệt đối.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQS & CTA BANNER CUỐI TRANG */}
      <section className="py-16 bg-[#f2f9f7] border-b border-slate-200" id="faqs">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            {/* FAQs Intro Left */}
            <div className="lg:col-span-4 space-y-4">
              <span className="font-mono text-[#57b29a] text-xs font-semibold uppercase tracking-wider block">
                GIẢI ĐÁP THẮC MẮC
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
                Câu Hỏi Thường Gặp (FAQs)
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tìm hiểu thêm về chính sách an ninh, thủ tục thanh toán và phương thức bảo vệ hàng hóa tại hệ thống SmartStorage Việt Nam.
              </p>
              <div className="pt-2">
                <a
                  className="inline-flex items-center gap-2 text-[#57b29a] font-semibold text-xs hover:underline"
                  href="tel:19008899"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Cần tư vấn thêm? Gọi Hotline 1900 8899</span>
                </a>
              </div>
            </div>

            {/* FAQs Accordions Right */}
            <div className="lg:col-span-8 space-y-3">
              {[
                {
                  q: 'Tôi có thể đến lấy hoặc cất đồ vào ban đêm hoặc ngày lễ không?',
                  a: 'Hoàn toàn được. SmartStorage hoạt động 24/7/365. Cổng barrier và cửa khoang đều sử dụng khóa điện tử Bluetooth, bạn có thể tự do ra vào bất kỳ khung giờ nào mà không cần báo trước với ban quản lý.',
                },
                {
                  q: 'Hàng hóa của tôi có được bảo hiểm rủi ro không?',
                  a: 'Mỗi hợp đồng thuê tại SmartStorage đều tự động đi kèm gói bảo hiểm hàng hóa cơ bản trị giá 100.000.000đ từ Bảo hiểm Bảo Việt. Đối với hàng hóa giá trị cao, khách hàng có thể nâng mức bồi thường lên tới 500 triệu đồng.',
                },
                {
                  q: 'Nếu tôi bận, đơn vị vận chuyển có thể tự đến giao hàng vào kho của tôi được không?',
                  a: 'Có. Bạn chỉ cần tạo mã PIN dùng một lần (One-Time PIN) trên ứng dụng SmartStorage và gửi cho tài xế hoặc shipper. Mã sẽ tự hủy ngay sau khi khoang đóng lại, đảm bảo an toàn tuyệt đối.',
                },
                {
                  q: 'Thời gian thuê tối thiểu là bao lâu và thủ tục thanh toán như thế nào?',
                  a: 'Thời gian thuê tối thiểu chỉ từ 01 tháng. Quý khách có thể gia hạn linh hoạt từng tháng một qua chuyển khoản ngân hàng hoặc thẻ tín dụng tự động. Không có phí phạt nếu thanh lý trước hạn (báo trước 7 ngày).',
                },
              ].map((item, index) => (
                <div key={item.q} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left font-semibold text-sm text-[#0a1614] flex justify-between items-center cursor-pointer gap-4"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#57b29a] shrink-0 transition-transform duration-200 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in-50">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Banner CTA in Deep Pine Obsidian + Mint Teal Accent */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-[#0a1614]"
            id="rent-now"
          >
            <div className="relative min-h-[20rem] sm:min-h-[22rem]">
              <img
                alt="Hệ thống kho hàng sạch đẹp SmartStorage"
                className="w-full h-full object-cover opacity-30 absolute inset-0"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIgGHrPRYf2P-ssfOCSchvdIucx1SG-h3PzBoq7AuCoiXL56W4-V3GqIartkdQC4kdEDEBqmm1oWbOc40yJCKcoVvbVxyDuGgpetTPNYIAhoJbdMh6sIEsbopzPAJO9RHHcwG_le7jdqhhVnCqP93IplAaAubYiOjPhhqT1E1CN9dzcmHelQJLlrHUTQhbybne9PQ6nJTnrDmjc0ROBjSlNtF3u8WzMULsnKeD0ax6foQgB8VT2lY7ug"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a1614] via-[#0a1614]/90 to-transparent" />
              <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-center max-w-2xl text-white">
                <span className="font-mono text-[#57b29a] text-xs uppercase tracking-widest block mb-2 font-bold">
                  SẴN SÀNG GIẢI PHÓNG KHÔNG GIAN CỦA BẠN
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight tracking-tight">
                  Giữ Trọn Sự Yên Tâm Với Không Gian Kho Chuẩn ISO 27001
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mb-6 max-w-lg leading-relaxed">
                  Đăng ký ngay hôm nay để nhận ưu đãi giảm 40% tháng đầu tiên và miễn phí xe tải vận chuyển nội thành cho hợp đồng từ 3 tháng.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/customer/units"
                    className="px-6 py-3 rounded-xl bg-[#57b29a] hover:bg-[#439782] text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Warehouse className="w-4 h-4" />
                    <span>Thuê Kho Trực Tuyến Ngay</span>
                  </Link>
                  <a
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium text-xs transition-all flex items-center gap-2"
                    href="tel:19008899"
                  >
                    <Phone className="w-4 h-4 text-[#57b29a]" />
                    <span>Hotline: 1900 8899</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER (Dub.co Dark Deep Pine Aesthetic) */}
      <footer className="bg-[#0a1614] text-slate-400 border-t border-slate-800">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          {/* Col 1: Brand & Certification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#57b29a] flex items-center justify-center text-white">
                <Warehouse className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight uppercase text-white">
                SmartStorage<span className="text-[#57b29a]">.vn</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hệ thống kho tự quản thông minh hàng đầu Việt Nam tích hợp mạng lưới IoT ProSens và khóa bảo mật Insomniac.
            </p>
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#57b29a]" />
              <span>ISO 27001 &amp; ISO 9001:2015 CERTIFIED</span>
            </div>
          </div>

          {/* Col 2: Network Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider font-mono">Facility Network</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => scrollToId('branches')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Mạng Lưới Toàn Quốc (HCMC, Hà Nội)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId('branches')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Chi Nhánh Phú Mỹ Hưng (Quận 7)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId('branches')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Trạm Sân Bay TSN (Tân Bình)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId('branches')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Chi Nhánh Duy Tân (Cầu Giấy, HN)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Specifications & IoT Tech */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider font-mono">Specifications &amp; API</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => scrollToId('unit-types')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Kho Tiêu Chuẩn &amp; Kho Máy Lạnh
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId('iot-tech')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Smart Lock Bluetooth API
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId('unit-types')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Corporate Long-term Leases
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId('iot-tech')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Security Protocol &amp; CCTV
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Safety Terms & Contact Hotline */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider font-mono">Safety &amp; Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Safety Terms &amp; Disclosures</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Quy Định PCCC &amp; Hàng Hóa</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Chính Sách Bảo Mật Dữ Liệu Camera</span>
              </li>
            </ul>
            <div className="pt-2 text-xs space-y-1">
              <p>
                Hotline: <strong className="text-[#57b29a] font-mono">1900 8899</strong>
              </p>
              <p>
                Email: <strong className="text-white">support@smartstorage.vn</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Footer Copyright */}
        <div className="border-t border-slate-800/80 py-6">
          <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-mono text-slate-500">
            <p>© 2026 SmartStorage Vietnam Logistics Ltd. All rights reserved. ISO 27001 Certified Facilities.</p>
            <div className="flex gap-4">
              <span className="hover:text-[#57b29a] transition-colors cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-[#57b29a] transition-colors cursor-pointer">Terms of Lease</span>
              <span>•</span>
              <span className="hover:text-[#57b29a] transition-colors cursor-pointer">Security Audit Report</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
