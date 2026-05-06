'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  ChevronDown,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAdminAuditLogs } from '@/features/cms/api/cms.api';
import { useAuthStore } from '@/shared/store/auth.store';

interface AuditLog {
  id: number;
  userId: number;
  userName?: string;
  action?: string;
  entityType?: string;
  entityId?: number;
  entityName?: string;
  timestamp: string;
  changesSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

type ActionFilter = 'all' | 'create' | 'update' | 'delete' | 'publish' | 'view';
type EntityFilter = 'all' | 'topic' | 'vocabulary' | 'quiz' | 'user' | 'profile' | 'media';
type DateFilter = 'all' | 'today' | 'week' | 'month';

const ACTION_OPTIONS: Array<{ value: ActionFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'create', label: 'Tạo mới' },
  { value: 'update', label: 'Cập nhật' },
  { value: 'delete', label: 'Xóa' },
  { value: 'publish', label: 'Xuất bản' },
  { value: 'view', label: 'Xem' },
];

const ENTITY_OPTIONS: Array<{ value: EntityFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'topic', label: 'Chủ đề' },
  { value: 'vocabulary', label: 'Từ vựng' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'user', label: 'Người dùng' },
  { value: 'profile', label: 'Hồ sơ' },
  { value: 'media', label: 'Media' },
];

const DATE_OPTIONS: Array<{ value: DateFilter; label: string }> = [
  { value: 'all', label: 'Mọi thời điểm' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày' },
  { value: 'month', label: '30 ngày' },
];

const pillBaseClass =
  'rounded-full border px-3 py-2 text-xs font-bold transition-all duration-200';

export default function AdminAuditLogsPage() {
  const userId = useAuthStore((state) => state.user?.id);
  const adminId: number | null = useMemo(() => {
    const parsed = Number(userId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [userId]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function loadAuditLogs() {
      if (!adminId) {
        setAuditLogs([]);
        return;
      }

      try {
        setIsLoading(true);
        const logs = await getAdminAuditLogs(adminId, 100);
        const mappedLogs: AuditLog[] = logs.map((log) => {
          const entityType = (log.entity ?? '').toLowerCase();
          const action = (log.action ?? '').toLowerCase();
          const changesSummary =
            log.changes && Object.keys(log.changes).length > 0
              ? Object.entries(log.changes)
                  .slice(0, 3)
                  .map(([key, value]) => `${key}: ${String(value)}`)
                  .join(' | ')
              : undefined;

          return {
            id: log.id,
            userId: log.userId,
            userName: `Admin #${log.userId}`,
            action,
            entityType,
            entityId: log.entityId,
            entityName: log.entity,
            timestamp: log.createdAt,
            changesSummary,
            description: log.details,
          };
        });

        setAuditLogs(mappedLogs);
      } catch (error) {
        console.error('Failed to load audit logs:', error);
        setAuditLogs([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAuditLogs();
  }, [adminId]);

  const getActionStyle = (action: string) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('create')) {
      return {
        badge: 'bg-success-light text-success-dark border border-success/30',
        iconBg: 'bg-success/10 text-success',
        icon: '➕',
        label: 'Tạo mới',
      };
    }
    if (act.includes('update')) {
      return {
        badge: 'bg-primary-light text-primary border border-primary/30',
        iconBg: 'bg-primary/10 text-primary',
        icon: '✏️',
        label: 'Cập nhật',
      };
    }
    if (act.includes('delete')) {
      return {
        badge: 'bg-error-light text-error border border-error/30',
        iconBg: 'bg-error/10 text-error',
        icon: '🗑️',
        label: 'Xóa',
      };
    }
    if (act.includes('publish')) {
      return {
        badge: 'bg-accent-light text-accent border border-accent/30',
        iconBg: 'bg-accent/10 text-accent',
        icon: '📢',
        label: 'Xuất bản',
      };
    }
    if (act.includes('view')) {
      return {
        badge: 'bg-slate-100 text-body border border-border',
        iconBg: 'bg-slate-500/10 text-body',
        icon: '👁️',
        label: 'Xem',
      };
    }

    return {
      badge: 'bg-warning-light text-warning-dark border border-warning/30',
      iconBg: 'bg-warning/10 text-warning',
      icon: '🔄',
      label: action || 'Khác',
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes}m trước`;
    if (hours < 24) return `${hours}h trước`;
    if (days < 7) return `${days}d trước`;

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    return auditLogs.filter((log) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        normalizedQuery.length === 0 ||
        log.userName?.toLowerCase().includes(normalizedQuery) ||
        log.action?.toLowerCase().includes(normalizedQuery) ||
        log.entityName?.toLowerCase().includes(normalizedQuery) ||
        log.entityType?.toLowerCase().includes(normalizedQuery) ||
        log.description?.toLowerCase().includes(normalizedQuery);

      const matchesAction =
        actionFilter === 'all' || log.action?.toLowerCase().includes(actionFilter.toLowerCase());
      const matchesEntity =
        entityFilter === 'all' || log.entityType?.toLowerCase() === entityFilter.toLowerCase();

      const logDate = new Date(log.timestamp);
      const matchesDate =
        dateFilter === 'all'
          ? true
          : dateFilter === 'today'
            ? logDate >= today
            : dateFilter === 'week'
              ? logDate >= weekAgo
              : logDate >= monthAgo;

      return matchesSearch && matchesAction && matchesEntity && matchesDate;
    });
  }, [actionFilter, auditLogs, dateFilter, entityFilter, searchQuery]);

  const todayCount = auditLogs.filter((log) => {
    const today = new Date();
    const logDate = new Date(log.timestamp);
    return logDate.toDateString() === today.toDateString();
  }).length;

  const activeUsersCount = new Set(auditLogs.map((log) => log.userId)).size;
  const actionTypesCount = new Set(
    auditLogs.map((log) => (log.action?.split('_')[0] ?? log.action ?? 'other').toLowerCase()),
  ).size;
  const activeFiltersCount = [
    actionFilter !== 'all',
    entityFilter !== 'all',
    dateFilter !== 'all',
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setEntityFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <motion.section
        initial={{ opacity: 1, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_28%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-200">
              <ShieldCheck size={14} /> Audit trail
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Nhật ký kiểm toán hệ thống</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Theo dõi mọi thao tác quản trị theo thời gian thực, lọc nhanh hành động đáng chú ý và kiểm tra chi tiết thay đổi để đảm bảo an toàn dữ liệu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-card/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Bản ghi</p>
              <p className="mt-2 text-2xl font-black">{auditLogs.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Hôm nay</p>
              <p className="mt-2 text-2xl font-black">{todayCount}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-card/10 p-4 backdrop-blur-sm md:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Bộ lọc đang bật</p>
              <p className="mt-2 text-2xl font-black">{activeFiltersCount}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Tổng hành động',
            value: auditLogs.length,
            icon: <Activity className="h-5 w-5" />,
            shell: 'from-primary-light/50 to-primary-light/30 border-primary/20',
            iconShell: 'bg-primary text-white',
          },
          {
            label: 'Trong hôm nay',
            value: todayCount,
            icon: <Clock3 className="h-5 w-5" />,
            shell: 'from-success-light/50 to-success-light/30 border-success/20',
            iconShell: 'bg-success text-white',
          },
          {
            label: 'Admin hoạt động',
            value: activeUsersCount,
            icon: <Users className="h-5 w-5" />,
            shell: 'from-accent-light/50 to-accent-light/30 border-accent/20',
            iconShell: 'bg-accent text-white',
          },
          {
            label: 'Loại hành động',
            value: actionTypesCount,
            icon: <Sparkles className="h-5 w-5" />,
            shell: 'from-warning-light/50 to-warning-light/30 border-warning/20',
            iconShell: 'bg-warning text-white',
          },
        ].map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 1, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`rounded-3xl border bg-gradient-to-br ${card.shell} p-5 shadow-sm`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted">{card.label}</p>
                <p className="mt-2 text-3xl font-black text-heading">{card.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${card.iconShell}`}>
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="rounded-[28px] border border-border bg-card/85 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-heading">Bộ lọc nhật ký</h2>
              <p className="mt-1 text-sm text-muted">Thu hẹp dữ liệu để tìm hành động quan trọng nhanh hơn.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-body">
                <Filter size={14} /> {filteredLogs.length} / {auditLogs.length} bản ghi
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-body transition hover:border-border hover:bg-background"
              >
                <RefreshCw size={14} /> Xóa bộ lọc
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Tìm theo admin, hành động, đối tượng hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background py-3 pl-12 pr-4 text-sm text-body outline-none transition placeholder:text-muted focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted">Hành động</p>
              <div className="flex flex-wrap gap-2">
                {ACTION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActionFilter(option.value)}
                    className={`${pillBaseClass} ${
                      actionFilter === option.value
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-border bg-card text-body hover:border-border hover:bg-background'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted">Đối tượng</p>
              <div className="flex flex-wrap gap-2">
                {ENTITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEntityFilter(option.value)}
                    className={`${pillBaseClass} ${
                      entityFilter === option.value
                        ? 'border-accent bg-accent text-white shadow-sm'
                        : 'border-border bg-card text-body hover:border-border hover:bg-background'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted">Thời gian</p>
              <div className="flex flex-wrap gap-2">
                {DATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDateFilter(option.value)}
                    className={`${pillBaseClass} ${
                      dateFilter === option.value
                        ? 'border-success bg-success text-white shadow-sm'
                        : 'border-border bg-card text-body hover:border-border hover:bg-background'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[26px] border border-border bg-card p-5 shadow-sm"
            >
              <div className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <div className="h-6 w-24 rounded-full bg-slate-200" />
                      <div className="h-6 w-28 rounded-full bg-slate-100" />
                    </div>
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-4 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : filteredLogs.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-border bg-card/80 px-6 py-16 text-center shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-muted">
            <Activity className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-xl font-black text-heading">Không tìm thấy nhật ký phù hợp</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Hãy thử nới lỏng bộ lọc hoặc tìm kiếm bằng từ khóa khác để xem thêm hoạt động quản trị.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <RefreshCw size={16} /> Đặt lại bộ lọc
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredLogs.map((log, index) => {
            const actionStyle = getActionStyle(log.action || '');
            const isExpanded = expandedId === log.id;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 1, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full p-5 text-left transition hover:bg-background/80 md:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl ${actionStyle.iconBg}`}>
                        {actionStyle.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${actionStyle.badge}`}>
                            {actionStyle.label}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-body">
                            {log.entityType || 'system'}
                            {log.entityId ? ` #${log.entityId}` : ''}
                          </span>
                        </div>

                        <p className="mt-3 text-base font-bold text-heading md:text-lg">
                          {log.description || `${actionStyle.label} ${log.entityName || 'một đối tượng trong hệ thống'}`}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            {log.userName || 'Admin'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDate(log.timestamp)}
                          </span>
                          {log.entityName && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-body">
                              {log.entityName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end">
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-muted">
                        Log #{log.id}
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-background/80 px-5 py-5 md:px-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-muted">Thực thể</p>
                        <p className="mt-2 text-sm font-semibold text-body">
                          {log.entityType || 'system'}{log.entityName ? `: ${log.entityName}` : ''}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-muted">Thời điểm</p>
                        <p className="mt-2 text-sm font-semibold text-body">{new Date(log.timestamp).toLocaleString('vi-VN')}</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-muted">Địa chỉ IP</p>
                        <p className="mt-2 break-all font-mono text-sm text-body">{log.ipAddress || 'Không có dữ liệu'}</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-muted">User Agent</p>
                        <p className="mt-2 line-clamp-3 text-sm text-body">{log.userAgent || 'Không có dữ liệu'}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-muted">Mô tả chi tiết</p>
                        <p className="mt-2 text-sm leading-6 text-body">{log.description || 'Không có mô tả chi tiết cho hành động này.'}</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-muted">Tóm tắt thay đổi</p>
                        <p className="mt-2 text-sm leading-6 text-body">{log.changesSummary || 'Không có thay đổi chi tiết được ghi nhận.'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </section>
      )}

      <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card/80 px-5 py-4 text-sm text-muted shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <p>
          Hiển thị <span className="font-black text-body">{filteredLogs.length}</span> trong{' '}
          <span className="font-black text-body">{auditLogs.length}</span> nhật ký.
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Dữ liệu được làm mới khi tải lại trang
        </p>
      </div>
    </div>
  );
}
