'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    User, Lock, Bell, CreditCard, Shield, ChevronRight,
    Moon, Sun, Trash2, LogOut, Check, Clock, Sliders, Eye, EyeOff,
} from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { authApi } from '@/features/auth/api/auth.api';
import { getReportPreferences, updateReportPreferences } from '@/features/reports/api/reports.api';
import { useAuthStore } from '@/shared/store/auth.store';
import { useChildProfiles } from '@/features/dashboard/hooks/useChildProfiles';
import { deleteProfile } from '@/features/profile/api/profile.api';
import { useTheme } from 'next-themes';

// UI components ---------------------------------------------------------

function SettingRow({ icon, label, desc, children }: { icon: React.ReactNode; label: string; desc?: string; children?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-3 md:py-4 border-b border-border last:border-0 gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-primary-light text-primary flex items-center justify-center flex-shrink-0 text-sm md:text-base">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-heading font-bold text-heading text-xs md:text-sm line-clamp-1">{label}</div>
                    {desc && <Caption className="text-caption text-[10px] md:text-xs line-clamp-1">{desc}</Caption>}
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
            className={`relative w-10 h-6 md:w-12 md:h-6 rounded-full border-2 transition-all duration-300 flex items-center flex-shrink-0 ${value ? 'bg-primary border-primary-dark' : 'bg-background border-border'}`}
        >
            <motion.div
                animate={{ x: value ? (16 + 8) : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-4 h-4 bg-card rounded-full shadow-md"
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
    const patchUser = useAuthStore((state) => state.patchUser);
    const profilesData = useChildProfiles();
    
    const [notifications, setNotificationsRaw] = useState(true);
    const [dailyReminder, setDailyReminderRaw] = useState(true);
    const [studyLimit, setStudyLimitRaw] = useState(30); // minutes per day
    const [activeTab, setActiveTab] = useState<'account' | 'children' | 'plan' | 'security'>('account');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(profilesData.activeProfileId);
    const [isDeletingChild, setIsDeletingChild] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Change password modal state
    const [showChangePwd, setShowChangePwd] = useState(false);
    const [cpCurrentPwd, setCpCurrentPwd] = useState('');
    const [cpNewPwd, setCpNewPwd] = useState('');
    const [cpConfirmPwd, setCpConfirmPwd] = useState('');
    const [cpError, setCpError] = useState<string | null>(null);
    const [cpSuccess, setCpSuccess] = useState(false);
    const [cpLoading, setCpLoading] = useState(false);
    const [cpShowCurrent, setCpShowCurrent] = useState(false);
    const [cpShowNew, setCpShowNew] = useState(false);

    // Edit profile modal state
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [epFirstName, setEpFirstName] = useState('');
    const [epLastName, setEpLastName] = useState('');
    const [epError, setEpError] = useState<string | null>(null);
    const [epSuccess, setEpSuccess] = useState(false);
    const [epLoading, setEpLoading] = useState(false);
    
    const pwdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        return () => {
            if (pwdTimeoutRef.current) clearTimeout(pwdTimeoutRef.current);
            if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
        };
    }, []);

    // Load settings: localStorage first, then backend preferences
    useEffect(() => {
        try {
            const saved = localStorage.getItem('edukids_settings');
            if (saved) {
                const parsed = JSON.parse(saved) as { notifications?: boolean; dailyReminder?: boolean; studyLimit?: number };
                if (typeof parsed.notifications === 'boolean') setNotificationsRaw(parsed.notifications);
                if (typeof parsed.dailyReminder === 'boolean') setDailyReminderRaw(parsed.dailyReminder);
                if (typeof parsed.studyLimit === 'number') setStudyLimitRaw(parsed.studyLimit);
            }
        } catch { /* ignore */ }

        void (async () => {
            try {
                const prefs = await getReportPreferences();
                if (typeof prefs.isSubscribed === 'boolean') {
                    setNotificationsRaw(prefs.isSubscribed);
                }
            } catch {
                // keep localStorage values
            }
        })();
    }, []);

    const saveSettings = (patch: Partial<{ notifications: boolean; dailyReminder: boolean; studyLimit: number }>) => {
        try {
            const prev = JSON.parse(localStorage.getItem('edukids_settings') ?? '{}') as Record<string, unknown>;
            localStorage.setItem('edukids_settings', JSON.stringify({ ...prev, ...patch }));
        } catch { /* ignore */ }
    };

    const syncPrefsToBackend = async (patch: { notifications?: boolean; dailyReminder?: boolean }) => {
        try {
            const payload: Parameters<typeof updateReportPreferences>[0] = {};
            if (typeof patch.notifications === 'boolean') {
                payload.isSubscribed = patch.notifications;
                payload.preferredChannel = patch.notifications ? 'EMAIL' : undefined;
            }
            await updateReportPreferences(payload);
        } catch {
            // fallback silently to localStorage only
        }
    };

    const setNotifications = (v: boolean) => {
        setNotificationsRaw(v);
        saveSettings({ notifications: v });
        void syncPrefsToBackend({ notifications: v });
    };
    const setDailyReminder = (v: boolean) => {
        setDailyReminderRaw(v);
        saveSettings({ dailyReminder: v });
        void syncPrefsToBackend({ dailyReminder: v });
    };
    const setStudyLimit = (v: number) => { setStudyLimitRaw(v); saveSettings({ studyLimit: v }); };

    const handleChangePwd = async () => {
        setCpError(null);
        if (!cpCurrentPwd || !cpNewPwd || !cpConfirmPwd) {
            setCpError('Vui lòng điền đầy đủ các trường.');
            return;
        }
        if (cpNewPwd !== cpConfirmPwd) {
            setCpError('Mật khẩu mới không khớp.');
            return;
        }
        if (cpNewPwd.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(cpNewPwd)) {
            setCpError('Mật khẩu mới phải có ít nhất 8 ký tự, chữ hoa, chữ thường và số.');
            return;
        }
        setCpLoading(true);
        try {
            await authApi.changePassword(cpCurrentPwd, cpNewPwd);
            setCpSuccess(true);
            setCpCurrentPwd(''); setCpNewPwd(''); setCpConfirmPwd('');
            pwdTimeoutRef.current = setTimeout(() => { setShowChangePwd(false); setCpSuccess(false); }, 2000);
        } catch {
            setCpError('Mật khẩu hiện tại không đúng. Vui lòng thử lại.');
        } finally {
            setCpLoading(false);
        }
    };

    const handleEditProfile = async () => {
        setEpError(null);
        const trimFirst = epFirstName.trim();
        const trimLast = epLastName.trim();
        if (!trimFirst && !trimLast) {
            setEpError('Vui lòng nhập ít nhất tên hoặc họ.');
            return;
        }
        setEpLoading(true);
        try {
            const payload: { firstName?: string; lastName?: string } = {};
            if (trimFirst) payload.firstName = trimFirst;
            if (trimLast) payload.lastName = trimLast;
            await authApi.updateProfile(payload);
            patchUser(payload);
            setEpSuccess(true);
            profileTimeoutRef.current = setTimeout(() => { setShowEditProfile(false); setEpSuccess(false); }, 2000);
        } catch {
            setEpError('Không thể cập nhật thông tin. Vui lòng thử lại.');
        } finally {
            setEpLoading(false);
        }
    };

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
        <div className="min-h-screen pb-8 px-4 md:px-0">
            {/* Header */}
            <motion.div initial={{ opacity: 1, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8">
                <Heading level={2} className="text-heading text-2xl md:text-3xl mb-1">Cài đặt ⚙️</Heading>
                <Body className="text-body text-sm md:text-base">Quản lý tài khoản và tùy chỉnh trải nghiệm</Body>
            </motion.div>

            {/* Profile card */}
            <motion.div
                initial={{ opacity: 1, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-candy rounded-xl md:rounded-[2rem] p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-5 mb-6 md:mb-8"
            >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-card/20 border-4 border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image 
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=parent" 
                        alt="Ảnh đại diện phụ huynh" 
                        width={56} 
                        height={56}
                        loading="lazy"
                    />
                </div>
                <div className="flex-1 text-white min-w-0">
                    <Heading level={3} color="textInverse" className="text-lg md:text-xl mb-0.5 line-clamp-1">
                        {user?.firstName
                            ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                            : user?.email?.split('@')[0] || 'Phụ huynh'}
                    </Heading>
                    <Caption color="textInverse" className="text-xs md:text-sm truncate text-white/80">{user?.email || 'parent@example.com'}</Caption>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-card/20 px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-heading font-black backdrop-blur-sm">
                        ⭐ Premium đến 31/12/2026
                    </div>
                </div>
                <ChevronRight size={18} className="md:w-5 md:h-5 text-white/70 flex-shrink-0 hidden sm:block" />
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1.5 md:gap-2 mb-6 overflow-x-auto pb-2 -mx-4 md:mx-0 px-4 md:px-0">
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg md:rounded-2xl font-heading font-bold text-xs md:text-sm border-2 whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-primary-light border-primary text-primary shadow-sm' : 'bg-card border-border text-body hover:border-primary/40'
                            }`}
                    >
                        {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                    </motion.button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 1, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* ── Account ── */}
                    {activeTab === 'account' && (
                        <div className="bg-card border-2 border-border rounded-lg md:rounded-2xl px-3 md:px-5 divide-y-0">
                            <SettingRow icon={<Bell size={14} className="md:w-4 md:h-4" />} label="Thông báo" desc="Nhắc nhở giờ học">
                                <Toggle value={notifications} onChange={setNotifications} />
                            </SettingRow>
                            <SettingRow icon={<Clock size={14} className="md:w-4 md:h-4" />} label="Nhắc học hàng ngày" desc="8:00 sáng mỗi ngày">
                                <Toggle value={dailyReminder} onChange={setDailyReminder} />
                            </SettingRow>
                            <SettingRow icon={darkMode ? <Moon size={14} className="md:w-4 md:h-4" /> : <Sun size={14} className="md:w-4 md:h-4" />} label="Giao diện tối" desc="Dark mode">
                                <Toggle
                                    value={darkMode}
                                    onChange={(next) => {
                                        setTheme(next ? 'dark' : 'light');
                                    }}
                                />
                            </SettingRow>
                            <SettingRow icon={<User size={14} className="md:w-4 md:h-4" />} label="Chỉnh sửa thông tin" desc="Tên, email">
                                <button
                                    onClick={() => {
                                        setEpFirstName(user?.firstName ?? '');
                                        setEpLastName(user?.lastName ?? '');
                                        setEpError(null);
                                        setEpSuccess(false);
                                        setShowEditProfile(true);
                                    }}
                                    className="text-primary font-heading font-bold text-xs md:text-sm hover:underline flex items-center gap-1 flex-shrink-0"
                                >
                                    Sửa <ChevronRight size={12} className="md:w-3.5 md:h-3.5" />
                                </button>
                            </SettingRow>
                        </div>
                    )}

                    {/* ── Children Settings ── */}
                    {activeTab === 'children' && (
                        <div className="space-y-3 md:space-y-4">
                            {/* Child selector */}
                            {profilesData.loading ? (
                                <div className="text-center py-4 text-caption text-xs md:text-sm">Đang tải...</div>
                            ) : profilesData.profiles.length > 0 ? (
                                <>
                                    <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 -mx-4 md:mx-0 px-4 md:px-0">
                                        {profilesData.profiles.map((profile) => (
                                            <motion.button 
                                                whileTap={{ scale: 0.95 }}
                                                key={profile.id} 
                                                onClick={() => setSelectedChildId(profile.id)}
                                                className={`flex-shrink-0 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-2xl border-2 font-heading font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                                                    selectedChildId === profile.id 
                                                        ? 'border-primary bg-primary-light text-primary' 
                                                        : 'border-border bg-card text-body hover:border-primary/40'
                                                }`}
                                            >
                                                {profile.nickname}
                                            </motion.button>
                                        ))}
                                    </div>

                                    <div className="bg-card border-2 border-border rounded-lg md:rounded-2xl px-3 md:px-5">
                                        <SettingRow icon={<Clock size={14} className="md:w-4 md:h-4" />} label="Giới hạn học/ngày" desc={`${studyLimit} phút mỗi ngày`}>
                                            <span className="font-heading font-black text-primary text-xs md:text-sm flex-shrink-0">{studyLimit}p</span>
                                        </SettingRow>
                                        {/* Minute slider */}
                                        <div className="pb-3 md:pb-4">
                                            <input type="range" min={10} max={120} step={5} value={studyLimit}
                                                onChange={(e) => setStudyLimit(Number(e.target.value))}
                                                className="w-full accent-primary"
                                            />
                                            <div className="flex justify-between gap-2">
                                                <Caption className="text-caption text-[9px] md:text-xs">10 phút</Caption>
                                                <Caption className="text-caption text-[9px] md:text-xs">2 giờ</Caption>
                                            </div>
                                        </div>

                                        <SettingRow icon={<Sliders size={14} className="md:w-4 md:h-4" />} label="Độ khó học tập" desc="Điều chỉnh SRS">
                                            <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-heading font-bold px-2 py-1 rounded-full bg-warning-light text-warning flex-shrink-0">
                                                Sắp hỗ trợ
                                            </span>
                                        </SettingRow>
                                        {selectedChild && (
                                            <SettingRow 
                                                icon={<Trash2 size={14} className="md:w-4 md:h-4" />} 
                                                label={`Xóa hồ sơ`} 
                                                desc={selectedChild.nickname}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setDeleteError(null);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                    className="text-error font-heading font-bold text-xs md:text-sm hover:underline flex-shrink-0"
                                                >
                                                    Xóa
                                                </button>
                                            </SettingRow>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4 text-caption text-xs md:text-sm">Chưa có hồ sơ bé nào</div>
                            )}
                        </div>
                    )}

                    {/* ── Plan ── */}
                    {activeTab === 'plan' && (
                        <div className="space-y-3 md:space-y-4">
                            {PLAN_OPTIONS.map((plan) => (
                                <motion.div
                                    key={plan.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`relative bg-card border-2 rounded-lg md:rounded-2xl p-3 md:p-5 ${plan.current ? 'border-primary shadow-lg shadow-primary/15' : 'border-border'}`}
                                >
                                    {plan.current && (
                                        <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-primary text-white text-[9px] md:text-xs font-heading font-black px-2 md:px-2.5 py-0.5 rounded-full">Hiện tại</div>
                                    )}
                                    <Heading level={4} className="text-heading text-base md:text-lg mb-1">{plan.label}</Heading>
                                    <div className="text-primary font-heading font-black text-lg md:text-2xl mb-2 md:mb-3">{plan.price}</div>
                                    <ul className="space-y-1 md:space-y-1.5">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-1.5 md:gap-2">
                                                <Check size={12} className="md:w-3.5 md:h-3.5 text-success flex-shrink-0 mt-0.5" />
                                                <Caption className="text-body text-xs md:text-sm">{f}</Caption>
                                            </li>
                                        ))}
                                    </ul>
                                        {!plan.current && (
                                            <KidButton
                                                type="button"
                                                variant="default"
                                                className="w-full mt-3 md:mt-4 text-xs md:text-sm py-1.5 md:py-2"
                                                onClick={() => setActiveTab('security')}
                                            >
                                                Nâng cấp
                                            </KidButton>
                                        )}
                                </motion.div>
                            ))}

                            <div className="bg-card border-2 border-border rounded-lg md:rounded-2xl px-3 md:px-5">
                                <SettingRow icon={<CreditCard size={14} className="md:w-4 md:h-4" />} label="Lịch sử thanh toán" desc="Xem hóa đơn">
                                    <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-heading font-bold px-2 py-1 rounded-full bg-background border border-border text-caption flex-shrink-0">
                                        Chưa có
                                    </span>
                                </SettingRow>
                            </div>
                        </div>
                    )}

                    {/* ── Security ── */}
                    {activeTab === 'security' && (
                        <div className="space-y-3 md:space-y-4">
                            <div className="bg-card border-2 border-border rounded-lg md:rounded-2xl px-3 md:px-5">
                                <SettingRow icon={<Lock size={14} className="md:w-4 md:h-4" />} label="Đổi mật khẩu" desc="Thay đổi đăng nhập">
                                    <button
                                        onClick={() => { setCpError(null); setCpSuccess(false); setShowChangePwd(true); }}
                                        className="text-primary font-heading font-bold text-xs md:text-sm hover:underline flex items-center gap-1 flex-shrink-0"
                                    >
                                        Đổi <ChevronRight size={12} className="md:w-3.5 md:h-3.5" />
                                    </button>
                                </SettingRow>
                                <SettingRow icon={<Shield size={14} className="md:w-4 md:h-4" />} label="Xác thực 2 lớp" desc="Bảo vệ tài khoản">
                                    <span className="text-[9px] md:text-xs font-heading font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg bg-warning-light text-warning flex-shrink-0 whitespace-nowrap">
                                        Sắp hỗ trợ
                                    </span>
                                </SettingRow>
                            </div>

                            <KidButton 
                                variant="outline" 
                                className="w-full text-error border-error/20 hover:bg-error hover:text-white text-xs md:text-sm py-2 md:py-2.5"
                                onClick={handleLogout}
                            >
                                <LogOut size={14} className="md:w-4 md:h-4" /> Đăng xuất
                            </KidButton>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Change password modal */}
            <AnimatePresence>
                {showChangePwd && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowChangePwd(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', bounce: 0.3 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        >
                            <div className="bg-card border-2 border-primary/30 rounded-lg md:rounded-[2rem] p-4 md:p-7 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
                                <Heading level={3} className="text-heading text-lg md:text-xl mb-4 md:mb-5 text-center">🔒 Đổi mật khẩu</Heading>

                                {cpSuccess ? (
                                    <div className="text-center py-6 space-y-3">
                                        <div className="text-4xl md:text-5xl">✅</div>
                                        <Body className="text-success font-bold text-sm md:text-base">Mật khẩu đã được cập nhật!</Body>
                                    </div>
                                ) : (
                                    <div className="space-y-3 md:space-y-4">
                                        {cpError && (
                                            <div className="p-2.5 md:p-3 rounded-lg md:rounded-xl bg-secondary-light border border-secondary/20 text-secondary text-xs md:text-sm font-medium">
                                                {cpError}
                                            </div>
                                        )}

                                        {/* Current password */}
                                        <div className="space-y-1 md:space-y-1.5">
                                            <label className="text-xs md:text-sm font-bold text-heading ml-1">Mật khẩu hiện tại</label>
                                            <div className="relative">
                                                <input
                                                    type={cpShowCurrent ? 'text' : 'password'}
                                                    value={cpCurrentPwd}
                                                    onChange={(e) => setCpCurrentPwd(e.target.value)}
                                                    placeholder="Mật khẩu hiện tại"
                                                    className="input-base pr-10 text-xs md:text-sm"
                                                    disabled={cpLoading}
                                                />
                                                <button type="button" onClick={() => setCpShowCurrent((v) => !v)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-caption">
                                                    {cpShowCurrent ? <EyeOff size={14} className="md:w-4 md:h-4" /> : <Eye size={14} className="md:w-4 md:h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* New password */}
                                        <div className="space-y-1 md:space-y-1.5">
                                            <label className="text-xs md:text-sm font-bold text-heading ml-1">Mật khẩu mới</label>
                                            <div className="relative">
                                                <input
                                                    type={cpShowNew ? 'text' : 'password'}
                                                    value={cpNewPwd}
                                                    onChange={(e) => setCpNewPwd(e.target.value)}
                                                    placeholder="Ít nhất 8 ký tự"
                                                    className="input-base pr-10 text-xs md:text-sm"
                                                    disabled={cpLoading}
                                                />
                                                <button type="button" onClick={() => setCpShowNew((v) => !v)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-caption">
                                                    {cpShowNew ? <EyeOff size={14} className="md:w-4 md:h-4" /> : <Eye size={14} className="md:w-4 md:h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm new password */}
                                        <div className="space-y-1 md:space-y-1.5">
                                            <label className="text-xs md:text-sm font-bold text-heading ml-1">Xác nhận mật khẩu mới</label>
                                            <input
                                                type="password"
                                                value={cpConfirmPwd}
                                                onChange={(e) => setCpConfirmPwd(e.target.value)}
                                                placeholder="Nhập lại mật khẩu"
                                                className="input-base text-xs md:text-sm"
                                                disabled={cpLoading}
                                            />
                                        </div>

                                        <div className="flex gap-2 md:gap-3 pt-2">
                                            <KidButton variant="outline" className="flex-1 text-xs md:text-sm py-1.5 md:py-2" onClick={() => setShowChangePwd(false)} disabled={cpLoading}>
                                                Hủy
                                            </KidButton>
                                            <KidButton variant="default" className="flex-1 text-xs md:text-sm py-1.5 md:py-2" onClick={() => void handleChangePwd()} disabled={cpLoading}>
                                                {cpLoading ? 'Đang lưu...' : 'Lưu'}
                                            </KidButton>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit profile modal */}
            <AnimatePresence>
                {showEditProfile && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', bounce: 0.3 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        >
                            <div className="bg-card border-2 border-primary/30 rounded-lg md:rounded-[2rem] p-4 md:p-7 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
                                <Heading level={3} className="text-heading text-lg md:text-xl mb-4 md:mb-5 text-center">✏️ Chỉnh sửa thông tin</Heading>
                                {epSuccess ? (
                                    <div className="text-center py-6 space-y-3">
                                        <div className="text-4xl md:text-5xl">✅</div>
                                        <Body className="text-success font-bold text-sm md:text-base">Thông tin đã được cập nhật!</Body>
                                    </div>
                                ) : (
                                    <div className="space-y-3 md:space-y-4">
                                        {epError && (
                                            <div className="p-2.5 md:p-3 rounded-lg md:rounded-xl bg-secondary-light border border-secondary/20 text-secondary text-xs md:text-sm font-medium">
                                                {epError}
                                            </div>
                                        )}
                                        <div className="space-y-1 md:space-y-1.5">
                                            <label className="text-xs md:text-sm font-bold text-heading ml-1">Tên</label>
                                            <input
                                                type="text"
                                                value={epFirstName}
                                                onChange={(e) => setEpFirstName(e.target.value)}
                                                placeholder="Nhập tên của bạn"
                                                className="input-base text-xs md:text-sm"
                                                disabled={epLoading}
                                            />
                                        </div>
                                        <div className="space-y-1 md:space-y-1.5">
                                            <label className="text-xs md:text-sm font-bold text-heading ml-1">Họ</label>
                                            <input
                                                type="text"
                                                value={epLastName}
                                                onChange={(e) => setEpLastName(e.target.value)}
                                                placeholder="Nhập họ của bạn"
                                                className="input-base text-xs md:text-sm"
                                                disabled={epLoading}
                                            />
                                        </div>
                                        <div className="flex gap-2 md:gap-3 pt-2">
                                            <KidButton variant="outline" className="flex-1 text-xs md:text-sm py-1.5 md:py-2" onClick={() => setShowEditProfile(false)} disabled={epLoading}>
                                                Hủy
                                            </KidButton>
                                            <KidButton variant="default" className="flex-1 text-xs md:text-sm py-1.5 md:py-2" onClick={() => void handleEditProfile()} disabled={epLoading}>
                                                {epLoading ? 'Đang lưu...' : 'Lưu'}
                                            </KidButton>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete confirm modal */}
            <AnimatePresence>
                {showDeleteConfirm && selectedChild && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: 'spring', bounce: 0.3 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        >
                            <div className="bg-card border-2 border-error rounded-lg md:rounded-[2rem] p-4 md:p-7 w-full max-w-sm text-center shadow-2xl">
                                <div className="text-4xl md:text-5xl mb-3 md:mb-4">⚠️</div>
                                <Heading level={3} className="text-heading text-base md:text-xl mb-2">
                                    Xóa hồ sơ &quot;{selectedChild.nickname}&quot;?
                                </Heading>
                                <Body className="text-body text-xs md:text-sm mb-4 md:mb-6">Toàn bộ dữ liệu học tập, huy hiệu và item sẽ bị xóa vĩnh viễn.</Body>
                                {deleteError && (
                                    <Body className="text-error text-xs md:text-sm mb-3 md:mb-4">{deleteError}</Body>
                                )}
                                <div className="flex gap-2 md:gap-3">
                                    <KidButton
                                        variant="outline"
                                        className="flex-1 text-xs md:text-sm py-1.5 md:py-2"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeletingChild}
                                    >
                                        Hủy
                                    </KidButton>
                                    <KidButton
                                        variant="destructive"
                                        className="flex-1 text-xs md:text-sm py-1.5 md:py-2"
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
