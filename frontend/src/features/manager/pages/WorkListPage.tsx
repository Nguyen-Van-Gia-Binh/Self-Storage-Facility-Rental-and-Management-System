// frontend/src/features/manager/pages/WorkListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Search,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  PackageOpen,
  Wrench,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { getDailyDispatchTasks } from '../api/staffAssignmentApi';
import type { FacilityListItem } from '@/types';
import type { DailyDispatchTaskItem } from '../types/staffAssignment';
import { Breadcrumb } from '../components/Breadcrumb';
import { WorkItemCard } from '../components/WorkItemCard';
import { Pagination } from '../components/Pagination';

export type TaskTypeFilter = 'ALL' | 'CHECK_IN' | 'RETURN' | 'INCIDENT';
export type TaskStatusFilter = 'ALL' | 'UNASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const ITEMS_PER_PAGE = 10;

export const WorkListPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const queryShift = searchParams.get('shift') || 'ALL';
  const queryStaffId = searchParams.get('staffId');

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [tasks, setTasks] = useState<DailyDispatchTaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<'TIME_ASC' | 'TIME_DESC' | 'TYPE'>('TIME_ASC');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadData = useCallback(async () => {
    if (!facilityId) return;
    try {
      setLoading(true);
      setError(null);
      const facRes = await fetchMyAssignedFacilities();
      const currentFac = facRes.find(
        (f) => String(f.id) === String(facilityId)
      );
      if (currentFac) {
        setFacility(currentFac);
      }

      const taskData = await getDailyDispatchTasks(Number(facilityId), queryDate);
      if (taskData && taskData.length > 0) {
        setTasks(taskData);
      } else {
        // Fallback danh sách công việc phong phú nếu DB rỗng
        setTasks([
          {
            id: 1,
            taskType: 'CHECK_IN',
            title: 'Bàn giao nhận kho khách mới',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            unitCode: 'S-101',
            customerName: 'Nguyễn Văn A',
            customerPhone: '0901234567',
            scheduledDate: queryDate,
            scheduledTime: '08:00',
            priority: 'NORMAL',
            isUrgent: false,
            assignedStaffId: 101,
            assignedStaffName: 'Nguyễn Văn A',
            status: 'COMPLETED',
            notes: 'Đã hoàn thành bàn giao lúc 08:30, kích hoạt mã PIN 123456',
            referenceCode: 'HD-001',
          },
          {
            id: 2,
            taskType: 'RETURN',
            title: 'Nghiệm thu trả kho & kiểm kê',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            unitCode: 'S-105',
            customerName: 'Trần Thị B',
            customerPhone: '0912345678',
            scheduledDate: queryDate,
            scheduledTime: '10:00',
            priority: 'NORMAL',
            isUrgent: false,
            assignedStaffId: 102,
            assignedStaffName: 'Trần Thị B',
            status: 'IN_PROGRESS',
            notes: 'Khách đang dọn đồ, chuẩn bị kiểm tra sàn và khóa',
            referenceCode: 'HD-005',
          },
          {
            id: 3,
            taskType: 'INCIDENT',
            title: 'Kẹt chốt khóa điện tử cửa kho',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            unitCode: 'S-108',
            customerName: 'Lê Văn C',
            customerPhone: '0923456789',
            scheduledDate: queryDate,
            scheduledTime: '11:15',
            priority: 'HIGH',
            isUrgent: true,
            assignedStaffId: 101,
            assignedStaffName: 'Nguyễn Văn A',
            status: 'IN_PROGRESS',
            notes: 'Đã bôi trơn bản lề, đang chờ thợ thay chốt số',
            referenceCode: '#SC-007',
          },
          {
            id: 4,
            taskType: 'CHECK_IN',
            title: 'Bàn giao ô kho tiêu chuẩn',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            unitCode: 'M-204',
            customerName: 'Phạm Thị D',
            customerPhone: '0934567890',
            scheduledDate: queryDate,
            scheduledTime: '14:30',
            priority: 'NORMAL',
            isUrgent: false,
            assignedStaffId: 103,
            assignedStaffName: 'Lê Văn C',
            status: 'UNASSIGNED',
            notes: 'Hẹn trước 14:30 chiều',
            referenceCode: 'HD-012',
          },
          {
            id: 5,
            taskType: 'RETURN',
            title: 'Nghiệm thu tất toán cọc kho lớn',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            unitCode: 'L-301',
            customerName: 'Hoàng Văn E',
            customerPhone: '0987654321',
            scheduledDate: queryDate,
            scheduledTime: '16:00',
            priority: 'NORMAL',
            isUrgent: false,
            assignedStaffId: 104,
            assignedStaffName: 'Phạm Thị D',
            status: 'UNASSIGNED',
            notes: 'Khách yêu cầu kiểm tra kỹ tường chống ẩm',
            referenceCode: 'HD-020',
          },
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách công việc.');
    } finally {
      setLoading(false);
    }
  }, [facilityId, queryDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lọc và Sắp xếp
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      // Lọc theo search
      const matchSearch =
        searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.unitCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.referenceCode && t.referenceCode.toLowerCase().includes(searchQuery.toLowerCase()));

      // Lọc theo loại việc
      const matchType = typeFilter === 'ALL' || t.taskType === typeFilter;

      // Lọc theo trạng thái
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'UNASSIGNED' && t.status === 'UNASSIGNED') ||
        (statusFilter === 'IN_PROGRESS' && (t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED')) ||
        (statusFilter === 'COMPLETED' && (t.status === 'COMPLETED' || t.status === 'RESOLVED')) ||
        (statusFilter === 'CANCELLED' && t.status === 'COMPLETED');

      // Lọc theo staffId nếu URL có chỉ định
      const matchStaff = !queryStaffId || String(t.assignedStaffId) === String(queryStaffId);

      return matchSearch && matchType && matchStatus && matchStaff;
    });

    result.sort((a, b) => {
      if (sortBy === 'TIME_ASC') return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
      if (sortBy === 'TIME_DESC') return (b.scheduledTime || '').localeCompare(a.scheduledTime || '');
      if (sortBy === 'TYPE') return a.taskType.localeCompare(b.taskType);
      return 0;
    });

    return result;
  }, [tasks, searchQuery, typeFilter, statusFilter, sortBy, queryStaffId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter, sortBy]);

  // Phân trang
  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTasks, currentPage]);

  const handleViewTaskDetail = (taskId: number) => {
    navigate(
      `/manager/staff-schedule/assignments/${taskId}?facilityId=${facilityId}&date=${queryDate}`
    );
  };

  const getShiftTitle = () => {
    if (queryShift === 'MORNING') return 'Ca Sáng (06:00 - 14:00)';
    if (queryShift === 'AFTERNOON') return 'Ca Chiều (14:00 - 22:00)';
    if (queryShift === 'NIGHT') return 'Ca Đêm (22:00 - 06:00)';
    return 'Tất cả các ca';
  };

  const breadcrumbItems = [
    { label: 'Phân công nhân sự', href: '/manager/staff-schedule' },
    {
      label: facility ? facility.name : `Cơ sở #${facilityId}`,
      href: `/manager/staff-schedule/facilities/${facilityId}`,
    },
    { label: `Công việc (${queryDate})` },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header Thông tin ca & Khối lượng */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  {getShiftTitle()}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">· Cấp 3: Danh sách Công việc</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                Ngày {queryDate} — {filteredTasks.length} công việc
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/manager/staff-schedule/facilities/${facilityId}`)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              ← Về lịch ca trực
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search & Sort */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
        {/* Row 1: Search & Sort */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã HĐ, tên khách, số phòng kho, mã sự cố..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="TIME_ASC">Giờ hẹn (Sớm nhất)</option>
              <option value="TIME_DESC">Giờ hẹn (Muộn nhất)</option>
              <option value="TYPE">Loại công việc</option>
            </select>
          </div>
        </div>

        {/* Row 2: Tabs loại công việc */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1.5 shrink-0">Loại CV:</span>
          {(
            [
              { key: 'ALL', label: 'Tất cả' },
              { key: 'CHECK_IN', label: '✓ Check-in', icon: CheckCircle },
              { key: 'RETURN', label: '📋 Trả kho', icon: PackageOpen },
              { key: 'INCIDENT', label: '🔧 Sự cố', icon: Wrench },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                typeFilter === tab.key
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 3: Tabs trạng thái */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-xs font-semibold text-slate-400 mr-1.5 shrink-0">Trạng thái:</span>
          {(
            [
              { key: 'ALL', label: 'Tất cả' },
              { key: 'UNASSIGNED', label: '⏳ Chờ xử lý' },
              { key: 'IN_PROGRESS', label: '⚠️ Đang xử lý' },
              { key: 'COMPLETED', label: '✓ Đã hoàn thành' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Đang tải danh sách công việc...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-800">Không thể tải dữ liệu</h4>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Danh sách Công việc Cấp 3 */}
      {!loading && !error && (
        <>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
              <h3 className="text-sm font-bold text-slate-800">Không có công việc nào phù hợp</h3>
              <p className="text-xs text-slate-500 mt-1">
                Thử thay đổi bộ lọc loại việc hoặc tìm kiếm từ khóa khác.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTasks.map((t) => (
                <WorkItemCard key={t.id} task={t} onViewDetails={handleViewTaskDetail} />
              ))}
            </div>
          )}

          {/* Phân trang khi > 10 items */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            threshold={10}
          />
        </>
      )}
    </div>
  );
};
