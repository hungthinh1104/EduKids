'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Ban, Shield, Baby } from 'lucide-react';
import { Caption } from '@/shared/components/Typography';
import { TableBadge } from '@/features/admin/components/AdminUI';

// ── Types shared between users components ────────────────────────────────
export interface ChildSummary {
    nickname: string;
    age: number;
    totalPoints: number;
    streakDays: number;  // BE DTO: streakDays
    currentLevel: number;
}

export interface AdminUser {
    id: number;
    email: string;
    avatar: string;        // full URL
    children: ChildSummary[];
    plan: 'free' | 'premium';
    status: 'active' | 'pending' | 'banned';
    joinedAt: string;
    lastLogin: string;
}

// ── Helper functions (domain logic, not UI) ──────────────────────────────
export const planVariant = (p: string): 'success' | 'neutral' => p === 'premium' ? 'success' : 'neutral';
export const statusVariant = (s: string): 'info' | 'warning' | 'error' =>
    s === 'active' ? 'info' : s === 'pending' ? 'warning' : 'error';
export const statusLabel = (s: string) =>
    s === 'active' ? 'Đang hoạt động' : s === 'pending' ? 'Chờ kích hoạt' : 'Bị khóa';

// ─────────────────────────────────────────────────────────────────────────
// UserTableRow — one row in the users table
// ─────────────────────────────────────────────────────────────────────────
interface UserTableRowProps {
    user: AdminUser;
    index: number;
    isSelected: boolean;
    onToggle: (id: number) => void;
    onView: (u: AdminUser) => void;
}

export function UserTableRow({ user, index, isSelected, onToggle, onView }: UserTableRowProps) {
    return (
        <motion.tr
            initial={{ opacity: 1 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }}
            className={`transition-colors group ${isSelected ? 'bg-primary/5' : 'hover:bg-background'}`}
        >
            <td className="px-5 py-3 w-10">
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
                    checked={isSelected}
                    onChange={() => onToggle(user.id)}
                />
            </td>
            <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                    <Image src={user.avatar} alt={user.email} width={32} height={32} className="rounded-full bg-primary-light" />
                    <div>
                        <div className="font-heading font-bold text-heading text-sm">{user.email}</div>
                        <Caption className="text-caption text-[10px]">ID #{user.id}</Caption>
                    </div>
                </div>
            </td>
            <td className="px-5 py-3">
                <div className="flex items-center gap-1.5">
                    <Baby size={14} className="text-accent" />
                    <span className="font-heading font-bold text-heading">{user.children.length}</span>
                </div>
            </td>
            <td className="px-5 py-3">
                <TableBadge label={user.plan === 'premium' ? '⭐ Premium' : 'Miễn phí'} variant={planVariant(user.plan)} />
            </td>
            <td className="px-5 py-3">
                <TableBadge label={statusLabel(user.status)} variant={statusVariant(user.status)} />
            </td>
            <td className="px-5 py-3 text-caption text-xs">{new Date(user.joinedAt).toLocaleDateString('vi-VN')}</td>
            <td className="px-5 py-3 text-caption text-xs">{new Date(user.lastLogin).toLocaleDateString('vi-VN')}</td>
            <td className="px-5 py-3">
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onView(user)} className="p-1.5 rounded-lg bg-background border border-border text-body hover:bg-primary-light hover:text-primary transition-colors" title="Xem chi tiết">
                        👁
                    </button>
                    <button className="p-1.5 rounded-lg bg-background border border-border text-body hover:bg-primary-light hover:text-primary transition-colors" title="Gửi email">
                        <Mail size={13} />
                    </button>
                    {user.status !== 'banned' ? (
                        <button className="p-1.5 rounded-lg bg-background border border-border text-body hover:bg-error hover:text-white transition-colors" title="Khóa tài khoản">
                            <Ban size={13} />
                        </button>
                    ) : (
                        <button className="p-1.5 rounded-lg bg-background border border-border text-body hover:bg-success hover:text-white transition-colors" title="Mở khóa">
                            <Shield size={13} />
                        </button>
                    )}
                </div>
            </td>
        </motion.tr>
    );
}
