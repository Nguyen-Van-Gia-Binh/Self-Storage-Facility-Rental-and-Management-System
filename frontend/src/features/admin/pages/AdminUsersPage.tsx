import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Building2,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { AppUser, UserRoleType, UserStatusType } from '@/api/user';
import { getUsers, updateUserStatus } from '@/api/user';
import { fetchFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';
import { UserRoleModal } from '../components/UserRoleModal';
import { CreateUserModal } from '../components/CreateUserModal';

const ROLE_BADGES: Record<UserRoleType, { label: string; bg: string; text: string; border: string }> = {
  SYSTEM_ADMINISTRATOR: {
    label: 'Admin',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  BUSINESS_OPERATIONS_MANAGER: {
    label: 'BOM',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  FACILITY_MANAGER: {
    label: 'Quản lý cơ sở',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  FACILITY_STAFF: {
    label: 'Nhân viên cơ sở',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  STORAGE_CUSTOMER: {
    label: 'Khách thuê',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
};

interface AdminUsersPageProps {
  defaultRoleFilter?: string;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ defaultRoleFilter }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>(defaultRoleFilter || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [roleModalUser, setRoleModalUser] = useState<AppUser | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Status confirm modal
  const [statusConfirmUser, setStatusConfirmUser] = useState<AppUser | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Facility Map for quick name lookup
  const facilityMap = useMemo(() => {
    const map = new Map<number, string>();
    facilities.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [facilities]);

  // Load facilities once
  useEffect(() => {
    fetchFacilities()
      .then((data) => setFacilities(data))
      .catch((err) => console.error('Lỗi nạp cơ sở:', err));
  }, []);




  // Fetch Users khi đổi trang hoặc điều kiện lọc
  useEffect(() => {
    let ignore = false;
    getUsers({
      keyword: searchKeyword,
      role: selectedRole,
      status: selectedStatus,
      page: currentPage,
      size: 10,
    })
      .then((res) => {
        if (!ignore) {
          setUsers(res.content);
          setTotalElements(res.totalElements);
          setTotalPages(res.totalPages);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Lỗi khi nạp danh sách tài khoản:', err);
          showToast('error', 'Không thể kết nối đến máy chủ lấy danh sách người dùng.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [currentPage, selectedRole, selectedStatus, searchKeyword]);

  // Làm mới hoặc tìm kiếm từ sự kiện click của người dùng
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        keyword: searchKeyword,
        role: selectedRole,
        status: selectedStatus,
        page: currentPage,
        size: 10,
      });
      setUsers(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Lỗi khi nạp danh sách tài khoản:', err);
      showToast('error', 'Không thể kết nối đến máy chủ lấy danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    handleRefresh();
  };


  // Toggle User Status
  const handleConfirmStatusToggle = async () => {
    if (!statusConfirmUser) return;
    setUpdatingStatus(true);
    const newStatus: UserStatusType = statusConfirmUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await updateUserStatus(statusConfirmUser.id, { status: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(
        'success',
        `Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'vô hiệu hóa'} tài khoản ${updated.fullName} thành công.`
      );
      setStatusConfirmUser(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast('error', error.message || 'Lỗi khi cập nhật trạng thái người dùng.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Calculate quick stats
  const stats = useMemo(() => {
    return {
      total: totalElements,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      staff: users.filter((u) => u.role === 'FACILITY_STAFF' || u.role === 'FACILITY_MANAGER').length,
      admin: users.filter((u) => u.role === 'SYSTEM_ADMINISTRATOR').length,
    };
  }, [users, totalElements]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Quản Trị Người Dùng & Phân Quyền
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Quản lý tài khoản, gán vai trò RBAC và cấu hình phân quyền theo chi nhánh cơ sở (SA-01, SA-02, SA-03)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all"
            title="Làm mới dữ liệu"
          >

            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Tài Khoản</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng người dùng</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đang hoạt động</p>
            <p className="text-xl font-bold text-slate-900">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Nhân sự cơ sở</p>
            <p className="text-xl font-bold text-slate-900">{stats.staff}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Quản trị hệ thống</p>
            <p className="text-xl font-bold text-slate-900">{stats.admin}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo họ tên, email, số điện thoại..."
            className="w-full pl-10 pr-24 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
          >
            Tìm
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </div>

          {/* Vai trò */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="STORAGE_CUSTOMER">Khách thuê kho</option>
            <option value="FACILITY_STAFF">Nhân viên cơ sở</option>
            <option value="FACILITY_MANAGER">Quản lý cơ sở</option>
            <option value="BUSINESS_OPERATIONS_MANAGER">Quản lý kinh doanh (BOM)</option>
            <option value="SYSTEM_ADMINISTRATOR">Quản trị viên (Admin)</option>
          </select>

          {/* Trạng thái */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã khóa / Vô hiệu</option>
          </select>

          {(selectedRole !== 'ALL' || selectedStatus !== 'ALL' || searchKeyword) && (
            <button
              onClick={() => {
                setSelectedRole('ALL');
                setSelectedStatus('ALL');
                setSearchKeyword('');
                setCurrentPage(0);
              }}
              className="text-xs text-amber-600 hover:text-amber-700 underline font-medium px-1"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Số điện thoại & CCCD</th>
                <th className="py-3.5 px-4">Vai trò (RBAC)</th>
                <th className="py-3.5 px-4">Cơ sở phụ trách (SA-03)</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-xs">Đang nạp dữ liệu người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">Không tìm thấy người dùng nào</p>
                      <p className="text-xs text-slate-400">Hãy thử thay đổi từ khóa tìm kiếm hoặc điều kiện lọc</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleBadge = ROLE_BADGES[user.role] || {
                    label: user.role,
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };
                  const isStaffOrManager =
                    user.role === 'FACILITY_STAFF' || user.role === 'FACILITY_MANAGER';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shadow-sm">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.fullName}</p>
                            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone & ID */}
                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-medium text-slate-800">{user.phone}</p>
                        <p className="text-slate-400 font-mono">
                          CCCD: {user.identityNumber || 'Chưa cập nhật'}
                        </p>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Facilities Assigned */}
                      <td className="py-3.5 px-4">
                        {isStaffOrManager ? (
                          user.facilityIds && user.facilityIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {user.facilityIds.map((fId) => (
                                <span
                                  key={fId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                  <Building2 className="w-3 h-3 text-blue-500" />
                                  <span>{facilityMap.get(fId) || `Cơ sở #${fId}`}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-rose-500 italic flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Chưa gán cơ sở
                            </span>
                          )
                        ) : user.role === 'STORAGE_CUSTOMER' ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                            Toàn hệ thống
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Phân quyền vai trò */}
                          <button
                            onClick={() => {
                              setRoleModalUser(user);
                              setIsRoleModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Phân quyền vai trò & cơ sở"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Khóa / Mở khóa */}
                          <button
                            onClick={() => setStatusConfirmUser(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.status === 'ACTIVE'
                                ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {user.status === 'ACTIVE' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <strong>{users.length}</strong> trong tổng số <strong>{totalElements}</strong> tài khoản
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Trang {currentPage + 1} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cập nhật Vai trò & Cơ sở */}
      {roleModalUser && (
        <UserRoleModal
          key={roleModalUser.id}
          user={roleModalUser}
          isOpen={isRoleModalOpen}
          onClose={() => {
            setIsRoleModalOpen(false);
            setRoleModalUser(null);
          }}
          onSuccess={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            showToast('success', `Đã cập nhật vai trò cho ${updated.fullName} thành công!`);
          }}
        />
      )}

      {/* Modal Tạo Tài Khoản */}
      {isCreateModalOpen && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(newUser) => {
            setUsers((prev) => [newUser, ...prev]);
            setTotalElements((prev) => prev + 1);
            showToast('success', `Đã tạo tài khoản cho ${newUser.fullName} thành công!`);
          }}
        />
      )}


      {/* Confirmation Modal for Lock / Unlock */}
      {statusConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  statusConfirmUser.status === 'ACTIVE'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {statusConfirmUser.status === 'ACTIVE' ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {statusConfirmUser.status === 'ACTIVE' ? 'Khóa tài khoản?' : 'Kích hoạt tài khoản?'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{statusConfirmUser.email}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              {statusConfirmUser.status === 'ACTIVE'
                ? `Bạn có chắc chắn muốn vô hiệu hóa tài khoản của "${statusConfirmUser.fullName}"? Người dùng này sẽ không thể đăng nhập vào hệ thống.`
                : `Bạn có chắc chắn muốn mở khóa tài khoản cho "${statusConfirmUser.fullName}"? Người dùng sẽ có thể đăng nhập bình thường.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirmUser(null)}
                disabled={updatingStatus}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                disabled={updatingStatus}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
                  statusConfirmUser.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>{statusConfirmUser.status === 'ACTIVE' ? 'Xác nhận Khóa' : 'Kích hoạt'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
