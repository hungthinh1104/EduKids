'use client';

import { useState } from 'react';
import { KidButton } from '@/components/edukids/KidButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

export function ContactForm() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Vui lòng nhập tên của bạn.');
            return;
        }
        if (!message.trim()) {
            toast.error('Vui lòng nhập nội dung tin nhắn.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Simulate network delay (replace with real API call when email service is set up)
            await new Promise<void>((res) => setTimeout(res, 1200));

            setSubmitted(true);
            toast.success('Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi trong 24h.');
            setName(''); setPhone(''); setEmail(''); setMessage('');
            setTimeout(() => setSubmitted(false), 5000);
        } catch {
            toast.error('Gửi tin nhắn thất bại. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-bold text-body">Tên của ba/mẹ <span className="text-secondary">*</span></Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="h-14 rounded-2xl bg-background border-2 dark:border-border"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-3">
                    <Label htmlFor="phone" className="text-base font-bold text-body">Số điện thoại</Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="h-14 rounded-2xl bg-background border-2 dark:border-border"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-bold text-body">Địa chỉ Email (Tùy chọn)</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@vi-du.com"
                    className="h-14 rounded-2xl bg-background border-2 dark:border-border"
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-3">
                <Label htmlFor="message" className="text-base font-bold text-body">Nội dung tin nhắn <span className="text-secondary">*</span></Label>
                <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ba mẹ đang gặp vấn đề gì hoặc cần tư vấn lộ trình nào ạ?"
                    className="min-h-[160px] rounded-2xl bg-background border-2 resize-none p-4 dark:border-border"
                    disabled={isSubmitting}
                />
            </div>

            <KidButton
                type="submit"
                size="lg"
                className="w-full text-xl py-8 mt-4 shadow-xl shadow-blue-200/50"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <><Loader2 size={22} className="animate-spin mr-2" /> Đang gửi...</>
                ) : submitted ? (
                    <><CheckCircle2 size={22} className="mr-2" /> Đã gửi! 🎉</>
                ) : (
                    'Gửi Đi Ngay Thôi 🚀'
                )}
            </KidButton>
        </form>
    );
}
