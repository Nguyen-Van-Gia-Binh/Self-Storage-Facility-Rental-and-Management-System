// frontend/src/features/manager/pages/ContractListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  AlertCircle,
  Building2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { getManagerContracts } from '@/api/contract';
import type { FacilityListItem } from '@/types';
import type { ManagerContractItem } from '@/types/contractManager';
import { Breadcrumb } from '../components/Breadcrumb';
import { ContractTable, type ContractSortField, type SortDirection } from '../components/ContractTable';
import { Pagination } from '../components/Pagination';
import { CreateDirectContractModal } from '../components/CreateDirectContractModal';
import { SettlementApprovalModal } from '../components/SettlementApprovalModal';

export type ContractTabFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'PENDING_RETURN'
  | 'OVERDUE'
  | 'TERMINATED'
  | 'CLOSED'
  | 'PENDING_CHECK_IN';

const STATUS_TABS: { label: string; value: ContractTabFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đang hiệu lực', value: 'ACTIVE' },
  { label: 'Chờ quyết toán', value: 'PENDING_RETURN' },
  { label: 'Quá hạn', value: 'OVERDUE' },
  { label: 'Đã chấm dứt', value: 'TERMINATED' },
  { label: 'Đã đóng', value: 'CLOSED' },
  { label: 'Chờ nhận kho', value: 'PENDING_CHECK_IN' },
];

const DEFAULT_PAGE_SIZE = 10;

export const ContractListPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const facilityIdNum = Number(facilityId) || 0;

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [contracts, setContracts] = useState<ManagerContractItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<ContractTabFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort
  const [sortField, setSortField] = useState<ContractSortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDirectContractModal, setShowDirectContractModal] = useState(false);
  const [selectedForSettlement, setSelectedForSettlement] = useState<ManagerContractItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleDirectContractSuccess = (_newContract: unknown, message: string) => {
    setToastMessage({ text: message, type: 'success' });
    loadData(true);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (isManual = false) => {
    if (!facilityIdNum) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Tải thông tin cơ sở
      const facList = await fetchMyAssignedFacilities();
      const currentFac = facList.find((f) => f.id === facilityIdNum) || null;
      setFacility(currentFac);

      // 2. Tải danh sách hợp đồng của cơ sở
      const list = await getManagerContracts({ facilityId: facilityIdNum, status: 'ALL' });
      setContracts(list || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách hợp đồng:', err);
      setError('Không thể tải danh sách hợp đồng của cơ sở này.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityIdNum]);

  // Đếm số lượng theo từng tab trạng thái
  const tabCounts = useMemo(() => {
    const counts: Record<ContractTabFilter, number> = {
      ALL: contracts.length,
      ACTIVE: 0,
      PENDING_RETURN: 0,
      OVERDUE: 0,
      TERMINATED: 0,
      CLOSED: 0,
      PENDING_CHECK_IN: 0,
    };
    contracts.forEach((c) => {
      if (counts[c.status as ContractTabFilter] !== undefined) {
        counts[c.status as ContractTabFilter] += 1;
      }
      if ((c.status as string) === 'INSPECTED') {
        counts.PENDING_RETURN += 1;
      }
      if (c.status === 'CANCELLED') {
        counts.PENDING_RETURN += 1;
        counts.TERMINATED += 1;
      }
      if (c.status === 'RELOCATION_PENDING') {
        counts.PENDING_CHECK_IN += 1;
      }
    });
    return counts;
  }, [contracts]);

  const handleSort = (field: ContractSortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Lọc và Sắp xếp
  const processedContracts = useMemo(() => {
    // 1. Filter
    const filtered = contracts
      .filter((c) => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'PENDING_CHECK_IN') {
          return c.status === 'PENDING_CHECK_IN' || c.status === 'RELOCATION_PENDING';
        }
        if (statusFilter === 'PENDING_RETURN') {
          return (
            c.status === 'PENDING_RETURN' ||
            (c.status as string) === 'INSPECTED' ||
            c.status === 'CANCELLED'
          );
        }
        if (statusFilter === 'TERMINATED') {
          return c.status === 'TERMINATED' || c.status === 'CANCELLED';
        }
        return c.status === statusFilter;
      })
      .filter((c) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          c.code.toLowerCase().includes(term) ||
          c.customerName.toLowerCase().includes(term) ||
          c.customerPhone.includes(term) ||
          (c.storageUnitCode && c.storageUnitCode.toLowerCase().includes(term))
        );
      });

    // 2. Sort
    return filtered.sort((a, b) => {
      let cmp: number;
      switch (sortField) {
        case 'code':
          cmp = a.code.localeCompare(b.code, 'vi', { numeric: true });
          break;
        case 'customer':
          cmp = a.customerName.localeCompare(b.customerName, 'vi');
          break;
        case 'unit':
          cmp = (a.storageUnitCode || '').localeCompare(b.storageUnitCode || '', 'vi', {
            numeric: true,
          });
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'endDate':
          cmp = (a.endDateExclusive || '').localeCompare(b.endDateExclusive || '');
          break;
        default:
          cmp = 0;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [contracts, statusFilter, searchTerm, sortField, sortDirection]);

  // Phân trang
  const totalPages = Math.ceil(processedContracts.length / pageSize) || 1;
  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedContracts.slice(startIndex, startIndex + pageSize);
  }, [processedContracts, currentPage, pageSize]);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Cấp 2 */}
      <Breadcrumb
        items={[
          {
            label: facility?.name || `Cơ sở #${facilityIdNum}`,
            icon: Building2,
          },
        ]}
      />

      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Danh sách Hợp đồng
            </h1>
            {facility && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80">
                {facility.name} ({facility.code})
              </span>
            )}
          </div>
          {facility?.address && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              Địa chỉ: {facility.address} {facility.phone ? `• Hotline: ${facility.phone}` : ''}
            </p>
          )}
        </div>

        {/* Toolbar: Tìm kiếm mã HĐ/khách & Làm mới */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã HĐ, tên khách, số điện thoại..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowDirectContractModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-700 to-brand-700 hover:from-teal-800 hover:to-brand-800 text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo HĐ trực tiếp</span>
          </button>
        </div>
      </div>


      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadData(true)} className="font-bold underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs Filter theo Trạng thái */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          const count = tabCounts[tab.value] || 0;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-brand-100 text-brand-800' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Danh sách Hợp đồng & Phân trang */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          <ContractTable
            contracts={paginatedContracts}
            onSelectContract={(c) => navigate(`/manager/contracts/${c.id}`)}
            onApproveSettlement={(c) => setSelectedForSettlement(c)}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {/* Phân trang: Hỗ trợ chuyển đổi số lượng/trang và luôn hiển thị điều hướng */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedContracts.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            showAlways={true}
            itemName="hợp đồng"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200 ${
            toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Direct Contract Creation Modal */}
      <CreateDirectContractModal
        isOpen={showDirectContractModal}
        onClose={() => setShowDirectContractModal(false)}
        onSuccess={handleDirectContractSuccess}
        defaultFacilityId={facilityIdNum}
      />

      {/* Settlement Approval Modal */}
      <SettlementApprovalModal
        isOpen={Boolean(selectedForSettlement)}
        contract={selectedForSettlement}
        onClose={() => setSelectedForSettlement(null)}
        onSuccess={(_contractId, message) => {
          setSelectedForSettlement(null);
          setToastMessage({ text: message || 'Đã phê duyệt quyết toán thành công!', type: 'success' });
          loadData(true);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />
    </div>
  );
};
