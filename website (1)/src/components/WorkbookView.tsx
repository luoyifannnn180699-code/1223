import React, { useState, useMemo } from 'react';
import { 
  Headphones, 
  BookOpen, 
  Volume2, 
  CheckCircle2, 
  HelpCircle, 
  Award, 
  Sparkles, 
  PenTool, 
  RefreshCw, 
  Layers, 
  Filter, 
  SendHorizontal 
} from 'lucide-react';
import { ALL_HSK_WORKBOOK_CHAPTERS, HSKWorkbookChapter, HSKWorkbookQuestion } from '../data/hskWorkbookAll';
import { speechEngine } from '../services/speech';
import { soundEffects } from '../services/soundEffects';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface WorkbookViewProps {
  currentChapterId: number;
  onSelectChapter: (chapterId: number) => void;
  currentUser: UserProfile | null;
  audioSpeed: number;
  onGoToTianzi: (char: string) => void;
}

export const WorkbookView: React.FC<WorkbookViewProps> = ({
  currentChapterId,
  onSelectChapter,
  currentUser,
  audioSpeed,
  onGoToTianzi
}) => {
  const baseExercise: HSKWorkbookChapter = useMemo(() => {
    return (
      ALL_HSK_WORKBOOK_CHAPTERS.find((w) => w.chapterId === currentChapterId) ||
      ALL_HSK_WORKBOOK_CHAPTERS[0]
    );
  }, [currentChapterId]);

  const teacherCustomQuestions = useMemo(() => {
    return dbService.getTeacherCustomQuestions(baseExercise.chapterId);
  }, [baseExercise.chapterId]);

  const allQuestions: HSKWorkbookQuestion[] = useMemo(() => {
    return [...baseExercise.questions, ...teacherCustomQuestions];
  }, [baseExercise, teacherCustomQuestions]);

  const isCompleted = dbService.isWorkbookCompleted(baseExercise.chapterId);

  const [activeSection, setActiveSection] = useState<'all' | 'listening' | 'reading' | 'hanzi'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'dasar' | 'menengah' | 'mahir'>('all');

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [answeredState, setAnsweredState] = useState<Record<number, boolean>>({});
  const [isResultSentToTeacher, setIsResultSentToTeacher] = useState<boolean>(false);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const matchSection = activeSection === 'all' || q.type === activeSection;
      const matchDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
      return matchSection && matchDiff;
    });
  }, [allQuestions, activeSection, difficultyFilter]);

  const handleSelectAnswer = (q: HSKWorkbookQuestion, optionIdx: number) => {
    if (answeredState[q.id]) return;

    setSelectedAnswers((prev) => ({ ...prev, [q.id]: optionIdx }));
    setAnsweredState((prev) => ({ ...prev, [q.id]: true }));

    const isCorrect = optionIdx === q.answer;
    if (isCorrect) {
      soundEffects.playSuccess();
      dbService.addStars(5);
    } else {
      soundEffects.playError();
    }
  };

  const handlePlayAudio = (text: string) => {
    speechEngine.speak(text, audioSpeed);
    dbService.logActivity('PLAY_AUDIO', `Memutar audio soal Workbook Bab ${baseExercise.chapterId}`);
  };

  const handleSendToTeacher = () => {
    let correctCount = 0;
    const summary: Array<{ questionId: number; question: string; selected: string; correct: string; isCorrect: boolean }> = [];

    allQuestions.forEach((q) => {
      const userChoice = selectedAnswers[q.id];
      const isRight = userChoice === q.answer;
      if (isRight) correctCount++;
      summary.push({
        questionId: q.id,
        question: q.question,
        selected: userChoice !== undefined ? q.options[userChoice] : '(Tidak dijawab)',
        correct: q.options[q.answer] || '',
        isCorrect: isRight
      });
    });

    const scorePercent = Math.round((correctCount / (allQuestions.length || 1)) * 100);

    dbService.saveStudentWorkbookResult({
      studentId: currentUser?.id || 'guest',
      studentName: currentUser?.name || 'Siswa Mandarin',
      studentClass: currentUser?.kelas || 'GCC/RCC',
      chapterId: baseExercise.chapterId,
      scorePercent,
      totalQuestions: allQuestions.length,
      correctAnswers: correctCount,
      answersSummary: summary
    });

    dbService.markWorkbookComplete(baseExercise.chapterId);
    dbService.addStars(20);
    setIsResultSentToTeacher(true);
    soundEffects.playSuccess();
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setAnsweredState({});
    setIsResultSentToTeacher(false);
  };

  const answeredTotal = Object.keys(answeredState).length;
  const correctTotal = Object.keys(answeredState).filter(
    (qId) => selectedAnswers[Number(qId)] === allQuestions.find((q) => q.id === Number(qId))?.answer
  ).length;

  return (
    <div className="space-y-6">
      {/* Chapter Title & Level Banner - Variation 1 Warm Card */}
      <div className="border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-[20px] p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-gaegu text-base font-bold bg-[#FFB703]/30 text-amber-900 px-3 py-0.5 rounded-full">
                Workbook 1 · 15 Bab
              </span>
              <span className="font-mono-code text-xs text-[#888888]">
                {allQuestions.length} Soal Latihan
              </span>
              {isCompleted && (
                <span className="font-gaegu text-base font-bold text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Selesai
                </span>
              )}
            </div>
            <h2 className="font-gaegu text-3xl md:text-5xl text-[#2C2C2C] font-bold leading-none mt-2">
              {baseExercise.title}
            </h2>
            <p className="text-xs md:text-sm text-[#666666] font-sans mt-1 max-w-xl leading-relaxed">
              {baseExercise.levelDesc}
            </p>
          </div>

          {/* Chapter Selector Dropdown */}
          <div className="flex items-center gap-2 border-2 border-[#E0DED9] bg-white rounded-xl p-2">
            <span className="meta-tag pl-1">PILIH BAB:</span>
            <select
              value={baseExercise.chapterId}
              onChange={(e) => {
                onSelectChapter(Number(e.target.value));
                handleReset();
              }}
              className="bg-white text-[#2C2C2C] font-bold text-xs px-2 py-1 outline-none cursor-pointer"
            >
              {ALL_HSK_WORKBOOK_CHAPTERS.map((w) => (
                <option key={w.chapterId} value={w.chapterId}>
                  Bab {w.chapterId}: {w.title.split(':')[1] || w.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Score Bar */}
        <div className="pt-3 border-t-2 border-[#E0DED9] flex flex-wrap justify-between items-center text-xs gap-3 text-[#666666]">
          <div className="flex items-center gap-3">
            <span>
              Terjawab: <strong className="text-[#2C2C2C]">{answeredTotal}</strong> / {allQuestions.length}
            </span>
            <span>·</span>
            <span>
              Benar: <strong className="text-emerald-700">{correctTotal}</strong>
            </span>
            {currentUser && (
              <>
                <span>·</span>
                <span className="text-[#555555]">
                  Siswa: {currentUser.name} ({currentUser.kelas || 'GCC/RCC'})
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleSendToTeacher}
            disabled={answeredTotal === 0}
            className="btn-gaegu disabled:opacity-40 px-4 py-1.5 text-base flex items-center gap-1.5 shadow-xs"
          >
            <SendHorizontal className="w-4 h-4" />
            <span>Kirim Nilai ke Guru</span>
          </button>
        </div>
      </div>

      {/* Filter and Section Selector */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-2 border-[#E0DED9] bg-white rounded-[16px] p-3 text-xs">
        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: `Semua (${allQuestions.length})`, icon: Layers },
            { id: 'listening', label: 'Mendengar (听力)', icon: Headphones },
            { id: 'reading', label: 'Membaca (阅读)', icon: BookOpen },
            { id: 'hanzi', label: 'Goresan Hanzi', icon: PenTool }
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as typeof activeSection)}
                className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold border-2 ${
                  isActive
                    ? 'border-[#FFB703] bg-[#FFB703] text-[#2C2C2C]'
                    : 'border-[#E0DED9] text-[#666666] hover:bg-[#F8F7F4]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#888888]" />
          <span className="meta-tag">TINGKAT:</span>
          {(['all', 'dasar', 'menengah', 'mahir'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-2.5 py-0.5 rounded-full uppercase text-[11px] font-bold border-2 ${
                difficultyFilter === diff
                  ? 'border-[#FFB703] bg-[#FFB703]/30 text-amber-900'
                  : 'border-[#E0DED9] text-[#777777] bg-white hover:bg-[#F8F7F4]'
              }`}
            >
              {diff === 'all' ? 'Semua' : diff}
            </button>
          ))}
        </div>
      </div>

      {isResultSentToTeacher && (
        <div className="p-4 border-2 border-emerald-400 bg-emerald-50 rounded-[16px] text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Hasil latihanmu telah berhasil dikirim ke <strong>Portal Guru</strong> kelas <strong>{currentUser?.kelas}</strong>!
            </span>
          </div>
          <span className="font-gaegu text-base font-bold bg-emerald-200 text-emerald-900 px-3 py-0.5 rounded-full">
            Terkirim ✓
          </span>
        </div>
      )}

      {/* QUESTIONS LIST */}
      {activeSection !== 'hanzi' ? (
        <div className="space-y-4">
          {filteredQuestions.map((item, idx) => {
            const isAnswered = answeredState[item.id];
            const userChoice = selectedAnswers[item.id];
            const isCorrect = userChoice === item.answer;

            return (
              <div
                key={item.id}
                className="border-2 border-[#E0DED9] bg-white rounded-[16px] p-5 space-y-4 hover:border-[#FFB703] transition shadow-xs"
              >
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-gaegu text-lg font-bold bg-[#FFB703]/25 text-amber-900 px-3 py-0.5 rounded-full">
                      Soal #{idx + 1} · {item.type.toUpperCase()}
                    </span>
                    <span className="meta-tag">
                      {item.difficulty}
                    </span>
                  </div>

                  {item.audioPrompt && (
                    <button
                      onClick={() => handlePlayAudio(item.audioPrompt!)}
                      className="border-2 border-[#E0DED9] hover:border-[#FFB703] bg-[#FFFDF9] text-[#2C2C2C] px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Putar Audio 🔊</span>
                    </button>
                  )}
                </div>

                <p className="font-gaegu text-2xl text-[#2C2C2C] font-bold leading-relaxed">
                  {item.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {item.options.map((opt, optIdx) => {
                    let btnStyle = "border-2 border-[#E0DED9] bg-white text-[#2C2C2C] hover:border-[#FFB703]";
                    if (isAnswered) {
                      if (optIdx === item.answer) {
                        btnStyle = "border-2 border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                      } else if (optIdx === userChoice) {
                        btnStyle = "border-2 border-red-400 bg-red-50 text-red-900 font-bold";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isAnswered}
                        onClick={() => handleSelectAnswer(item, optIdx)}
                        className={`p-3 rounded-xl border text-xs text-left transition ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold font-gaegu text-lg">
                      {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <HelpCircle className="w-4 h-4 text-red-500" />}
                      <span>{isCorrect ? 'Benar sekali! (+5 ⭐)' : 'Jawaban belum tepat.'}</span>
                    </div>
                    {item.explanation && (
                      <p className="text-[11px] text-[#555555]">
                        Pembahasan: {item.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* HANZI PRACTICE */
        <div className="border-2 border-[#E0DED9] bg-white rounded-[20px] p-6 space-y-4">
          <div>
            <h3 className="font-gaegu text-2xl font-bold text-[#2C2C2C] flex items-center gap-2">
              <PenTool className="w-5 h-5 text-amber-600" />
              Target Goresan Hanzi Workbook Bab {baseExercise.chapterId}
            </h3>
            <p className="text-xs text-[#666666] font-sans mt-0.5">
              Klik salah satu karakter di bawah untuk langsung berlatih menulisnya di kanvas Tianzi Ge!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {baseExercise.hanziPractice.map((char) => (
              <div
                key={char}
                onClick={() => onGoToTianzi(char)}
                className="card-tianzi p-4 text-center cursor-pointer transition hover:scale-105 group"
              >
                <div className="text-4xl font-hanzi font-semibold text-[#2C2C2C] group-hover:text-amber-600 transition">
                  {char}
                </div>
                <div className="mt-2 meta-tag text-[9px] bg-white border border-[#E0DED9] px-2 py-0.5 rounded-full inline-block">
                  Latihan ✍️
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="border-2 border-[#E0DED9] bg-white rounded-[16px] p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span className="text-xs text-[#666666]">
            Kumpulkan hasil latihanmu ke Guru kelas ({currentUser?.kelas || 'GCC/RCC'}).
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-1.5 border-2 border-[#E0DED9] hover:border-[#FFB703] rounded-full text-xs font-bold text-[#444444] flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ulangi</span>
          </button>

          <button
            onClick={handleSendToTeacher}
            disabled={answeredTotal === 0}
            className="btn-gaegu disabled:opacity-40 px-5 py-2 text-lg flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Kirim &amp; Selesaikan (+20 ⭐)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
