import { Heading, Body, Display } from '@/shared/components/Typography';
import { FeatureCard } from '@/components/edukids/FeatureCard';
import { KidButton } from '@/components/edukids/KidButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, PhoneCall, MapPin, MessageSquareHeart } from 'lucide-react';

export const metadata = {
    title: 'Liên hệ | EduKids',
    description: 'Trung tâm hỗ trợ phụ huynh EduKids - Luôn lắng nghe và đồng hành.',
};

export default function ContactPage() {
    return (
        <main className="min-h-screen pt-40 pb-24 px-4 bg-gradient-to-br from-pink-50 via-white to-blue-50 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10 w-full px-4 lg:px-0">
                <div className="text-center mb-16">
                    <Display className="mb-6 text-heading">
                        Trò chuyện với <span className="text-transparent bg-clip-text gradient-candy">EduKids</span>
                    </Display>
                    <Body size="lg" className="text-body max-w-2xl mx-auto">
                        Khó khăn kỹ thuật? Quan tâm chính sách đại lý? Hay chỉ đơn giản là muốn khoe thành tích của bé? EduKids luôn ở đây để lắng nghe!
                    </Body>
                </div>

                <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 items-start">
                    {/* Left Column: Contact Info Cards */}
                    <div className="lg:col-span-2 space-y-6">
                        <FeatureCard borderColor="primary" className="p-8 group cursor-default">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                <PhoneCall size={32} />
                            </div>
                            <Heading level={3} className="text-xl mb-2 text-heading">Tổng đài phụ huynh</Heading>
                            <Body className="font-bold text-primary text-xl">1900 1000</Body>
                            <Body className="text-sm mt-1">Sáng: 8h00 - 12h00 | Chiều: 13h30 - 21h00</Body>
                        </FeatureCard>

                        <FeatureCard borderColor="success" className="p-8 group cursor-default">
                            <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mb-4 text-success group-hover:bg-success group-hover:text-white transition-colors duration-300">
                                <Mail size={32} />
                            </div>
                            <Heading level={3} className="text-xl mb-2 text-heading">Hỗ trợ qua thư</Heading>
                            <Body className="font-bold text-success text-xl">hello@edukids.vn</Body>
                            <Body className="text-sm mt-1">Chúng tôi cam kết phản hồi trong 24h làm việc.</Body>
                        </FeatureCard>

                        <FeatureCard borderColor="accent" className="p-8 group cursor-default">
                            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-4 text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                                <MapPin size={32} />
                            </div>
                            <Heading level={3} className="text-xl mb-2 text-heading">Trụ sở chính</Heading>
                            <Body className="font-bold text-accent">Tòa nhà EduKids Tower</Body>
                            <Body className="text-sm mt-1">123 Đường Sáng Tạo, Quận Vui Vẻ, Thành phố Hạnh Phúc.</Body>
                        </FeatureCard>
                    </div>

                    {/* Right Column: Interactive Form */}
                    <div className="lg:col-span-3 bg-card rounded-[2.5rem] p-8 md:p-12 border-4 border-border shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-accent-light dark:bg-pink-900/50 text-accent rounded-2xl">
                                <MessageSquareHeart size={32} />
                            </div>
                            <Heading level={2} className="text-3xl text-heading">Gửi lời nhắn</Heading>
                        </div>

                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-base font-bold text-slate-700">Tên của ba/mẹ</Label>
                                    <Input id="name" placeholder="Ví dụ: Nguyễn Văn A" className="h-14 rounded-2xl bg-background dark:bg-slate-900 border-2 dark:border-slate-700" />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="phone" className="text-base font-bold text-slate-700">Số điện thoại</Label>
                                    <Input id="phone" type="tel" placeholder="0901234567" className="h-14 rounded-2xl bg-background dark:bg-slate-900 border-2 dark:border-slate-700" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-base font-bold text-slate-700">Địa chỉ Email (Tùy chọn)</Label>
                                <Input id="email" type="email" placeholder="email@vi-du.com" className="h-14 rounded-2xl bg-background dark:bg-slate-900 border-2 dark:border-slate-700" />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="message" className="text-base font-bold text-slate-700">Nội dung tin nhắn</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Ba mẹ đang gặp vấn đề gì hoặc cần tư vấn lộ trình nào ạ?"
                                    className="min-h-[160px] rounded-2xl bg-background dark:bg-slate-900 border-2 resize-none p-4 dark:border-slate-700"
                                />
                            </div>

                            <KidButton type="button" size="lg" className="w-full text-xl py-8 mt-4 shadow-xl shadow-blue-200/50">
                                Gửi Đi Ngay Thôi 🚀
                            </KidButton>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
