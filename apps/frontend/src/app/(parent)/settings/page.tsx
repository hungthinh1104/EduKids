'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    User, Lock, Bell, CreditCard, Shield, ChevronRight,
    Moon, Sun, Trash2, LogOut, Check, Clock, Sliders,
} from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/shared/store/auth.store';
import { useChildProfiles } from '@/features/dashboard/hooks/useChildProfiles';
import { deleteProfile } from '@/features/profile/api/profile.api';
import { useTheme } from 'next-themes';

// UI components ---------------------------------------------------------

function SettingRow({ icon, label, desc, children }: { icon: React.ReactNode; label: string; desc?: string; children?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-border last:border-0 gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="font-heading font-bold text-heading text-sm">{label}</div>
                    {desc && <Caption className="text-caption text-xs">{desc}</Caption>}
                </div>
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <motion.button
            onClick={() => onChange(!value)}
            className={`relative w-12 h-6 rounded-full border-2 transition-all duration-300 flex items-center ${value ? 'bg-primary border-primary-dark' : 'bg-background border-border'}`}
        >
            <motion.div
                animate={{ x: value ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-4 h-4 bg-white rounded-full shadow-md"
            />
        </motion.button>
    );
}

// -----------------------------------------------------------------------

const PLAN_OPTIONS = [
    { id: 'free', label: 'Miễn phí', price: '0đ/tháng', features: ['1 hồ sơ bé', '5 chủ đề cơ bản', 'Không có AI phát âm'], current: false },
    { id: 'premium', label: '⭐ Premium', price: '99.000đ/tháng', features: ['Tối đa 3 hồ sơ bé', 'Tất cả chủ đề', 'AI phát âm + báo cáo nâng cao'], current: true },
];

export default function SettingsPage() {
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const profilesData = useChildProfiles();
    
    const [notifications, setNotifications] = useState(true);
    const [dailyReminder, setDailyReminder] = useState(true);
    const [studyLimit, setStudyLimit] = useState(30); // minutes per day
    const [activeTab, setActiveTab] = useState<'account' | 'children' | 'plan' | 'security'>('account');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(profilesData.activeProfileId);
    const [isDeletingChild, setIsDeletingChild] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            logout();
            router.push('/login');
        }
    };

    const tabs = [
        { id: 'account', label: 'Tài khoản', icon: <User size={16} /> },
        { id: 'children', label: 'Bé học', icon: <Sliders size={16} /> },
        { id: 'plan', label: 'Gói cước', icon: <CreditCard size={16} /> },
        { id: 'security', label: 'Bảo mật', icon: <Shield size={16} /> },
    ] as const;

    const selectedChild = profilesData.profiles.find(p => p.id === selectedChildId);
    const darkMode = resolvedTheme === 'dark';

    const handleDeleteChild = async () => {
        if (!selectedChild) return;
        setIsDeletingChild(true);
        setDeleteError(null);
        try {
            await deleteProfile(selectedChild.id);
            setShowDeleteConfirm(false);
            setSelectedChildId(null);
            await profilesData.refetch();
        } catch (error) {
            console.error('Delete child profile error:', error);
            setDeleteError('Không thể xóa hồ sơ lúc này. Vui lòng thử lại.');
        } finally {
            setIsDeletingChild(false);
        }
    };

    return (
        <div className="min-h-screen pb-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Heading level={2} className="text-heading text-3xl mb-1">Cài đặt ⚙️</Heading>
                <Body className="text-body">Quản lý tài khoản và tùy chỉnh trải nghiệm</Body>
            </motion.div>

            {/* Profile card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-candy rounded-[2rem] p-6 flex items-center gap-5 mb-8"
            >
                <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/50 flex items-center justify-center overflow-hidden">
                    <Image src="https://api.dicebear.com/7.x/bottts/svg?seed=parent" alt="Parent" width={56} height={56} />
                </div>
                <div className="flex-1 text-white">
                    <Heading level={3} className="text-white text-xl mb-0.5">
                        {user?.email?.split('@')[0] || 'Phụ huynh'}
                    </Heading>
                    <Caption className="text-white/80">{user?.email || 'parent@example.com'}</Caption>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-heading font-black backdrop-blur-sm">
                        ⭐ Premium đến 31/12/2026
                    </div>
                </div>
                <ChevronRight size={20} className="text-white/70" />
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-heading font-bold text-sm border-2 whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary-light border-primary text-primary shadow-sm' : 'bg-card border-border text-body hover:border-primary/40'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </motion.button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* ── Account ── */}
                    {activeTab === 'account' && (
                        <div className="bg-card border-2 border-border rounded-2xl px-5 divide-y-0">
                            <SettingRow icon={<Bell size={16} />} label="Thông báo" desc="Nhắc nhở giờ học">
                                <Toggle value={notifications} onChange={setNotifications} />
                            </SettingRow>
                            <SettingRow icon={<Clock size={16} />} label="Nhắc học hàng ngày" desc="8:00 sáng mỗi ngày">
                                <Toggle value={dailyReminder} onChange={setDailyReminder} />
                            </SettingRow>
                            <SettingRow icon={darkMode ? <Moon size={16} /> : <Sun size={16} />} label="Giao diện tối" desc="Dark mode">
                                <Toggle
                                    value={darkMode}
                                    onChange={(next) => {
                                        setTheme(next ? 'dark' : 'light');
                                    }}
                                />
                            </SettingRow>
                            <SettingRow icon={<User size={16} />} label="Chỉnh sửa thông tin" desc="Tên, email, ảnh đại diện">
                                <ChevronRight size={16} className="text-caption" />
                            </SettingRow>
                        </div>
                    )}

                    {/* ── Children Settings ── */}
                    {activeTab === 'children' && (
                        <div className="space-y-4">
                            {/* Child selector */}
                            {profilesData.loading ? (
                                <div className="text-center py-4 text-caption">Đang tải...</div>
                            ) : profilesData.profiles.length > 0 ? (
                                <>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {profilesData.profiles.map((profile) => (
                                            <button 
                                                key={profile.id} 
                                                onClick={() => setSelectedChildId(profile.id)}
                                                className={`flex-1 min-w-[120px] py-2.5 rounded-2xl border-2 font-heading font-bold text-sm transition-all ${
                                                    selectedChildId === profile.id 
                                                        ? 'border-primary bg-primary-light text-primary' 
                                                        : 'border-border bg-card text-body'
                                                }`}
                                            >
                                                {profile.nickname}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-card border-2 border-border rounded-2xl px-5">
                                        <SettingRow icon={<Clock size={16} />} label="Giới hạn học/ngày" desc={`${studyLimit} phút mỗi ngày`}>
                                            <span className="font-heading font-black text-primary">{studyLimit}p</span>
                                        </SettingRow>
                                        {/* Minute slider */}
                                        <div className="pb-4">
                                            <input type="range" min={10} max={120} step={5} value={studyLimit}
                                                onChange={(e) => setStudyLimit(Number(e.target.value))}
                                                className="w-full accent-primary"
                                            />
                                            <div className="flex justify-between">
                                                <Caption className="text-caption text-xs">10 phút</Caption>
                                                <Caption className="text-caption text-xs">2 giờ</Caption>
                                            </div>
                                        </div>

                                        <SettingRow icon={<Sliders size={16} />} label="Độ khó học tập" desc="Điều chỉnh SRS và nội dung">
                                            <ChevronRight size={16} className="text-caption" />
                                        </SettingRow>
                                        {selectedChild && (
                                            <SettingRow 
                                                icon={<Trash2 size={16} />} 
                                                label={`Xóa hồ sơ "${selectedChild.nickname}"`} 
                                                desc="Không thể hoàn tác"
                                            >
                                                <button
                                                    onClick={() => {
                                                        setDeleteError(null);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                    className="text-error font-heading font-bold text-sm hover:underline"
                                                >
                                                    Xóa
                                                </button>
                                            </SettingRow>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4 text-caption">Chưa có hồ sơ bé nào</div>
                            )}
                        </div>
                    )}

                    {/* ── Plan ── */}
                    {activeTab === 'plan' && (
                        <div className="space-y-4">
                            {PLAN_OPTIONS.map((plan) => (
                                <motion.div
                                    key={plan.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`relative bg-card border-2 rounded-2xl p-5 ${plan.current ? 'border-primary shadow-lg shadow-primary/15' : 'border-border'}`}
                                >
                                    {plan.current && (
                                        <div className="absolute top-4 right-4 bg-primary text-white text-xs font-heading font-black px-2.5 py-0.5 rounded-full">Hiện tại</div>
                                    )}
                                    <Heading level={4} className="text-heading text-lg mb-1">{plan.label}</Heading>
                                    <div className="text-primary font-heading font-black text-2xl mb-3">{plan.price}</div>
                                    <ul className="space-y-1.5">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2">
                                                <Check size={14} className="text-success flex-shrink-0" />
                                                <Caption className="text-body text-sm">{f}</Caption>
                                            </li>
                                        ))}
                                    </ul>
                                    {!plan.current && (
                                        <KidButton variant="default" className="w-full mt-4">Nâng cấp ngay</KidButton>
                                    )}
                                </motion.div>
                            ))}

                            <div className="bg-card border-2 border-border rounded-2xl px-5">
                                <SettingRow icon={<CreditCard size={16} />} label="Lịch sử thanh toán" desc="Xem hóa đơn và biên nhận">
                                    <ChevronRight size={16} className="text-caption" />
                                </SettingRow>
                            </div>
                        </div>
                    )}

                    {/* ── Security ── */}
                    {activeTab === 'security' && (
                        <div className="space-y-4">
                            <div className="bg-card border-2 border-border rounded-2xl px-5">
                                <SettingRow icon={<Lock size={16} />} label="Đổi mật khẩu" desc="Thay đổi mật khẩu đăng nhập">
                                    <ChevronRight size={16} className="text-caption" />
                                </SettingRow>
                                <SettingRow icon={<Shield size={16} />} label="Xác thực 2 lớp" desc="Bảo vệ tài khoản tốt hơn">
                                    <span className="text-xs font-heading font-bold px-2 py-1 rounded-lg bg-warning-light text-warning">
                                        Sắp hỗ trợ
                                    </span>
                                </SettingRow>
                            </div>

                            <KidButton 
                                variant="outline" 
                                className="w-full text-error border-error/20 hover:bg-error hover:text-white"
                                onClick={handleLogout}
                            >
                                <LogOut size={16} /> Đăng xuất
                            </KidButton>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Delete confirm modal */}
            <AnimatePresence>
                {showDeleteConfirm && selectedChild && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', bounce: 0.3 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-6"
                        >
                            <div className="bg-card border-2 border-error rounded-[2rem] p-7 w-full max-w-sm text-center shadow-2xl">
                                <div className="text-5xl mb-4">⚠️</div>
                                <Heading level={3} className="text-heading text-xl mb-2">
                                    Xóa hồ sơ &quot;{selectedChild.nickname}&quot;?
                                </Heading>
                                <Body className="text-body text-sm mb-6">Toàn bộ dữ liệu học tập, huy hiệu và item sẽ bị xóa vĩnh viễn.</Body>
                                {deleteError && (
                                    <Body className="text-error text-sm mb-4">{deleteError}</Body>
                                )}
                                <div className="flex gap-3">
                                    <KidButton
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeletingChild}
                                    >
                                        Hủy
                                    </KidButton>
                                    <KidButton
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => void handleDeleteChild()}
                                        disabled={isDeletingChild}
                                    >
                                        {isDeletingChild ? 'Đang xóa...' : 'Xóa'}
                                    </KidButton>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
