'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitPronunciation, type PronunciationAttempt } from '@/features/pronunciation/api/pronunciation.api';
import { contentApi } from '@/features/learning/api/content.api';
import { Mic, Square, Volume2, RotateCcw, ArrowLeft } from 'lucide-react';

interface Vocabulary {
  id: number;
  word: string;
  phonetic?: string;
  translation?: string;
  exampleSentence?: string;
  audioUrl?: string;
}

interface PronunciationPageProps {
  params: Promise<{ id: string }>;
}

interface RecognitionResultLike {
  transcript: string;
  confidence: number;
}

interface RecognitionEventLike {
  results: RecognitionResultLike[][];
}

interface RecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export default function PronunciationPage({ params }: PronunciationPageProps) {
  const resolvedParams = React.use(params);
  const vocabularyId = parseInt(resolvedParams.id, 10);
  const router = useRouter();

  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<PronunciationAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const speechWindow = window as SpeechRecognitionWindow;
    if (typeof window !== 'undefined' && (speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition)) {
      const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return;
      }
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  // Fetch vocabulary by ID
  useEffect(() => {
    async function loadVocabulary() {
      try {
        setError(null);
        const item = await contentApi.getVocabularyById(vocabularyId);
        setVocabulary({
          id: item.id,
          word: item.word,
          phonetic: item.phonetic,
          translation: item.translation,
          exampleSentence: item.exampleSentence,
          audioUrl: item.audioUrl,
        });
      } catch (err) {
        console.error('Failed to load vocabulary:', err);
        setVocabulary(null);
        setError('Không thể tải từ vựng để luyện phát âm');
      }
    }
    void loadVocabulary();
  }, [vocabularyId]);

  const playNativeAudio = () => {
    if (audioRef.current && vocabulary?.audioUrl) {
      audioRef.current.play();
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in your browser');
      return;
    }

    setIsRecording(true);
    setError(null);
    setFeedback(null);

    const startTime = Date.now();

    recognitionRef.current.onresult = async (event: RecognitionEventLike) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const confidence = event.results[0][0].confidence;
      const duration = Date.now() - startTime;

      setIsRecording(false);
      setIsProcessing(true);

      try {
        const result = await submitPronunciation(
          vocabularyId,
          Math.round(confidence * 100),
          transcript,
          duration
        );

        setFeedback(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to submit pronunciation');
      } finally {
        setIsProcessing(false);
      }
    };

    recognitionRef.current.onerror = (event: RecognitionErrorEventLike) => {
      setIsRecording(false);
      setError(`Recognition error: ${event.error}`);
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetPractice = () => {
    setFeedback(null);
    setError(null);
  };

  if (!vocabulary) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 px-6">
          <div className="text-center max-w-md">
            <p className="text-red-700 font-semibold mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6 mt-20 pb-28">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8">
        {/* Word Display */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-purple-700 mb-3">{vocabulary.word}</h1>
          {vocabulary.phonetic && (
            <p className="text-2xl text-gray-500 mb-2">{vocabulary.phonetic}</p>
          )}
          {vocabulary.translation && (
            <p className="text-xl text-gray-600 mb-4">{vocabulary.translation}</p>
          )}
          {vocabulary.exampleSentence && (
            <p className="text-gray-500 italic">&quot;{vocabulary.exampleSentence}&quot;</p>
          )}
        </div>

        {/* Native Audio Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={playNativeAudio}
            className="flex items-center gap-3 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition transform hover:scale-105"
          >
            <Volume2 className="w-6 h-6" />
            <span className="font-semibold">Listen</span>
          </button>
          {vocabulary.audioUrl && (
            <audio ref={audioRef} src={vocabulary.audioUrl} preload="auto" />
          )}
        </div>

        {/* Recording Controls */}
        {!feedback && (
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">
              {isRecording ? 'Listening... Say the word!' : 'Click to start recording'}
            </p>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`mx-auto w-32 h-32 rounded-full shadow-2xl transition transform hover:scale-105 flex items-center justify-center ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <Square className="w-12 h-12 text-white" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </button>
            {isProcessing && (
              <p className="mt-4 text-gray-600 animate-pulse">Processing your pronunciation...</p>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <div className="space-y-6 animate-fadeIn">
            {/* Star Rating */}
            <div className="text-center">
              <div className="text-6xl mb-2">{feedback.rating.starEmoji}</div>
              <p className="text-3xl font-bold text-purple-700 mb-2">
                {feedback.rating.feedbackMessage}
              </p>
              {feedback.rating.rewardMessage && (
                <p className="text-xl text-green-600 font-semibold">{feedback.rating.rewardMessage}</p>
              )}
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Score</p>
                <p className="text-3xl font-bold text-purple-700">{feedback.confidenceScore}%</p>
              </div>
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Stars</p>
                <p className="text-3xl font-bold text-pink-700">{feedback.rating.stars}/5</p>
              </div>
            </div>

            {/* Detailed Feedback */}
            {feedback.detailedFeedback && (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-gray-700">{feedback.detailedFeedback}</p>
              </div>
            )}

            {/* Progress Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-gray-600 text-sm">Total Points</p>
                <p className="text-2xl font-bold text-purple-700">{feedback.totalPoints}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Current Level</p>
                <p className="text-2xl font-bold text-purple-700">{feedback.currentLevel}</p>
              </div>
            </div>

            {/* Badge Unlocked */}
            {feedback.badgeUnlocked && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 text-center border-2 border-yellow-400">
                <p className="text-2xl mb-2">🏆</p>
                <p className="font-bold text-yellow-800">{feedback.badgeUnlocked}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetPractice}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition transform hover:scale-105"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full shadow-lg transition transform hover:scale-105"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!feedback && !isRecording && (
          <div className="mt-8 bg-blue-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-3">📌 How to Practice:</h3>
            <ol className="space-y-2 text-gray-700">
              <li>1. Listen to the native pronunciation</li>
              <li>2. Click the microphone button</li>
              <li>3. Say the word clearly</li>
              <li>4. Get instant feedback and earn stars!</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
