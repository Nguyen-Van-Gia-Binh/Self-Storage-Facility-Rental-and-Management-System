import React, { useState, useMemo } from 'react';
import {
  Search,
  FileCheck,
  RotateCcw,
  Wrench,
  Lock,
  Clock,
  AlertCircle,
  UserPlus,
  ArrowRightLeft,
  CheckCircle2,
  X,
} from 'lucide-react';
import type {
  DailyDispatchTaskItem,
  DispatchTaskType,
} from '../types/staffAssignment';

interface DailyTasksDispatchBoardProps {
  tasks: DailyDispatchTaskItem[];
  selectedStaffIdFilter: number | null;
  onClearStaffFilter: () => void;
  onAssignClick: (task: DailyDispatchTaskItem) => void;
}

type TabType = 'ALL' | DispatchTaskType;

export const DailyTasksDispatchBoard: React.FC<DailyTasksDispatchBoardProps> = ({
  tasks,
  selectedStaffIdFilter,
  onClearStaffFilter,
  onAssignClick,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [keyword, setKeyword] = useState<string>('');
  const [onlyUnassigned, setOnlyUnassigned] = useState<boolean>(false);

  // Lọc danh sách nhiệm vụ
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Lọc theo Tab loại việc
      if (activeTab !== 'ALL' && task.taskType !== activeTab) {
        return false;
      }

      // Lọc theo nhân viên được chọn từ card
      if (selectedStaffIdFilter && task.assignedStaffId !== selectedStaffIdFilter) {
        return false;
      }

      // Lọc việc chưa gán
      if (onlyUnassigned && task.status !== 'UNASSIGNED') {
        return false;
      }

      // Lọc từ khóa
      if (keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        const matchCode = task.referenceCode?.toLowerCase().includes(q) ?? false;
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchUnit = task.unitCode.toLowerCase().includes(q);
        const matchCust = task.customerName.toLowerCase().includes(q);
        const matchStaff = task.assignedStaffName?.toLowerCase().includes(q) ?? false;
        return matchCode || matchTitle || matchUnit || matchCust || matchStaff;
      }

      return true;
    });
  }, [tasks, activeTab, selectedStaffIdFilter, onlyUnassigned, keyword]);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      checkIn: tasks.filter((t) => t.taskType === 'CHECK_IN').length,
      return: tasks.filter((t) => t.taskType === 'RETURN').length,
      incident: tasks.filter((t) => t.taskType === 'INCIDENT').length,
      overlock: tasks.filter((t) => t.taskType === 'OVERLOCK').length,
      unassigned: tasks.filter((t) => t.status === 'UNASSIGNED').length,
    };
  }, [tasks]);

  const getTaskBadge = (task: DailyDispatchTaskItem) => {
    switch (task.taskType) {
      case 'CHECK_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FileCheck className="w-3 h-3 text-blue-600" /> Bàn giao Check-in
          </span>
        );
      case 'RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3 text-purple-600" /> Nghiệm thu Trả kho
          </span>
        );
      case 'INCIDENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600" /> Sự cố Kỹ thuật
          </span>
        );
      case 'OVERLOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-600" /> Khóa ngoài Overlock D+4
          </span>
        );
    }
  };

  const getStatusBadge = (status: DailyDispatchTaskItem['status']) => {
    switch (status) {
      case 'UNASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 animate-pulse">
            <AlertCircle className="w-3 h-3" /> Chưa phân công
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
            <UserPlus className="w-3 h-3" /> Đã phân công
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" /> Đang xử lý
          </span>
        );
      case 'RESOLVED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" /> Hoàn thành
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã, tên khách, ô kho, nhân viên..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          {selectedStaffIdFilter && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <span>Đang lọc theo nhân viên #{selectedStaffIdFilter}</span>
              <button
                type="button"
                onClick={onClearStaffFilter}
                className="p-0.5 hover:bg-blue-100 rounded-full"
                title="Bỏ lọc nhân viên"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnassigned}
              onChange={(e) => setOnlyUnassigned(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <span>Chỉ xem việc chưa gán ({counts.unassigned})</span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-4 bg-white overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'ALL'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Tất cả nhiệm vụ</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CHECK_IN')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'CHECK_IN'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>1. Check-in</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700">
            {counts.checkIn}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RETURN')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'RETURN'
              ? 'border-purple-600 text-purple-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>2. Trả kho</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700">
            {counts.return}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INCIDENT')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'INCIDENT'
              ? 'border-amber-600 text-amber-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>3. Sự cố Kỹ thuật</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700">
            {counts.incident}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('OVERLOCK')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'OVERLOCK'
              ? 'border-rose-600 text-rose-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>4. Khóa ngoài Overlock</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700">
            {counts.overlock}
          </span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
              <th className="py-3 px-4">Giờ hẹn</th>
              <th className="py-3 px-4">Phân loại & Nhiệm vụ</th>
              <th className="py-3 px-4">Khách hàng & Ô kho</th>
              <th className="py-3 px-4">Nhân sự phụ trách</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                    <span>Không có nhiệm vụ nào khớp với điều kiện lọc</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Giờ hẹn */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.scheduledTime}</span>
                    </div>
                  </td>

                  {/* Phân loại & Nhiệm vụ */}
                  <td className="py-3.5 px-4">
                    <div className="mb-1">{getTaskBadge(task)}</div>
                    <p className="font-semibold text-slate-900 leading-snug">{task.title}</p>
                    {task.referenceCode && (
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Mã: {task.referenceCode}
                      </p>
                    )}
                  </td>

                  {/* Khách hàng & Ô kho */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>{task.customerName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {task.unitCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{task.customerPhone}</p>
                  </td>

                  {/* Nhân sự phụ trách */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {task.assignedStaffName ? (
                      <div>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                          {task.assignedStaffName}
                        </span>
                        {task.notes && (
                          <p className="text-[10px] text-slate-400 max-w-[200px] truncate mt-0.5">
                            Ghi chú: {task.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Chưa chỉ định</span>
                    )}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(task.status)}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {task.assignedStaffId ? (
                      <button
                        type="button"
                        onClick={() => onAssignClick(task)}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 ml-auto transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                        <span>Điều chuyển</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAssignClick(task)}
                        className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 ml-auto shadow-sm transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Phân công</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
