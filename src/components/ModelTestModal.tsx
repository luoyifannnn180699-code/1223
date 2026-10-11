import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Volume2, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HSK_MODEL_TEST, ExamQuestion } from '../data/hskWorkbook';
import { speechEngine } from '../services/speech';
import { soundEffects } from '../services/soundEffects';
import { dbService } from '../services/db';

interface ModelTestModalProps {
  audioSpeed: number;
}

export const ModelTestModal: React.FC<ModelTestModalProps> = ({ audioSpeed }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(35 * 60); // 35 minutes
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    if (!examStarted || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examStarted, isSubmitted]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    setExamStarted(true);
    setIsSubmitted(false);
    setAnswers({});
    setTimeLeft(35 * 60);
    setCurrentIdx(0);
    dbService.logActivity('TAKE_EXAM', 'Memulai Simulasi Ujian HSK Level 1 Resmi');
  };

  const currentQ: ExamQuestion = HSK_MODEL_TEST[currentIdx];

  const handleSelect = (optIdx: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
  };

  const handlePlayAudio = () => {
    if (currentQ.audioPrompt) {
      speechEngine.speak(currentQ.audioPrompt, audioSpeed);
    }
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    let correctCount = 0;
    HSK_MODEL_TEST.forEach((q) => {
      if (answers[q.id] === q.answer) correctCount++;
    });

    const score = Math.round((correctCount / HSK_MODEL_TEST.length) * 200);
    const passed = score >= 120;

    if (passed) {
      soundEffects.playSuccess();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch {
        // ignore
      }
      dbService.addStars(50);
    } else {
      soundEffects.playError();
      dbService.addStars(15);
    }

    dbService.logActivity(
      'TAKE_EXAM',
      `Menyelesaikan Ujian Simulasi HSK 1: Skor ${score}/200 (${passed ? 'Lulus' : 'Remedial'})`,
      undefined,
      score
    );
  };

  const calculateScore = () => {
    let correct = 0;
    HSK_MODEL_TEST.forEach((q) => {
      if (answers[q.id] === q.answer) correct++;
    });
    const total = HSK_MODEL_TEST.length;
    const score = Math.round((correct / total) * 200);
    return { correct, total, score, passed: score >= 120 };
  };

  if (!examStarted) {
    return (
      <div className="border-2 border-[#E0DED9] bg-[bg-white] p-8 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 border-2 border-[#E0DED9] bg-[bg-[#F8F7F4]] flex items-center justify-center text-3xl mx-auto">
          📜
        </div>

        <div className="space-y-2">
          <span className="font-mono-code text-[10px] uppercase tracking-widest bg-white/5 border-2 border-[#E0DED9] text-[#444444] px-2 py-0.5">
            Lampiran Resmi Workbook 1
          </span>
          <h2 className="text-2xl md:text-3xl font-sans text-[#2C2C2C]">
            Simulasi Ujian Resmi HSK Level 1 (模拟试卷)
          </h2>
          <p className="text-xs text-[#666666] font-sans max-w-lg mx-auto">
            Uji kemampuan Bahasa Mandarin HSK 1 Anda dengan format standar Hanban: Bagian 听力 (Mendengarkan) dan 阅读 (Membaca).
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-left max-w-md mx-auto font-mono-code text-xs">
          <div className="border-2 border-[#E0DED9] bg-[bg-[#FFFDF9]] p-3 space-y-1">
            <span className="text-[10px] text-[#888888] uppercase block">Jumlah Soal</span>
            <span className="text-sm font-bold text-[#2C2C2C]">{HSK_MODEL_TEST.length} Butir</span>
          </div>
          <div className="border-2 border-[#E0DED9] bg-[bg-[#FFFDF9]] p-3 space-y-1">
            <span className="text-[10px] text-[#888888] uppercase block">Durasi</span>
            <span className="text-sm font-bold text-[#2C2C2C]">35 Menit</span>
          </div>
          <div className="border-2 border-[#E0DED9] bg-[bg-[#FFFDF9]] p-3 space-y-1">
            <span className="text-[10px] text-[#888888] uppercase block">Kelulusan</span>
            <span className="text-sm font-bold text-emerald-400">120 / 200</span>
          </div>
        </div>

        <button
          onClick={handleStartExam}
          className="bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-mono-code font-bold px-8 py-3 text-xs uppercase tracking-wider transition inline-flex items-center gap-2"
        >
          <Award className="w-4 h-4 text-amber-700" />
          <span>Mulai Ujian Simulasi</span>
        </button>
      </div>
    );
  }

  const { correct, total, score } = calculateScore();

  return (
    <div className="border-2 border-[#E0DED9] bg-[bg-white] p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Top Header with Timer */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E0DED9] pb-4">
        <div>
          <span className="font-mono-code text-[10px] uppercase tracking-widest bg-white/5 border-2 border-[#E0DED9] text-[#444444] px-2 py-0.5">
            HSK 一级 模拟试卷
          </span>
          <h3 className="font-mono-code text-sm uppercase tracking-wider text-[#2C2C2C] mt-1">
            Soal No. {currentIdx + 1} dari {total}
          </h3>
        </div>

        {!isSubmitted && (
          <div className="flex items-center gap-2 border border-red-500/30 bg-red-950/20 px-3 py-1 text-red-400 font-mono-code text-xs">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Sisa Waktu: {formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Question Card */}
      {!isSubmitted ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[10px] uppercase tracking-wider bg-white/5 border-2 border-[#E0DED9] text-[#444444] px-2.5 py-1">
              {currentQ.section === 'listening' ? '🎧 听力 (Listening)' : '📖 阅读 (Reading)'}
            </span>

            {currentQ.section === 'listening' && (
              <button
                onClick={handlePlayAudio}
                className="border-2 border-[#E0DED9] hover:border-zinc-400 bg-[bg-[#F8F7F4]] text-[#2C2C2C] font-mono-code text-xs uppercase px-3 py-1 transition flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Audio Soal 🔊</span>
              </button>
            )}
          </div>

          <p className="font-mono-code text-sm text-zinc-100 font-bold leading-relaxed">
            {currentQ.question}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = answers[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelect(optIdx)}
                  className={`p-3.5 border text-xs text-left transition font-mono-code flex items-center justify-between ${
                    isSelected
                      ? 'border-red-500 bg-red-950/30 text-[#2C2C2C] font-bold'
                      : 'border-[#E0DED9] bg-[bg-[#FFFDF9]] text-[#444444] hover:border-zinc-500 hover:text-[#2C2C2C]'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="w-4 h-4 text-red-400" />}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-[#E0DED9] font-mono-code text-xs uppercase">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 border-2 border-[#E0DED9] hover:border-zinc-500 bg-[bg-[#F8F7F4]] text-[#444444] disabled:opacity-30 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {currentIdx < total - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="px-5 py-2 bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-bold flex items-center gap-1.5 transition"
              >
                <span>Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-[#2C2C2C] font-bold flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kumpulkan Jawaban</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results Card */
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 border-2 border-[#E0DED9] bg-[bg-[#F8F7F4]] flex items-center justify-center text-3xl mx-auto">
            {score >= 120 ? '🎉' : '📚'}
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-sans text-[#2C2C2C]">
              {score >= 120 ? 'Selamat! Anda Lulus Ujian HSK 1' : 'Hasil Ujian Belum Memenuhi Kelulusan'}
            </h3>
            <p className="text-xs text-[#666666] font-sans">
              Batas kelulusan resmi HSK 1 adalah 120 poin dari total 200 poin.
            </p>
          </div>

          <div className="border-2 border-[#E0DED9] bg-[bg-[#FFFDF9]] p-5 max-w-sm mx-auto space-y-3 font-mono-code text-xs">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#666666]">Skor Akhir:</span>
              <span className="text-2xl font-bold text-amber-700">{score} / 200</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Jawaban Benar:</span>
              <span className="font-bold text-[#2C2C2C]">{correct} dari {total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Status:</span>
              <span className={`uppercase px-2 py-0.5 font-bold border ${
                score >= 120 ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' : 'border-red-500/40 bg-red-950/20 text-red-300'
              }`}>
                {score >= 120 ? 'LULUS (合格)' : 'REMEDIAL'}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 font-mono-code text-xs uppercase">
            <button
              onClick={handleStartExam}
              className="bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-bold px-5 py-2.5 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ulangi Ujian</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
