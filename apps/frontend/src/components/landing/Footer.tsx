import Link from 'next/link';
import { Sparkles, Facebook, Youtube, Instagram } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-background text-muted pt-24 pb-12 px-6 border-t border-border">
            <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-2 md:col-span-1 pr-0 lg:pr-12">
                    <div className="flex items-center gap-3 mb-6 font-heading font-black text-3xl text-heading">
                        <Sparkles size={28} className="text-primary" /> EduKids.
                    </div>
                    <p className="text-base leading-relaxed mb-8">
                        Học viện Anh ngữ thông minh kỷ nguyên mới. Khơi nguồn đam mê học tập bằng Gamification và Trí Tuệ Nhân Tạo.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="w-12 h-12 rounded-full bg-slate-900/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:-translate-y-1" aria-label="Facebook">
                            <Facebook size={20} />
                        </a>
                        <a href="#" className="w-12 h-12 rounded-full bg-slate-900/50 flex items-center justify-center hover:bg-error hover:text-white transition-all hover:-translate-y-1" aria-label="YouTube">
                            <Youtube size={20} />
                        </a>
                        <a href="#" className="w-12 h-12 rounded-full bg-slate-900/50 flex items-center justify-center hover:bg-accent hover:text-white transition-all hover:-translate-y-1" aria-label="Instagram">
                            <Instagram size={20} />
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="text-heading font-bold font-heading mb-6 text-xl">Nền Tảng</h4>
                    <ul className="space-y-4">
                        <li><a href="#" className="hover:text-primary transition-colors inline-block">Trò Chơi Tương Tác</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors inline-block">Chấm Điểm AI</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors inline-block">Bảng Xếp Hạng</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors inline-block">Báo Cáo Phụ Huynh</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-heading font-bold font-heading mb-6 text-xl">Hỗ Trợ</h4>
                    <ul className="space-y-4">
                        <li><Link href="#" className="hover:text-primary transition-colors inline-block">Cẩm nang nuôi dạy trẻ</Link></li>
                        <li><Link href="/faq" className="hover:text-primary transition-colors inline-block">Tuyển dụng</Link></li>
                        <li><Link href="/contact" className="hover:text-primary transition-colors inline-block">Liên hệ tư vấn</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-heading font-bold font-heading mb-6 text-xl">Đăng Ký Nhận Tin</h4>
                    <p className="text-sm mb-4">Nhận giáo án và bài tập mầm non miễn phí mỗi tuần qua Email.</p>
                    <div className="flex border border-border rounded-full p-1 bg-card/70 focus-within:border-primary transition-colors overflow-hidden">
                        <input type="email" placeholder="Email của ba/mẹ..." className="bg-transparent border-none outline-none px-4 w-full text-heading text-sm" />
                        <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors">
                            Gửi
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium">
                <div>© 2026 EduKids EduTech JSC. All rights reserved.</div>
                <div className="flex gap-8">
                    <Link href="/terms" className="hover:text-heading transition-colors">Điều Khoản Dịch Vụ</Link>
                    <Link href="/privacy" className="hover:text-heading transition-colors">Bảo Mật Thông Tin</Link>
                </div>
            </div>
        </footer>
    );
}
