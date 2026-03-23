'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogOut, Shield, User, Bell } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/shared/store/auth.store';

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

export default function AdminSettingsPage() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const [notifications, setNotifications] = useState(true);

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

    return (
        <div className="min-h-screen pb-8 pt-24">
            <div className="max-w-4xl mx-auto px-6">
                {/* Header */}
                <motion.div initial={{ opacity: 1, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/55 via-card to-accent-light/40 p-5 md:p-6 shadow-sm">
                    <Heading level={2} className="text-heading text-3xl mb-1">Cài đặt Admin ⚙️</Heading>
                    <Body className="text-body">Quản lý tài khoản quản trị viên</Body>
                </motion.div>

                {/* Profile card */}
                <motion.div
                    initial={{ opacity: 1, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-[2rem] p-6 flex items-center gap-5 mb-8 border border-primary/20 shadow-sm"
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                        A
                    </div>
                    <div>
                        <Heading level={3} className="text-heading text-xl mb-0.5">
                            {user?.email?.split('@')[0] || 'Admin'}
                        </Heading>
                        <Caption className="text-caption">{user?.email || 'admin@edukids.com'}</Caption>
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                            <Shield size={12} /> ADMIN
                        </div>
                    </div>
                </motion.div>

                {/* Settings */}
                <motion.div
                    initial={{ opacity: 1, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    {/* Account Section */}
                    <div className="bg-card border border-border/70 rounded-2xl px-5 shadow-sm">
                        <SettingRow icon={<User size={16} />} label="Thông tin tài khoản" desc="Email, tên hiển thị">
                            <Caption className="text-caption text-xs">{user?.email}</Caption>
                        </SettingRow>
                        <SettingRow icon={<Bell size={16} />} label="Thông báo" desc="Nhận cảnh báo hệ thống">
                            <input
                                type="checkbox"
                                checked={notifications}
                                onChange={(e) => setNotifications(e.target.checked)}
                                className="w-10 h-6 rounded-full appearance-none cursor-pointer transition-colors relative bg-slate-300 checked:bg-primary"
                            />
                        </SettingRow>
                    </div>

                    {/* Logout Button */}
                    <KidButton 
                        type="button"
                        variant="outline" 
                        className="w-full text-error border-error/20 hover:bg-error hover:text-white"
                        onClick={handleLogout}
                    >
                        <LogOut size={16} /> Đăng xuất
                    </KidButton>
                </motion.div>
            </div>
        </div>
    );
}
