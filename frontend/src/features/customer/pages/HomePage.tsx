import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUnitTypes } from '@/api/unit';
import type { UnitTypeResponse } from '@/types/unit';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { useFacilityDirectory } from '../hooks/useFacilityDirectory';
import { HomeHeroSection } from '../components/HomeHeroSection';
import { HomeBranchesSection } from '../components/HomeBranchesSection';
import { HomeSizeGuideSection } from '../components/HomeSizeGuideSection';
import { HomeProcessAndFaqSection } from '../components/HomeProcessAndFaqSection';
import { HomeFooter } from '../components/HomeFooter';

/**
 * Trang chủ Khách hàng (Landing Page) SmartStorage tại /:
 * Cofounder Sky-Blue Pixel Aesthetic + Mô hình 3D kích thước thật từ Backend API & Policy.
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { facilities, isLoading } = useFacilityDirectory();
  const policy = useActivePolicy();

  const [unitTypes, setUnitTypes] = useState<UnitTypeResponse[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả thành phố');
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

  // Tải danh sách hạng kho thật của cơ sở ưu tiên để đồng bộ giá & kích thước 3D
  useEffect(() => {
    const numericId = Number(primaryFacilityId);
    if (!numericId || Number.isNaN(numericId)) return;

    let active = true;
    fetchUnitTypes(numericId, { size: 50, isActive: true })
      .then((res) => {
        if (active && res?.content) {
          setUnitTypes(res.content);
        }
      })
      .catch(() => {
        // Giữ thông số mặc định V16 nếu chưa kết nối API
      });

    return () => {
      active = false;
    };
  }, [primaryFacilityId]);

  const scrollToId = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Xử lý tìm kho: Nếu khu vực đã chọn chỉ có 1 cơ sở -> nhảy thẳng vào chọn ô kho
  const handleSearchSubmit = () => {
    if (filteredFacilities.length === 1) {
      navigate(`/customer/units?facility=${String(filteredFacilities[0].id)}`);
      return;
    }
    scrollToId('branches-grid');
  };

  const handleResetFilters = () => {
    setSelectedCity('Tất cả thành phố');
  };

  return (
    <div
      style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif" }}
      className="bg-white text-[#0a1614] antialiased selection:bg-[#0c5a8a] selection:text-white"
    >
      {/* 1. Hero Phong cách Cofounder + Công cụ Ước lượng 3D */}
      <HomeHeroSection
        primaryFacilityId={primaryFacilityId}
        facilitiesCount={facilities.length}
        unitTypes={unitTypes}
        onScrollToId={scrollToId}
      />

      {/* 2. Mạng lưới Chi nhánh */}
      <HomeBranchesSection
        isLoading={isLoading}
        availableCities={availableCities}
        cityFacilityCounts={cityFacilityCounts}
        totalFacilitiesCount={facilities.length}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        onSearchSubmit={handleSearchSubmit}
        onResetFilters={handleResetFilters}
        paginatedFacilities={paginatedFacilities}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setCurrentPage(page);
          scrollToId('branches');
        }}
      />

      {/* 3. Hai dòng kho & Nhu cầu */}
      <HomeSizeGuideSection unitTypes={unitTypes} />

      {/* 4. Quy trình, Lý do chọn SmartStorage, Feedback & FAQ */}
      <HomeProcessAndFaqSection policy={policy} />

      {/* 5. Footer */}
      <HomeFooter facilities={facilities} onScrollToId={scrollToId} />
    </div>
  );
};
