'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Mic, Volume2, Star, RotateCcw, ChevronRight } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { contentApi, Vocabulary } from '@/features/learning/api/content.api';
import { getPronunciationErrorMessage, submitPronunciation } from '@/features/pronunciation/api/pronunciation.api';
import { markTopicModeCompleted } from '@/features/learning/utils/topic-mode-progress';
import { LearningModeShell, ModeStatePanel } from '@/features/learning/components/LearningModeShell';
import { GameCompleteScreen } from '@/features/learning/components/GameCompleteScreen';

// Confidence → stars mapping (matches backend pronunciation service)
function confidenceToStars(pct: number) {
    if (pct >= 91) return 5;
    if (pct >= 76) return 4;
    if (pct >= 61) return 3;
    if (pct >= 41) return 2;
    return 1;
}

// Points per star tier (matches backend pronunciation rewards)
function starsToPoints(stars: number) {
    if (stars >= 5) return 20;
    if (stars >= 4) return 15;
    if (stars >= 3) return 10;
    return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// encodePcmToWavBase64 — convert raw Float32 PCM chunks → 16-bit WAV → base64
// Used to send real mic audio to Azure Speech backend.
// ─────────────────────────────────────────────────────────────────────────────
function encodePcmToWavBase64(chunks: Float32Array[], sampleRate = 16000): string | null {
    if (chunks.length === 0) return null;

    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const pcm = new Float32Array(totalLen);
    let off = 0;
    for (const c of chunks) { pcm.set(c, off); off += c.length; }

    // Float32 → Int16
    const pcm16 = new Int16Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
        const s = Math.max(-1, Math.min(1, pcm[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // WAV header (44 bytes) + PCM data
    const numCh = 1, bps = 16;
    const byteRate = sampleRate * numCh * (bps / 8);
    const blockAlign = numCh * (bps / 8);
    const dataSize = pcm16.byteLength;
    const buf = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buf);
    const ws = (o: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(o + i, str.charCodeAt(i)); };

    ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
    ws(8, 'WAVE'); ws(12, 'fmt ');
    view.setUint32(16, 16, true);    // PCM subchunk size
    view.setUint16(20, 1, true);     // PCM format
    view.setUint16(22, numCh, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
    view.setUint16(34, bps, true);   ws(36, 'data');
    view.setUint32(40, dataSize, true);
    new Int16Array(buf, 44).set(pcm16);

    // ArrayBuffer → base64 in 8 kB chunks to avoid stack overflow
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 8192) {
        bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
    }
    return btoa(bin);
}

type Stage = 'ready' | 'recording' | 'result';

interface PronunciationResult {
    vocabId: number;
    confidence: number;
    stars: number;
    points: number;
    feedback?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WaveAnimation — mic wave visual while recording
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// StarRating — animated star reveal
// ─────────────────────────────────────────────────────────────────────────────
function StarRating({ stars }: { stars: number }) {
    return (
        <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((s, i) => (
                <motion.div
                    key={s}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.12, type: 'spring', bounce: 0.6 }}
                >
                    <Star
                        size={36}
                        className={s <= stars ? 'text-warning fill-warning drop-shadow-lg' : 'text-border'}
                    />
                </motion.div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Pronunciation Page — UC-03
// Endpoint: POST /api/pronunciation/:vocabularyId
// ─────────────────────────────────────────────────────────────────────────────
export default function PronunciationPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id ?? '';
    const parsedTopicId = Number.parseInt(id, 10);
    const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);
    const [stage, setStage] = useState<Stage>('ready');
    const [countdown, setCountdown] = useState(3);
    const [confidence, setConfidence] = useState(0);
    const [results, setResults] = useState<PronunciationResult[]>([]);
    const [done, setDone] = useState(false);
    const [practiceError, setPracticeError] = useState<string | null>(null);

    useEffect(() => {
        async function loadVocabularies() {
            try {
                setLoading(true);
                if (!Number.isInteger(parsedTopicId) || parsedTopicId <= 0) {
                    setVocabList([]);
                    return;
                }
                const topic = await contentApi.getTopicById(parsedTopicId);
                setVocabList(topic.vocabularies || []);
            } catch (error) {
                console.error('Failed to load vocabularies:', error);
                setVocabList([]);
            } finally {
                setLoading(false);
            }
        }
        loadVocabularies();
    }, [parsedTopicId]);

    const vocab = vocabList[index];

    // Simulate recording + AI scoring (3-second countdown)
    const playCurrentAudio = () => {
        if (!vocab) return;

        const audioSource =
            vocab.audioUrl ||
            vocab.media?.find((m) => m.type === 'AUDIO')?.url;

        if (audioSource) {
            const audio = new Audio(audioSource);
            void audio.play();
            return;
        }

        if (typeof window !== 'undefined' && 'speechSynthesis' in window && vocab.word) {
            const utterance = new SpeechSynthesisUtterance(vocab.word);
            utterance.lang = 'en-US';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <LearningModeShell
            backHref={`/play/topic/${id}`}
            progressCurrent={Math.min(index + 1, Math.max(vocabList.length, 1))}
            progressTotal={Math.max(vocabList.length, 1)}
            title="Luyện phát âm"
            subtitle="Nghe mẫu, nói theo và nhận điểm AI cho từng từ"
            progressFromClass="from-accent"
            progressToClass="to-primary"
            contentMaxWidthClass="max-w-lg md:max-w-2xl"
        >
                <AnimatePresence mode="wait">
                    {loading ? (
                        <ModeStatePanel
                            title="Đang tải từ vựng"
                            description="Chuẩn bị nội dung luyện phát âm cho bé..."
                            emoji="🎧"
                        />
                    ) : vocabList.length === 0 ? (
                        <ModeStatePanel
                            title="Chưa có dữ liệu phát âm"
                            description="Chủ đề này chưa có từ để luyện phát âm."
                            emoji="📭"
                        />
                    ) : done ? (
                        (() => {
                            const avgStars = results.reduce((a, r) => a + r.stars, 0) / results.length;
                            const totalPoints = results.reduce((a, r) => a + r.points, 0);
                            const avgConf = Math.round(results.reduce((a, r) => a + r.confidence, 0) / results.length);

                            return (
                                <GameCompleteScreen
                                    emoji="🎤"
                                    title="Luyện xong rồi! 🎉"
                                    subtitle={`Bé đã phát âm ${results.length} từ`}
                                    starsEarned={Math.round(avgStars)}
                                    maxStars={5}
                                    topicId={id}
                                    onRestart={() => {
                                        setIndex(0);
                                        setStage('ready');
                                        setConfidence(0);
                                        setResults([]);
                                        setDone(false);
                                    }}
                                    restartLabel="Luyện lại"
                                    stats={[
                                        { label: 'Tổng điểm', value: `+${totalPoints}⭐`, colorClass: 'text-warning' },
                                        { label: 'Độ chính xác', value: `${avgConf}%`, colorClass: avgConf >= 76 ? 'text-success' : 'text-primary' },
                                        { label: 'Từ giỏi (4-5⭐)', value: results.filter((r) => r.stars >= 4).length, colorClass: 'text-success' }
                                    ]}
                                />
                            );
                        })()
                    ) : vocab ? (
                        <motion.div key={index} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.25 }} className="space-y-8 max-w-xl mx-auto">

                            {/* Word card */}
                                <motion.div className="bg-card border-2 border-accent/60 rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center gap-5 shadow-xl shadow-accent/10 text-center">
                                    <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity }} className="flex items-center justify-center w-36 h-36">
                                        {vocab.imageUrl ? (
                                            <Image src={vocab.imageUrl} alt={vocab.word} width={144} height={144} className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-8xl">🔊</span>
                                        )}
                                    </motion.div>
                                    <Heading level={2} className="text-heading text-4xl md:text-5xl font-black break-words">{vocab.word}</Heading>
                                    <Caption className="text-caption text-xl">{vocab.phonetic}</Caption>
                                    <Caption className="text-caption text-sm">{vocab.translation}</Caption>

                                {/* Listen button */}
                                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                    className="flex items-center gap-2 bg-primary-light border border-primary/30 text-primary px-5 py-2.5 rounded-full font-heading font-bold text-sm hover:bg-primary hover:text-white transition-colors"
                                    onClick={playCurrentAudio}
                                >
                                    <Volume2 size={18} /> Nghe
                                </motion.button>
                            </motion.div>

                            {/* Stage: ready */}
                            <AnimatePresence mode="wait">
                                {stage === 'ready' && (
                                    <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                                        <Body className="text-body text-center">Nhấn nút để bắt đầu nói từ này</Body>
                                        <motion.button
                                            whileHover={{ scale: 1.06 }}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => {
                                                setPracticeError(null);
                                                setStage('recording');
                                                setCountdown(3);
                                                void (async () => {
                                                    // ── try real mic capture ──────────────────────────────
                                                    const chunks: Float32Array[] = [];
                                                    let ctx: AudioContext | null = null;
                                                    let processor: ScriptProcessorNode | null = null;
                                                    let source: MediaStreamAudioSourceNode | null = null;
                                                    let stream: MediaStream | null = null;
                                                    let recordedSampleRate = 16000;
                                                    try {
                                                        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)({ sampleRate: 16000 });
                                                        await ctx.resume();
                                                        recordedSampleRate = ctx.sampleRate || 16000;
                                                        source = ctx.createMediaStreamSource(stream);
                                                        processor = ctx.createScriptProcessor(4096, 1, 1);
                                                        processor.onaudioprocess = (e) => {
                                                            chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
                                                        };
                                                        source.connect(processor);
                                                        processor.connect(ctx.destination);
                                                    } catch {
                                                        if (stream) {
                                                            stream.getTracks().forEach((track) => track.stop());
                                                        }
                                                    }

                                                    // ── 3-second countdown ───────────────────────────────
                                                    for (let c = 2; c >= 0; c--) {
                                                        await new Promise<void>((res) => setTimeout(res, 1000));
                                                        setCountdown(c);
                                                    }

                                                    // ── stop recording & encode WAV base64 ───────────────
                                                    let audioBase64: string | undefined;
                                                    if (processor && source && ctx && stream) {
                                                        processor.disconnect();
                                                        source.disconnect();
                                                        stream.getTracks().forEach((t) => t.stop());
                                                        void ctx.close();
                                                        audioBase64 = encodePcmToWavBase64(chunks, recordedSampleRate) ?? undefined;
                                                    }

                                                    // ── submit to backend ─────────────────────────────────
                                                    try {
                                                        if (!audioBase64) {
                                                            throw new Error('Không thể thu âm. Vui lòng kiểm tra quyền micro.');
                                                        }
                                                        const response = await submitPronunciation({
                                                            vocabularyId: vocab.id,
                                                            mode: 'WORD',
                                                            referenceText: vocab.word,
                                                            recordingDurationMs: 3000,
                                                            audioBase64,
                                                            audioMimeType: 'audio/wav',
                                                        });
                                                        setConfidence(response.confidenceScore);
                                                        setStage('result');
                                                    } catch (error) {
                                                        console.error('Pronunciation request failed:', error);
                                                        setConfidence(0);
                                                        setPracticeError(getPronunciationErrorMessage(error));
                                                        setStage('ready');
                                                    }
                                                })();
                                            }}
                                            className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-2xl shadow-primary/30 border-4 border-white"
                                        >
                                            <Mic size={40} className="text-white" />
                                        </motion.button>
                                        <Caption className="text-caption text-sm">Phát âm rõ ràng, từng âm một nhé!</Caption>
                                        {practiceError && (
                                            <Caption className="text-error text-center max-w-sm">{practiceError}</Caption>
                                        )}
                                    </motion.div>
                                )}

                                {/* Stage: recording */}
                                {stage === 'recording' && (
                                    <motion.div key="recording" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5">
                                        <WaveAnimation />
                                        <motion.div className="w-20 h-20 rounded-full bg-error flex items-center justify-center shadow-2xl shadow-error/40"
                                            animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0 0px rgba(239,68,68,0.3)', '0 0 0 20px rgba(239,68,68,0)', '0 0 0 0px rgba(239,68,68,0)'] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            <span className="font-heading font-black text-3xl text-white">{countdown}</span>
                                        </motion.div>
                                        <Caption color="textInverse" className="text-caption">
                                            AI đang lắng nghe...
                                        </Caption>
                                    </motion.div>
                                )}

                                {/* Stage: result */}
                                {stage === 'result' && (
                                    <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                        {/* Score ring */}
                                        <div className="flex flex-col items-center gap-2">
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
                                            <StarRating stars={confidenceToStars(confidence)} />
                                            <Caption className="text-success font-bold">
                                                +{starsToPoints(confidenceToStars(confidence))} ⭐ điểm
                                            </Caption>
                                        </div>

                                        {/* Feedback message */}
                                        <div className={`text-center p-4 rounded-2xl border-2 ${confidence >= 76 ? 'bg-success-light border-success text-success' : confidence >= 61 ? 'bg-primary-light border-primary text-primary' : 'bg-warning-light border-warning text-warning'}`}>
                                            <Body className="font-heading font-bold">
                                                {confidence >= 91 ? '🌟 Hoàn hảo! Phát âm chuẩn lắm!' :
                                                    confidence >= 76 ? '✨ Rất tốt! Gần như hoàn hảo!' :
                                                        confidence >= 61 ? '👍 Tốt! Cố lên nha!' :
                                                            '💪 Thử lại để tốt hơn nhé!'}
                                            </Body>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button onClick={() => setStage('ready')} className="flex-1 py-3 rounded-2xl bg-background border-2 border-border font-heading font-bold text-body hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                                                <RotateCcw size={16} /> Thử lại
                                            </button>
                                            <KidButton variant="default" size="default" className="flex-2 flex-1" onClick={() => {
                                                const stars = confidenceToStars(confidence);
                                                const points = starsToPoints(stars);
                                                const newResult: PronunciationResult = { vocabId: vocab.id, confidence, stars, points };
                                                const updated = [...results, newResult];
                                                setResults(updated);

                                                if (index + 1 >= vocabList.length) {
                                                    markTopicModeCompleted(parsedTopicId, 'pronunciation');
                                                    setDone(true);
                                                } else {
                                                    setIndex((i) => i + 1);
                                                    setStage('ready');
                                                    setConfidence(0);
                                                }
                                            }}>
                                                {index + 1 >= vocabList.length ? 'Hoàn thành' : 'Từ tiếp'} <ChevronRight size={16} />
                                            </KidButton>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
        </LearningModeShell>
    );
}
