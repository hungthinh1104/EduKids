'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Mail, Ban, Shield, X } from 'lucide-react';
import { Caption } from '@/shared/components/Typography';
import { SectionHeader, TableBadge } from '@/features/admin/components/AdminUI';
import type { AdminUser } from './UserTableRow';
import { planVariant, statusVariant, statusLabel } from './UserTableRow';

interface UserDetailDrawerProps {
    user: AdminUser | null;
    onClose: () => void;
}

/**
 * UserDetailDrawer — slides in from the right to show a parent's full profile:
 * account info, plan/status, metadata, and expansible child profile cards.
 * Used by: /admin/users
 */
export function UserDetailDrawer({ user, onClose }: UserDetailDrawerProps) {
    return (
        <AnimatePresence>
            {user && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l-2 border-border z-50 overflow-y-auto shadow-2xl"
                    >
                        <div className="p-6 space-y-6">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <SectionHeader title="Chi tiết tài khoản" />
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 rounded-xl bg-background border border-border hover:bg-error hover:text-white transition-colors text-body"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* User info card */}
                            <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border-2 border-border">
                                <Image src={user.avatar} alt={user.email} width={56} height={56} className="rounded-full bg-primary-light" />
                                <div>
                                    <div className="font-heading font-black text-heading">{user.email}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <TableBadge label={user.plan === 'premium' ? '⭐ Premium' : 'Miễn phí'} variant={planVariant(user.plan)} />
                                        <TableBadge label={statusLabel(user.status)} variant={statusVariant(user.status)} />
                                    </div>
                                </div>
                            </div>

                            {/* Metadata grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[
                                    { label: 'ID', value: `#${user.id}` },
                                    { label: 'Số bé', value: `${user.children.length} hồ sơ` },
                                    { label: 'Tham gia', value: new Date(user.joinedAt).toLocaleDateString('vi-VN') },
                                    { label: 'Lần cuối GD', value: new Date(user.lastLogin).toLocaleDateString('vi-VN') },
                                ].map((row) => (
                                    <div key={row.label} className="bg-background border border-border rounded-xl p-3">
                                        <Caption className="text-caption text-xs">{row.label}</Caption>
                                        <div className="font-heading font-bold text-heading mt-0.5">{row.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Child profiles */}
                            {user.children.length > 0 ? (
                                <div>
                                    <Caption className="text-caption text-xs font-bold uppercase tracking-wider mb-3">Hồ sơ bé</Caption>
                                    <div className="space-y-3">
                                        {user.children.map((child, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                                className="flex items-center justify-between p-3 bg-background border-2 border-border rounded-2xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center font-heading font-black text-primary text-sm">
                                                        {child.nickname[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-heading font-bold text-heading text-sm">{child.nickname}</div>
                                                        <Caption className="text-caption text-xs">{child.age} tuổi · Lv.{child.currentLevel}</Caption>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-heading font-black text-warning text-sm">⭐ {child.totalPoints.toLocaleString()}</div>
                                                    <Caption className="text-caption text-xs">🔥 {child.streakDays} ngày</Caption>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-background border-2 border-dashed border-border rounded-2xl">
                                    <div className="text-3xl mb-2">👶</div>
                                    <Caption className="text-caption">Chưa có hồ sơ bé nào</Caption>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled
                                    title="Chức năng này sẽ được nối sau"
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-light/60 text-primary/70 font-heading font-bold text-sm border-2 border-primary/30 cursor-not-allowed opacity-75"
                                >
                                    <Mail size={15} /> Gửi email
                                </button>
                                {user.status !== 'banned' ? (
                                    <button
                                        type="button"
                                        disabled
                                        title="Chức năng này sẽ được nối sau"
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-error-light/60 text-error/70 font-heading font-bold text-sm border-2 border-error/30 cursor-not-allowed opacity-75"
                                    >
                                        <Ban size={15} /> Khóa tài khoản
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        title="Chức năng này sẽ được nối sau"
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success-light/60 text-success/70 font-heading font-bold text-sm border-2 border-success/30 cursor-not-allowed opacity-75"
                                    >
                                        <Shield size={15} /> Mở khóa
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
