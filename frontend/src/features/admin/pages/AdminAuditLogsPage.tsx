import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Activity,
  KeyRound,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { AuditLogStatsCards } from '../components/AuditLogStatsCards';
import { ActivityLogsTable } from '../components/ActivityLogsTable';
import { LoginHistoryTable } from '../components/LoginHistoryTable';
import {
  getAuditActivities,
  getLoginHistories,
  getAuditStats,
  exportAuditLogsCsv,
} from '../api/auditApi';
import type {
  AuditLogItem,
  LoginHistoryItem,
  AuditLogFilterParams,
  LoginHistoryFilterParams,
  AuditStats,
} from '../types/audit';

export const AdminAuditLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activities' | 'logins'>('activities');

  // Stats State
  const [stats, setStats] = useState<AuditStats>({
    totalActivities: 0,
    roleOrStatusChanges: 0,
    failedLoginsToday: 0,
    totalLoginsToday: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Activities State
  const [activityLogs, setActivityLogs] = useState<AuditLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotalElements, setActivityTotalElements] = useState(0);
  const [activityFilter, setActivityFilter] = useState<AuditLogFilterParams>({
    action: 'ALL',
    entityType: 'ALL',
    size: 10,
  });
  const [exporting, setExporting] = useState(false);

  // Logins State
  const [loginHistories, setLoginHistories] = useState<LoginHistoryItem[]>([]);
  const [loginLoading, setLoginLoading] = useState(true);
  const [loginPage, setLoginPage] = useState(0);
  const [loginTotalPages, setLoginTotalPages] = useState(1);
  const [loginTotalElements, setLoginTotalElements] = useState(0);
  const [loginFilter, setLoginFilter] = useState<LoginHistoryFilterParams>({
    size: 10,
  });

  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // 1. Fetch Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getAuditStats();
      setStats(data);
    } catch (e) {
      console.error('Lỗi tải thống kê kiểm toán:', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 2. Fetch Activities
  const loadActivities = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await getAuditActivities({
        ...activityFilter,
        page: activityPage,
      });
      setActivityLogs(res.content);
      setActivityTotalPages(res.totalPages);
      setActivityTotalElements(res.totalElements);
    } catch (e) {
      console.error('Lỗi tải nhật ký thao tác:', e);
    } finally {
      setActivityLoading(false);
    }
  }, [activityFilter, activityPage]);

  // 3. Fetch Login Histories
  const loadLogins = useCallback(async () => {
    setLoginLoading(true);
    try {
      const res = await getLoginHistories({
        ...loginFilter,
        page: loginPage,
      });
      setLoginHistories(res.content);
      setLoginTotalPages(res.totalPages);
      setLoginTotalElements(res.totalElements);
    } catch (e) {
      console.error('Lỗi tải lịch sử đăng nhập:', e);
    } finally {
      setLoginLoading(false);
    }
  }, [loginFilter, loginPage]);

  // Refresh All
  const handleRefreshAll = () => {
    loadStats();
    if (activeTab === 'activities') {
      loadActivities();
    } else {
      loadLogins();
    }
    setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
  };

  // Initial Load
  useEffect(() => {
    loadStats();
    setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'activities') {
      loadActivities();
    } else {
      loadLogins();
    }
  }, [activeTab, loadActivities, loadLogins]);

  // Export CSV
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await exportAuditLogsCsv(activityFilter);
    } catch (e) {
      console.error('Lỗi xuất file CSV:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full w-fit mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mã yêu cầu SA-04 · An ninh & Kiểm toán</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Nhật ký kiểm toán & Lịch sử đăng nhập
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Giám sát phiên truy cập, nỗ lực đăng nhập thất bại và truy vết chi tiết mọi thay đổi vai trò, trạng thái, chính sách
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {lastRefreshed && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Cập nhật: {lastRefreshed}</span>
            </div>
          )}

          <button
            onClick={handleRefreshAll}
            disabled={activityLoading || loginLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(activityLoading || loginLoading) ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stats Cards */}
      <AuditLogStatsCards stats={stats} loading={statsLoading} />

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-xl">
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 py-4 px-4 text-sm font-semibold border-b-2 transition-colors relative ${
            activeTab === 'activities'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Nhật ký thao tác nghiệp vụ</span>
          {activityTotalElements > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 font-bold">
              {activityTotalElements}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logins')}
          className={`flex items-center gap-2 py-4 px-4 text-sm font-semibold border-b-2 transition-colors relative ${
            activeTab === 'logins'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Lịch sử đăng nhập hệ thống</span>
          {loginTotalElements > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 font-bold">
              {loginTotalElements}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="transition-all duration-200">
        {activeTab === 'activities' ? (
          <ActivityLogsTable
            logs={activityLogs}
            loading={activityLoading}
            filter={activityFilter}
            onFilterChange={(newFilter) => {
              setActivityFilter(newFilter);
              setActivityPage(0);
            }}
            page={activityPage}
            totalPages={activityTotalPages}
            totalElements={activityTotalElements}
            onPageChange={(newPage) => setActivityPage(newPage)}
            onExportCsv={handleExportCsv}
            exporting={exporting}
          />
        ) : (
          <LoginHistoryTable
            histories={loginHistories}
            loading={loginLoading}
            filter={loginFilter}
            onFilterChange={(newFilter) => {
              setLoginFilter(newFilter);
              setLoginPage(0);
            }}
            page={loginPage}
            totalPages={loginTotalPages}
            totalElements={loginTotalElements}
            onPageChange={(newPage) => setLoginPage(newPage)}
          />
        )}
      </div>
    </div>
  );
};
