'use client';

import { motion } from 'framer-motion';
import { Sparkles, Brain, Mic, Trophy } from 'lucide-react';
import { Body } from '@/shared/components/Typography';
import SpotlightCard from '@/shared/components/landing/SpotlightCard';

export function FeaturesSection() {
    return (
        <section id="features" className="relative z-10 py-32 px-4 bg-background border-y border-border">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 1, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-bold text-sm uppercase tracking-widest mb-4">
                        <Sparkles size={16} /> Thế giới phép thuật
                    </div>
                    <h2 className="font-heading font-black text-4xl sm:text-5xl text-heading mb-6">Trợ Thủ Đắc Lực Cho Bé</h2>
                    <Body className="text-body max-w-2xl mx-auto text-xl">EduKids mang đến không gian học tập sống động, biến những từ vựng khô khan thành chuyến phiêu lưu kỳ thú.</Body>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 px-4 sm:px-0">
                    {/* Feature 1 */}
                    <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }} className="h-full">
                        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)" className="h-full group p-8 sm:p-10 hover:border-success/50 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] hover:-translate-y-2 flex flex-col">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700 ease-out" />
                            <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mb-8 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.3)] group-hover:bg-success group-hover:-translate-y-2 transition-all duration-300">
                                <Brain size={40} className="text-success group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-heading font-bold text-2xl text-heading mb-4 group-hover:text-success transition-colors">Vui Học Qua Trò Chơi</h3>
                            <p className="text-body text-lg leading-relaxed flex-grow">Ghi nhớ từ vựng siêu tốc thông qua hệ thống flashcard thông minh, game lật hình và câu đố tương tác vui nhộn.</p>
                        </SpotlightCard>
                    </motion.div>

                    {/* Feature 2 */}
                    <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="h-full">
                        <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.2)" className="h-full group p-8 sm:p-10 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:-translate-y-2 flex flex-col">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700 ease-out" />
                            <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mb-8 shadow-[0_10px_20px_-10px_rgba(99,102,241,0.3)] group-hover:bg-primary group-hover:-translate-y-2 transition-all duration-300">
                                <Mic size={40} className="text-primary group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-heading font-bold text-2xl text-heading mb-4 group-hover:text-primary transition-colors">Công Nghệ AI Chấm Điểm</h3>
                            <p className="text-body text-lg leading-relaxed flex-grow">Không còn sợ nói sai! Trợ lý AI liên tục lắng nghe, phân tích và hướng dẫn phát âm chuẩn âm điệu người bản xứ.</p>
                        </SpotlightCard>
                    </motion.div>

                    {/* Feature 3 */}
                    <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }} className="h-full">
                        <SpotlightCard spotlightColor="rgba(244, 63, 94, 0.2)" className="h-full group p-8 sm:p-10 hover:border-accent/50 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(244,63,94,0.2)] hover:-translate-y-2 flex flex-col">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700 ease-out" />
                            <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mb-8 shadow-[0_10px_20px_-10px_rgba(244,63,94,0.3)] group-hover:bg-accent group-hover:-translate-y-2 transition-all duration-300">
                                <Trophy size={40} className="text-accent group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-heading font-bold text-2xl text-heading mb-4 group-hover:text-accent transition-colors">Phần Thưởng Hấp Dẫn</h3>
                            <p className="text-body text-lg leading-relaxed flex-grow">Mỗi bài học hoàn thành là một rương báu mở ra! Sưu tầm sao vàng, mua đồ tân trang cho Avatar và đua Top ngay.</p>
                        </SpotlightCard>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
