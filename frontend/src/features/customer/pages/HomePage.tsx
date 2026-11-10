import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFacilityDirectory } from '../hooks/useFacilityDirectory';
import { HomeHeroSection } from '../components/HomeHeroSection';
import { HomeSizeGuideSection } from '../components/HomeSizeGuideSection';
import { HomeBranchesSection } from '../components/HomeBranchesSection';
import { HomeProcessAndFaqSection } from '../components/HomeProcessAndFaqSection';
import { HomeFooter } from '../components/HomeFooter';

/**
 * Trang chủ Khách hàng (Landing Page) SmartStorage:
 * - Tập trung trải nghiệm đặt kho thực tế: ước lượng kích thước, lọc chi nhánh & chuyển thẳng tới UnitPickerPage
 * - Nội dung 100% sát quy định nghiệp vụ hệ thống (48h hold, VNPay, PIN 6 số, hủy 3 tầng, trả kho 30 ngày)
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { facilities, isLoading } = useFacilityDirectory();

  const [selectedCity, setSelectedCity] = useState<string>('Tất cả thành phố');
  const [selectedStorageType, setSelectedStorageType] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Trích xuất danh sách Tỉnh/Thành phố từ dữ liệu cơ sở thật
  const availableCities = useMemo(() => {
    const set = new Set(facilities.map((f) => f.city));
    return ['Tất cả thành phố', ...Array.from(set)];
  }, [facilities]);

  // Đếm số lượng cơ sở thật theo từng tỉnh thành từ CSDL
  const cityFacilityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Tất cả thành phố': facilities.length,
    };
    facilities.forEach((f) => {
      counts[f.city] = (counts[f.city] || 0) + 1;
    });
    return counts;
  }, [facilities]);

  // Bộ lọc cơ sở theo thành phố
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      return selectedCity === 'Tất cả thành phố' || f.city === selectedCity;
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

  const primaryFacilityId = filteredFacilities[0]?.id ?? facilities[0]?.id;

  const scrollToId = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Xử lý tìm kho: Nếu khu vực đã chọn chỉ có 1 cơ sở -> nhảy thẳng vào chọn ô kho kèm bộ lọc
  const handleSearchSubmit = () => {
    if (filteredFacilities.length === 1) {
      const params = new URLSearchParams({
        facility: String(filteredFacilities[0].id),
      });
      if (selectedStorageType !== 'all') {
        params.set('storageType', selectedStorageType);
      }
      if (selectedSize !== 'all') {
        params.set('size', selectedSize);
      }
      navigate(`/customer/units?${params.toString()}`);
      return;
    }
    scrollToId('branches');
  };

  const handleResetFilters = () => {
    setSelectedCity('Tất cả thành phố');
    setSelectedStorageType('all');
    setSelectedSize('all');
  };

  return (
    <div className="bg-[#f2f9f7] text-[#0a1614] antialiased font-sans selection:bg-[#57b29a] selection:text-white">
      <HomeHeroSection
        primaryFacilityId={primaryFacilityId}
        facilitiesCount={facilities.length}
        onScrollToId={scrollToId}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        availableCities={availableCities}
        cityFacilityCounts={cityFacilityCounts}
        totalFacilitiesCount={facilities.length}
        selectedStorageType={selectedStorageType}
        onSelectStorageType={setSelectedStorageType}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        onSearchSubmit={handleSearchSubmit}
      />

      <HomeSizeGuideSection
        primaryFacilityId={primaryFacilityId}
        onScrollToBranches={() => scrollToId('branches')}
      />

      <HomeBranchesSection
        isLoading={isLoading}
        availableCities={availableCities}
        cityFacilityCounts={cityFacilityCounts}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        selectedStorageType={selectedStorageType}
        selectedSize={selectedSize}
        onResetFilters={handleResetFilters}
        paginatedFacilities={paginatedFacilities}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setCurrentPage(page);
          scrollToId('branches');
        }}
      />

      <HomeProcessAndFaqSection
        primaryFacilityId={primaryFacilityId}
        onScrollToBranches={() => scrollToId('branches')}
      />

      <HomeFooter facilities={facilities} onScrollToId={scrollToId} />
    </div>
  );
};
