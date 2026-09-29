import React, { useEffect, useState } from 'react';
import { Shield, Building2, AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import type { AppUser, UserRoleType } from '@/api/user';
import { updateUserRole } from '@/api/user';
import { fetchAllActiveFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';
import { Modal } from '@/components/ui/Modal';

interface UserRoleModalProps {
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: AppUser) => void;
}

const ROLE_OPTIONS: { role: UserRoleType; label: string; description: string; color: string }[] = [
  {
    role: 'SYSTEM_ADMINISTRATOR',
    label: 'Quản trị viên hệ thống (Admin)',
    description: 'Toàn quyền cấu hình hệ thống, quản lý tài khoản và phân quyền.',
    color: 'border-rose-500 text-rose-700 bg-rose-50',
  },
  {
    role: 'BUSINESS_OPERATIONS_MANAGER',
    label: 'Quản lý vận hành kinh doanh (BOM)',
    description: 'Thiết lập bảng giá, quy định chính sách thuê và giám sát doanh thu toàn hệ thống.',
    color: 'border-purple-500 text-purple-700 bg-purple-50',
  },
  {
    role: 'FACILITY_MANAGER',
    label: 'Quản lý cơ sở (Facility Manager)',
    description: 'Quản lý ô kho, nhân viên và giải quyết khiếu nại tại các cơ sở được phân công.',
    color: 'border-blue-500 text-blue-700 bg-blue-50',
  },
  {
    role: 'FACILITY_STAFF',
    label: 'Nhân viên cơ sở (Facility Staff)',
    description: 'Thực hiện thủ tục check-in, bàn giao kho và nghiệm thu hoàn kho tại cơ sở phụ trách.',
    color: 'border-emerald-500 text-emerald-700 bg-emerald-50',
  },
  {
    role: 'STORAGE_CUSTOMER',
    label: 'Khách thuê kho (Customer)',
    description: 'Tìm kiếm, đặt chỗ ô kho, thanh toán trực tuyến và quản lý tài sản lưu trữ.',
    color: 'border-amber-500 text-amber-700 bg-amber-50',
  },
];

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(user?.role ?? 'STORAGE_CUSTOMER');
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>(
    user?.facilityIds ? [...user.facilityIds] : []
  );
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requiresFacility = selectedRole === 'FACILITY_STAFF' || selectedRole === 'FACILITY_MANAGER';

  useEffect(() => {
    let isMounted = true;
    fetchAllActiveFacilities()
      .then((data) => {
        if (isMounted) {
          setFacilities(data);
          setLoadingFacilities(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Lỗi khi tải danh sách cơ sở:', err);
          setLoadingFacilities(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    setErrorMsg(null);
    onClose();
  };

  const handleFacilityToggle = (facilityId: number) => {
    setErrorMsg(null);
    setSelectedFacilityIds((prev) =>
      prev.includes(facilityId) ? prev.filter((id) => id !== facilityId) : [...prev, facilityId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (requiresFacility && selectedFacilityIds.length === 0) {
      setErrorMsg('Vai trò Nhân viên hoặc Quản lý cơ sở yêu cầu phải gán ít nhất một cơ sở làm việc.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateUserRole(user!.id, {
        role: selectedRole,
        facilityIds: requiresFacility ? selectedFacilityIds : [],
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Không thể cập nhật vai trò. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg w-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Phân Quyền Vai Trò & Cơ Sở</h2>
            <p className="text-xs text-slate-300">Tài khoản: {user.fullName} ({user.email})</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Chọn vai trò */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <span>1. Chọn vai trò tài khoản</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = selectedRole === opt.role;
              return (
                <label
                  key={opt.role}
                  className={`block p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? `${opt.color} shadow-sm`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="userRole"
                        value={opt.role}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedRole(opt.role);
                          setErrorMsg(null);
                        }}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-sm">{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6">{opt.description}</p>
                </label>
              );
            })}
          </div>
        </div>

        {/* Phân quyền cơ sở (Chỉ hiện khi là Staff hoặc Manager) */}
        {requiresFacility ? (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>2. Chỉ định cơ sở làm việc (SA-03)</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFacilityIds(facilities.map((facility) => facility.id));
                    setErrorMsg(null);
                  }}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  Chọn tất cả
                </button>
                <span className="text-xs text-slate-500">
                  Đã chọn {selectedFacilityIds.length} cơ sở
                </span>
              </div>
            </div>

            {loadingFacilities ? (
              <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải danh sách cơ sở...</span>
              </div>
            ) : facilities.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                Chưa có dữ liệu cơ sở nào khả dụng trong hệ thống.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {facilities.map((fac) => {
                  const isChecked = selectedFacilityIds.includes(fac.id);
                  return (
                    <label
                      key={fac.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFacilityToggle(fac.id)}
                        className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {fac.name}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            Mã #{fac.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{fac.address}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              Vai trò <strong>{selectedRole}</strong> có quyền truy cập toàn hệ thống hoặc cổng khách hàng, không áp dụng giới hạn theo chi nhánh cơ sở.
            </span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Lưu Phân Quyền</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
