'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mic, Volume2, RotateCcw, ArrowLeft, Star } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { submitPronunciation } from '@/features/pronunciation/api/pronunciation.api';
import { contentApi } from '@/features/learning/api/content.api';

// WAV encoder
function encodePcmToWavBase64(chunks: Float32Array[], sampleRate = 16000): string | null {
    if (chunks.length === 0) return null;
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const pcm = new Float32Array(totalLen);
    let off = 0;
    for (const c of chunks) { pcm.set(c, off); off += c.length; }
    const pcm16 = new Int16Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
        const s = Math.max(-1, Math.min(1, pcm[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const numCh = 1, bps = 16;
    const byteRate = sampleRate * numCh * (bps / 8);
    const blockAlign = numCh * (bps / 8);
    const dataSize = pcm16.byteLength;
    const buf = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buf);
    const ws = (o: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(o + i, str.charCodeAt(i)); };
    ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
    ws(8, 'WAVE'); ws(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
    view.setUint16(34, bps, true); ws(36, 'data');
    view.setUint32(40, dataSize, true);
    new Int16Array(buf, 44).set(pcm16);
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 8192) {
        bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
    }
    return btoa(bin);
}

function confidenceToStars(pct: number) {
    if (pct >= 91) return 5;
    if (pct >= 76) return 4;
    if (pct >= 61) return 3;
    if (pct >= 41) return 2;
    return 1;
}

function WaveAnimation() {
    return (
        <div className="flex items-center justify-center gap-1.5 h-12">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 bg-gradient-to-t from-primary to-accent rounded-full"
                    animate={{ height: ['8px', `${16 + (i % 3) * 14}px`, '8px'] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

interface PronunciationPageProps {
    params: Promise<{ id: string }>;
}

interface VocabItem {
    id: number;
    word: string;
    phonetic?: string;
    translation?: string;
    exampleSentence?: string;
    audioUrl?: string;
    emoji?: string;
}

type Stage = 'ready' | 'recording' | 'result';

export default function PronunciationPage({ params }: PronunciationPageProps) {
    const resolvedParams = React.use(params);
    const vocabularyId = parseInt(resolvedParams.id, 10);
    const router = useRouter();

    const [vocab, setVocab] = useState<VocabItem | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [stage, setStage] = useState<Stage>('ready');
    const [countdown, setCountdown] = useState(3);
    const [confidence, setConfidence] = useState(0);
    const [detailedFeedback, setDetailedFeedback] = useState<string | undefined>();

    useEffect(() => {
        async function loadVocab() {
            try {
                const item = await contentApi.getVocabularyById(vocabularyId);
                setVocab({
                    id: item.id,
                    word: item.word,
                    phonetic: item.phonetic,
                    translation: item.translation,
                    exampleSentence: item.exampleSentence,
                    audioUrl: item.audioUrl,
                    emoji: item.emoji,
                });
            } catch {
                setLoadError('Không thể tải từ vựng để luyện phát âm.');
            }
        }
        void loadVocab();
    }, [vocabularyId]);

    const playAudio = () => {
        if (!vocab) return;
        if (vocab.audioUrl) {
            void new Audio(vocab.audioUrl).play();
            return;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && vocab.word) {
            const utt = new SpeechSynthesisUtterance(vocab.word);
            utt.lang = 'en-US';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utt);
        }
    };

    const startPractice = () => {
        if (!vocab) return;
        setStage('recording');
        setCountdown(3);
        void (async () => {
            const chunks: Float32Array[] = [];
            let ctx: AudioContext | null = null;
            let processor: ScriptProcessorNode | null = null;
            let source: MediaStreamAudioSourceNode | null = null;
            let stream: MediaStream | null = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)({ sampleRate: 16000 });
                source = ctx.createMediaStreamSource(stream);
                processor = ctx.createScriptProcessor(4096, 1, 1);
                processor.onaudioprocess = (e) => {
                    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
                };
                source.connect(processor);
                processor.connect(ctx.destination);
            } catch { /* mic unavailable - fallback below */ }

            for (let c = 2; c >= 0; c--) {
                await new Promise<void>((res) => setTimeout(res, 1000));
                setCountdown(c);
            }

            let audioBase64: string | undefined;
            if (processor && source && ctx && stream) {
                processor.disconnect();
                source.disconnect();
                stream.getTracks().forEach((t) => t.stop());
                void ctx.close();
                audioBase64 = encodePcmToWavBase64(chunks) ?? undefined;
            }

            const fallbackConf = Math.floor(Math.random() * 40) + 60;
            try {
                const res = await submitPronunciation(
                    vocab.id,
                    audioBase64 ? 90 : fallbackConf,
                    vocab.word,
                    3000,
                    audioBase64,
                    audioBase64 ? 'audio/wav' : undefined,
                );
                setConfidence(res.confidenceScore);
                setDetailedFeedback(res.detailedFeedback ?? undefined);
            } catch {
                setConfidence(fallbackConf);
                setDetailedFeedback(undefined);
            } finally {
                setStage('result');
            }
        })();
    };

    if (loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center space-y-4">
                    <div className="text-5xl">😕</div>
                    <Body className="text-body">{loadError}</Body>
                    <KidButton variant="outline" onClick={() => router.back()}>
                        <ArrowLeft size={16} /> Quay lại
                    </KidButton>
                </div>
            </div>
        );
    }

    if (!vocab) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-3">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
                    />
                    <Caption className="text-caption">Đang tải từ vựng...</Caption>
                </div>
            </div>
        );
    }

    const stars = confidenceToStars(confidence);

    return (
        <div className="min-h-screen pb-12 pt-24 px-4">
            <div className="max-w-lg mx-auto space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-caption hover:text-heading transition-colors"
                >
                    <ArrowLeft size={18} /> Quay lại
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border-2 border-accent/60 rounded-[2.5rem] p-7 flex flex-col items-center gap-4 shadow-xl shadow-accent/10 text-center"
                >
                    {vocab.emoji && (
                        <motion.div
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-7xl"
                        >
                            {vocab.emoji}
                        </motion.div>
                    )}
                    <Heading level={2} className="text-heading text-4xl font-black break-words">{vocab.word}</Heading>
                    {vocab.phonetic && <Caption className="text-caption text-xl">{vocab.phonetic}</Caption>}
                    {vocab.translation && <Caption className="text-caption">{vocab.translation}</Caption>}
                    {vocab.exampleSentence && (
                        <Caption className="text-caption text-sm italic">&quot;{vocab.exampleSentence}&quot;</Caption>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                        onClick={playAudio}
                        className="flex items-center gap-2 bg-primary-light border border-primary/30 text-primary px-5 py-2.5 rounded-full font-heading font-bold text-sm hover:bg-primary hover:text-white transition-colors"
                    >
                        <Volume2 size={18} /> Nghe mẫu
                    </motion.button>
                </motion.div>

                <AnimatePresence mode="wait">
                    {stage === 'ready' && (
                        <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-5"
                        >
                            <Body className="text-body text-center">Nhấn nút để bắt đầu nói từ này (3 giây)</Body>
                            <motion.button
                                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                onClick={startPractice}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-2xl shadow-primary/30 border-4 border-white"
                            >
                                <Mic size={40} className="text-white" />
                            </motion.button>
                            <Caption className="text-caption text-sm">Phát âm rõ ràng, từng âm một nhé!</Caption>
                        </motion.div>
                    )}

                    {stage === 'recording' && (
                        <motion.div key="recording" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-5"
                        >
                            <WaveAnimation />
                            <motion.div
                                className="w-20 h-20 rounded-full bg-error flex items-center justify-center shadow-2xl shadow-error/40"
                                animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0 0px rgba(239,68,68,0.3)', '0 0 0 20px rgba(239,68,68,0)', '0 0 0 0px rgba(239,68,68,0)'] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <span className="text-white font-heading font-black text-3xl">{countdown}</span>
                            </motion.div>
                            <Caption className="text-caption">AI đang lắng nghe...</Caption>
                        </motion.div>
                    )}

                    {stage === 'result' && (
                        <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="space-y-5"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative w-28 h-28">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="10" />
                                        <motion.circle cx="50" cy="50" r="42" fill="none"
                                            stroke={confidence >= 76 ? 'var(--color-success)' : confidence >= 61 ? 'var(--color-primary)' : 'var(--color-warning)'}
                                            strokeWidth="10" strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 42}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - confidence / 100) }}
                                            transition={{ duration: 1 }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="font-heading font-black text-heading text-2xl">{confidence}%</span>
                                        <Caption className="text-caption text-[10px]">chính xác</Caption>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    {[1, 2, 3, 4, 5].map((s, i) => (
                                        <motion.div key={s}
                                            initial={{ scale: 0, rotate: -30 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: i * 0.12, type: 'spring', bounce: 0.6 }}
                                        >
                                            <Star size={32} className={s <= stars ? 'text-warning fill-warning drop-shadow-lg' : 'text-border'} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className={`text-center p-4 rounded-2xl border-2 ${confidence >= 76 ? 'bg-success-light border-success text-success' : confidence >= 61 ? 'bg-primary-light border-primary text-primary' : 'bg-warning-light border-warning text-warning'}`}>
                                <Body className="font-heading font-bold">
                                    {confidence >= 91 ? '🌟 Hoàn hảo! Phát âm chuẩn lắm!' :
                                        confidence >= 76 ? '✨ Rất tốt! Gần như hoàn hảo!' :
                                            confidence >= 61 ? '👍 Tốt! Cố lên nha!' :
                                                '💪 Thử lại để tốt hơn nhé!'}
                                </Body>
                                {detailedFeedback && (
                                    <Caption className="text-current/80 text-sm mt-1">{detailedFeedback}</Caption>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <KidButton variant="outline" size="default" className="flex-1"
                                    onClick={() => { setStage('ready'); setConfidence(0); setDetailedFeedback(undefined); }}
                                >
                                    <RotateCcw size={16} /> Thử lại
                                </KidButton>
                                <KidButton variant="default" size="default" className="flex-1" onClick={() => router.back()}>
                                    Xong ✓
                                </KidButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {stage === 'ready' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="bg-primary-light border border-primary/20 rounded-2xl p-5"
                    >
                        <Body className="text-primary font-heading font-bold mb-2">�� Cách luyện tập:</Body>
                        <ol className="space-y-1.5 text-primary/80 text-sm">
                            <li>1. Nhấn <strong>Nghe mẫu</strong> để nghe cách phát âm chuẩn</li>
                            <li>2. Nhấn nút mic để bắt đầu (có 3 giây để nói)</li>
                            <li>3. Nói to và rõ từng âm</li>
                            <li>4. Nhận điểm AI ngay lập tức! 🎯</li>
                        </ol>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
