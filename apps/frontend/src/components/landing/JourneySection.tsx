'use client';

import { motion } from 'framer-motion';
import { Sparkles, Play, Trophy } from 'lucide-react';

export function JourneySection() {
    return (
        <section id="how-it-works" className="py-32 px-4 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute w-[800px] h-[800px] bg-primary rounded-full blur-[150px] -top-96 -left-96"></div>
                <div className="absolute w-[800px] h-[800px] bg-accent rounded-full blur-[150px] top-60 -right-96"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 1, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-24"
                >
                    <h2 className="font-heading font-black text-4xl sm:text-5xl mb-6">Hành Trình Chinh Phục</h2>
                    <p className="text-slate-300 max-w-2xl mx-auto text-xl font-medium">Lộ trình học tập khoa học được thiết kế thành 3 chặng đường đầy cảm hứng.</p>
                </motion.div>

                <div className="relative">
                    {/* Dashed Connection Line (Desktop only) */}
                    <div className="hidden md:block absolute top-[120px] left-[15%] right-[15%] h-1 border-t-2 border-dashed border-white/20 z-0">
                        {/* Animated ball moving along line */}
                        <motion.div
                            animate={{ left: ['0%', '100%'] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                            className="absolute top-[-5px] w-3 h-3 bg-white rounded-full shadow-[0_0_15px_white]"
                        />
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 lg:gap-8 relative z-10">
                        {[
                            { step: 1, title: 'Định Hình Phong Cách', desc: 'Thiết kế người bạn đồng hành 3D độc quyền, chọn biệt danh và bước vào học viện.', icon: Sparkles, color: 'text-primary', bg: 'bg-primary' },
                            { step: 2, title: 'Hấp Thụ Kiến Thức', desc: 'Thưởng thức các đoạn video hoạt hình đỉnh cao, tự động tiếp thu từ vựng và mẫu câu.', icon: Play, color: 'text-secondary', bg: 'bg-secondary' },
                            { step: 3, title: 'Thực Hành & Chiến Thắng', desc: 'Tham gia đấu trường Flashcard, luyện giọng cùng AI để rinh trọn kho báu cực đã.', icon: Trophy, color: 'text-accent', bg: 'bg-accent' },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 1, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.7, delay: index * 0.2 }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className="w-64 h-64 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8 flex flex-col items-center justify-center relative mb-8 group-hover:bg-white/10 transition-colors duration-500 shadow-2xl">
                                    <div className={`absolute -top-8 w-16 h-16 ${item.bg} rounded-2xl rotate-12 flex items-center justify-center font-heading font-black text-2xl shadow-lg ring-4 ring-slate-900 group-hover:rotate-0 transition-transform duration-500`}>
                                        {item.step}
                                    </div>
                                    <item.icon size={64} className={`${item.color} mb-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500`} strokeWidth={1.5} />
                                    <h3 className={`font-heading font-black text-2xl mb-3 ${item.color} drop-shadow-md`}>{item.title}</h3>
                                </div>
                                <p className="text-slate-300 text-lg leading-relaxed max-w-sm px-4 group-hover:text-white transition-colors">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
