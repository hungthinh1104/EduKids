'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { HeartPulse, CheckCircle2, Star } from 'lucide-react';

export function TestimonialsSection() {
    return (
        <section id="parents" className="py-32 px-4 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-20 items-center">

                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 1, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-error-light dark:bg-error/30 text-error font-bold text-sm tracking-widest mb-6">
                            <HeartPulse size={16} /> GÓC PHỤ HUYNH
                        </div>
                        <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-heading mb-8 leading-[1.15]">
                            Đồng hành cùng con, <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-error to-warning">An tâm tuyệt đối.</span>
                        </h2>
                        <p className="text-xl mb-10 leading-relaxed text-body">
                            Hàng ngàn phụ huynh Việt Nam đã tin tưởng chọn <b>EduKids</b> làm người bạn đồng hành giúp bé phát triển tư duy ngoại ngữ một cách tự nhiên và an toàn nhất.
                        </p>

                        <div className="space-y-6 mb-12">
                            {[
                                { title: 'Báo cáo học tập tự động', desc: 'Nhận phân tích chi tiết lộ trình học qua Email/Zalo mỗi tuần.' },
                                { title: 'Môi trường 100% An toàn', desc: 'Không chứa quảng cáo và nội dung độc hại. Giao diện thân thiện với trẻ nhỏ.' },
                                { title: 'Kiểm soát thời gian', desc: 'Tính năng nhắc nhở nghỉ ngơi bảo vệ thị lực cho bé.' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-card shadow-sm border border-transparent hover:border-border transition-all">
                                    <div className="bg-success-light dark:bg-success/20 p-2 rounded-xl mt-1">
                                        <CheckCircle2 className="text-success" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-heading font-bold text-xl text-heading mb-1">{item.title}</h4>
                                        <p className="text-body">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Reviews */}
                    <div className="relative">
                        {/* Decorative blobs */}
                        <div className="absolute top-20 right-0 w-32 h-32 md:w-72 md:h-72 bg-error-light dark:bg-error/20 rounded-full blur-2xl md:blur-3xl -z-10"></div>
                        <div className="absolute bottom-0 left-10 w-32 h-32 md:w-64 md:h-64 bg-warning-light dark:bg-warning/20 rounded-full blur-2xl md:blur-3xl -z-10"></div>

                        <div className="flex flex-col gap-8">
                            {/* Review Card 1 */}
                            <motion.div
                                initial={{ opacity: 1, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="bg-card p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-border relative translate-x-0 lg:-translate-x-10"
                            >
                                <div className="flex items-center gap-1.5 text-warning mb-6">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="fill-current" size={22} />)}
                                </div>
                                <p className="italic text-body mb-8 text-xl leading-relaxed">
                                    &quot;Bé Bi nhà mình từ hồi học EduKids tự giác hẳn. Tối nào ăn cơm xong cũng đòi vọc iPad đọc từ mới lấy phần thưởng. Phát âm của con dạo này tây lắm luôn!&quot;
                                </p>
                                <div className="flex items-center gap-5 border-t border-border pt-6">
                                    <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=Trinh" alt="Avatar" width={60} height={60} className="rounded-full bg-background border-2 border-background" />
                                    <div>
                                        <h5 className="font-heading font-bold text-heading text-lg">Trần Thu Trà</h5>
                                        <span className="text-muted text-sm">Mẹ bé Bi (7 tuổi)</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Review Card 2 */}
                            <motion.div
                                initial={{ opacity: 1, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="bg-card p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-border relative translate-x-0 lg:translate-x-10"
                            >
                                <div className="flex items-center gap-1.5 text-warning mb-6">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="fill-current" size={22} />)}
                                </div>
                                <p className="italic text-body mb-8 text-xl leading-relaxed">
                                    &quot;App màu sắc siêu đẹp, thiết kế nhân vật giống y chơi game nên hai đứa nhà mình khoái lắm. Hơn cả học tiếng Anh, nó giúp bé rèn luyện tư duy rất tốt.&quot;
                                </p>
                                <div className="flex items-center gap-5 border-t border-border pt-6">
                                    <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=HoangPhat" alt="Avatar" width={60} height={60} className="rounded-full bg-background border-2 border-background" />
                                    <div>
                                        <h5 className="font-heading font-bold text-heading text-lg">Lê Hoàng Phát</h5>
                                        <span className="text-muted text-sm">Ba cặp song sinh Nhím & Thỏ</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
