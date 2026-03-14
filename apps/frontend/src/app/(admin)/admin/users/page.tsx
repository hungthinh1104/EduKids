'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, Users, Baby, Star, Shield, Ban, Download } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';
import { MetricCard, AdminPagination } from '@/features/admin/components/AdminUI';
import { UserTableRow } from '@/features/admin/components/UserTableRow';
import { UserDetailDrawer } from '@/features/admin/components/UserDetailDrawer';
import type { AdminUser } from '@/features/admin/components/UserTableRow';
import { getAdminUsers } from '@/features/admin/api/admin-users.api';

type PlanFilter = 'all' | 'free' | 'premium';
type StatusFilter = 'all' | 'active' | 'pending' | 'banned';

export default function AdminUsersPage() {
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [drawer, setDrawer] = useState<AdminUser | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [bulkActionMessage, setBulkActionMessage] = useState<string | null>(null);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await getAdminUsers();
                setUsers(fetchedUsers);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                setUsers([]);
            }
        };

        void fetchUsers();
    }, []);

    const filtered = users.filter((u) => {
        const matchSearch = u.email.toLowerCase().includes(search.toLowerCase());
        const matchPlan = planFilter === 'all' || u.plan === planFilter;
        const matchStatus = statusFilter === 'all' || u.status === statusFilter;
        return matchSearch && matchPlan && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginatedData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const resetAfterFilterChange = () => {
        setCurrentPage(1);
        setSelectedUserIds([]);
    };

    const handleToggleSelect = (userId: number) => {
        setSelectedUserIds((prev) => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pageIds = paginatedData.map(u => u.id);
            setSelectedUserIds(prev => Array.from(new Set([...prev, ...pageIds])));
        } else {
            const pageIds = paginatedData.map(u => u.id);
            setSelectedUserIds(prev => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const isAllPageSelected = paginatedData.length > 0 && paginatedData.every(u => selectedUserIds.includes(u.id));

    const handleExportCSV = () => {
        // Prepare CSV Headers
        const headers = ['ID', 'Email', 'Plan', 'Status', 'Children Count', 'Joined At', 'Last Login'];

        // Prepare CSV Rows
        const rows = users.map(u => [
            u.id,
            u.email,
            u.plan,
            u.status,
            u.children.length,
            new Date(u.joinedAt).toISOString(),
            new Date(u.lastLogin).toISOString()
        ]);

        // Form CSV String
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create Blob and Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `edukids_users_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkStatusUpdate = (status: Extract<StatusFilter, 'active' | 'banned'>) => {
        if (selectedUserIds.length === 0) return;

        setUsers((prev) =>
            prev.map((user) =>
                selectedUserIds.includes(user.id)
                    ? { ...user, status }
                    : user,
            ),
        );
        setBulkActionMessage(
            status === 'banned'
                ? `Đã khóa ${selectedUserIds.length} tài khoản (mô phỏng UI).`
                : `Đã mở khóa ${selectedUserIds.length} tài khoản (mô phỏng UI).`,
        );
        setSelectedUserIds([]);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 1, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/55 via-card to-accent-light/40 p-5 md:p-6 shadow-sm">
                <div>
                    <Heading level={2} className="text-heading text-3xl mb-1">Người dùng 👥</Heading>
                    <Caption className="text-caption">Quản lý tài khoản phụ huynh và học sinh</Caption>
                </div>
                <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-heading font-bold text-body hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm">
                    <Download size={16} /> Xuất CSV
                </button>
            </motion.div>

            {bulkActionMessage && (
                <div className="rounded-2xl border border-primary/20 bg-primary-light/40 px-4 py-3">
                    <Caption className="text-primary">{bulkActionMessage}</Caption>
                </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <MetricCard label="Tổng tài khoản" value={users.length} icon={<Users size={20} />} colorCls="text-primary bg-primary-light" index={0} />
                <MetricCard label="Đang hoạt động" value={users.filter((u) => u.status === 'active').length} icon={<Shield size={20} />} colorCls="text-success bg-success-light" index={1} />
                <MetricCard label="Gói Premium" value={users.filter((u) => u.plan === 'premium').length} icon={<Star size={20} />} colorCls="text-warning bg-warning-light" index={2} />
                <MetricCard label="Hồ sơ trẻ em" value={users.reduce((a, u) => a + u.children.length, 0)} icon={<Baby size={20} />} colorCls="text-accent bg-accent-light" index={3} />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap rounded-2xl border border-border/70 bg-card/90 p-3.5 md:p-4 shadow-sm">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-caption" />
                    <input
                        type="text"
                        placeholder="Tìm theo email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            resetAfterFilterChange();
                        }}
                        className="input-base pl-10 py-2.5 w-full text-sm"
                    />
                </div>
                <div className="relative">
                    <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-caption" />
                    <select
                        value={planFilter}
                        onChange={(e) => {
                            setPlanFilter(e.target.value as PlanFilter);
                            resetAfterFilterChange();
                        }}
                        className="input-base pl-8 pr-8 py-2.5 text-sm appearance-none cursor-pointer"
                    >
                        <option value="all">Tất cả gói</option>
                        <option value="free">Miễn phí</option>
                        <option value="premium">Premium</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-caption pointer-events-none" />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as StatusFilter);
                            resetAfterFilterChange();
                        }}
                        className="input-base pr-8 py-2.5 text-sm appearance-none cursor-pointer"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="pending">Chờ kích hoạt</option>
                        <option value="banned">Bị khóa</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-caption pointer-events-none" />
                </div>
                <Caption className="text-caption ml-auto">{filtered.length} / {users.length} kết quả</Caption>
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
                {selectedUserIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="bg-primary-light/50 border border-primary/20 rounded-2xl p-4 flex items-center justify-between overflow-hidden"
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-primary">Đã chọn {selectedUserIds.length} người dùng</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white text-error font-heading font-bold text-sm rounded-xl border border-border shadow-sm hover:bg-error-light hover:border-error transition-all" onClick={() => handleBulkStatusUpdate('banned')}>
                                <Ban size={16} /> Khóa tài khoản
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white text-success font-heading font-bold text-sm rounded-xl border border-border shadow-sm hover:bg-success-light hover:border-success transition-all" onClick={() => handleBulkStatusUpdate('active')}>
                                <Shield size={16} /> Mở khóa
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-background/80 border-b border-border">
                            <tr>
                                <th className="text-left px-5 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
                                        checked={isAllPageSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </th>
                                {['Người dùng', 'Số bé', 'Gói', 'Trạng thái', 'Tham gia', 'Lần cuối', ''].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 font-heading font-bold text-caption text-xs">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <AnimatePresence>
                                {paginatedData.map((user, i) => (
                                    <UserTableRow
                                        key={user.id}
                                        user={user}
                                        index={i}
                                        isSelected={selectedUserIds.includes(user.id)}
                                        onToggle={handleToggleSelect}
                                        onView={setDrawer}
                                    />
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="text-4xl mb-3">🔍</div>
                            <Caption className="text-caption">Không tìm thấy người dùng phù hợp</Caption>
                        </div>
                    )}
                </div>
                <AdminPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Detail drawer */}
            <UserDetailDrawer user={drawer} onClose={() => setDrawer(null)} />
        </div>
    );
}
