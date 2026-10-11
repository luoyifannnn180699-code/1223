import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  PenTool, 
  Compass, 
  Share2, 
  Copy, 
  Check, 
  Layers,
  Search,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { SidebarNav } from './components/SidebarNav';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { TianziCanvas } from './components/TianziCanvas';
import { AudioRecorder } from './components/AudioRecorder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { WorkbookView } from './components/WorkbookView';
import { ModelTestModal } from './components/ModelTestModal';
import { TeacherPortal } from './components/TeacherPortal';
import { AITutorView } from './components/AITutorView';
import { HSK_LESSONS } from './data/hskLessons';
import { HSK1_COMPLETE_GRAMMAR, GRAMMAR_CATEGORIES } from './data/hskGrammarComplete';
import { speechEngine } from './services/speech';
import { soundEffects } from './services/soundEffects';
import { dbService } from './services/db';
import { UserProfile } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('lessons');
  const [currentChapterIdx, setCurrentChapterIdx] = useState<number>(0);
  const [lessonSubTab, setLessonSubTab] = useState<'dialogue' | 'vocab' | 'grammar' | 'phonetics' | 'quiz'>('dialogue');
  const [audioSpeed, setAudioSpeed] = useState<number>(0.7);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(dbService.getCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [hasCopiedShare, setHasCopiedShare] = useState(false);

  // Tianzi canvas target char
  const [tianziTarget, setTianziTarget] = useState<string>('你');

  // Grammar filter & mode states
  const [grammarViewMode, setGrammarViewMode] = useState<'chapter' | 'all'>('chapter');
  const [grammarSearch, setGrammarSearch] = useState<string>('');
  const [grammarCategory, setGrammarCategory] = useState<string>('Semua Kategori');
  const [showTraditional, setShowTraditional] = useState<boolean>(true);

  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizChecked, setQuizChecked] = useState<Record<number, boolean>>({});

  const currentLesson = HSK_LESSONS[currentChapterIdx] || HSK_LESSONS[0];

  useEffect(() => {
    setQuizAnswers({});
    setQuizChecked({});
  }, [currentChapterIdx]);

  const handleSelectChapter = (idx: number) => {
    setCurrentChapterIdx(idx);
    dbService.logActivity('COMPLETE_LESSON', `Membuka Bab ${idx + 1}: ${HSK_LESSONS[idx].title}`, idx + 1);
  };

  const handlePlayDialogue = (fullText: string) => {
    speechEngine.speak(fullText, audioSpeed);
    dbService.logActivity('PLAY_AUDIO', `Memutar dialog Bab ${currentLesson.id}`);
  };

  const handleQuizAnswer = (qIdx: number, optIdx: number, correctIdx: number) => {
    if (quizChecked[qIdx]) return;
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    setQuizChecked((prev) => ({ ...prev, [qIdx]: true }));

    if (optIdx === correctIdx) {
      soundEffects.playSuccess();
      dbService.addStars(10);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {
        // ignore
      }
    } else {
      soundEffects.playError();
    }
  };

  const handleGoToTianzi = (char: string) => {
    setTianziTarget(char);
    setActiveTab('canvas');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setHasCopiedShare(true);
    setTimeout(() => setHasCopiedShare(false), 2500);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col p-3 md:p-4 gap-3 bg-[#F8F7F4] text-[#2C2C2C] font-sans selection:bg-[#FFB703] selection:text-[#2C2C2C]">
      {/* Variation 1 Header (nav-card) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={() => {
          dbService.logout();
          setCurrentUser(null);
        }}
        audioSpeed={audioSpeed}
        setAudioSpeed={setAudioSpeed}
        currentChapterId={currentLesson.id}
        currentChapterTitle={`${currentLesson.title} ${currentLesson.pinyinTitle}`}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden gap-3 min-h-0">
        {/* Variation 1 Left Sidebar Panel */}
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Center / Main Content Panel */}
        <section className="flex-1 panel flex flex-col lg:grid lg:grid-cols-[1fr_320px] overflow-hidden min-h-0 bg-white border-2 border-[#E0DED9] rounded-[20px] shadow-sm">
          {/* Main Scrollable View */}
          <div className="overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6 min-w-0">
            {/* Mobile Tab Quick Selector */}
            <div className="md:hidden flex items-center overflow-x-auto pb-2 gap-2 custom-scrollbar shrink-0 font-gaegu text-lg">
              {[
                { id: 'lessons', label: '📖 Buku Ajar' },
                { id: 'workbook', label: '✍️ Workbook' },
                { id: 'exam', label: '🎓 Ujian' },
                { id: 'canvas', label: '📝 Tianzi Ge' },
                { id: 'recorder', label: '🎧 Audio' },
                { id: 'ai-tutor', label: '🤖 Tutor AI' },
                { id: 'analytics', label: '📊 Analisis' },
                { id: 'teacher', label: '👨‍🏫 Guru' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition border-2 ${
                    activeTab === t.id
                      ? 'border-[#FFB703] bg-[#FFB703] text-[#2C2C2C] font-bold shadow-xs'
                      : 'border-[#E0DED9] bg-white text-[#666666]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: BUKU AJAR STANDARD COURSE (15 BAB) */}
            {activeTab === 'lessons' && (
              <div className="space-y-6 max-w-4xl">
                {/* Lesson Header Banner */}
                <div className="border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-[18px] p-6 space-y-2 relative overflow-hidden">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="meta-tag">MODUL BUKU AJAR · STANDARD COURSE HSK 1</div>
                      <h2 className="font-gaegu text-4xl md:text-5xl font-bold text-[#2C2C2C] leading-none mt-1">
                        Bab {currentLesson.id}: {currentLesson.title}
                      </h2>
                      <div className="font-bold text-amber-600 text-lg font-mono-code mt-1">
                        {currentLesson.pinyinTitle}
                      </div>
                      <p className="text-xs md:text-sm text-[#666666] mt-1">
                        "{currentLesson.translation}" — Pelajari percakapan seru, kosakata baru, dan tata bahasa praktis.
                      </p>
                    </div>
                    <span className="text-4xl hidden sm:inline select-none">🏮</span>
                  </div>
                </div>

                {/* Subtabs Navigation */}
                <div className="flex border-b-2 border-[#E0DED9] gap-1 overflow-x-auto pb-0 custom-scrollbar">
                  {[
                    { id: 'dialogue', label: 'Dialog (课文)', icon: BookOpen },
                    { id: 'vocab', label: 'Kosakata (生词)', icon: Layers },
                    { id: 'grammar', label: 'Tata Bahasa (语法)', icon: Compass },
                    { id: 'phonetics', label: 'Pelafalan (拼音)', icon: Volume2 },
                    { id: 'quiz', label: 'Kuis Bab (测试)', icon: HelpCircle }
                  ].map((tab) => {
                    const isActive = lessonSubTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setLessonSubTab(tab.id as typeof lessonSubTab)}
                        className={`px-4 py-2 font-gaegu text-xl rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 border-2 border-b-0 ${
                          isActive
                            ? 'bg-[#FFB703] text-[#2C2C2C] font-bold border-[#E0DED9] shadow-xs'
                            : 'border-transparent text-[#666666] hover:text-[#2C2C2C] hover:bg-[#F8F7F4]'
                        }`}
                      >
                        <Icon className="w-4 h-4 stroke-[2.5]" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SUBTAB 1: DIALOGUE (课文) */}
                {lessonSubTab === 'dialogue' && (
                  <div className="space-y-6">
                    {currentLesson.dialogues.map((dlg, dIdx) => {
                      const fullDialogueText = dlg.map((l) => l.hanzi).join(' ');
                      return (
                        <div
                          key={dIdx}
                          className="bg-white border-2 border-[#E0DED9] rounded-[18px] overflow-hidden shadow-xs"
                        >
                          {/* Dialog Header */}
                          <div className="px-5 py-3 border-b-2 border-[#E0DED9] flex justify-between items-center bg-[#FFFDF9]">
                            <div className="meta-tag">
                              DIALOG #{dIdx + 1} · {dlg[0]?.translation.split(' ')[0] || 'Percakapan'}
                            </div>
                            <button
                              onClick={() => handlePlayDialogue(fullDialogueText)}
                              className="btn-gaegu px-3.5 py-1 text-base flex items-center gap-1.5 shadow-xs"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Putar Lengkap</span>
                            </button>
                          </div>

                          {/* Dialog Rows */}
                          <div className="divide-y divide-[#F0EFEA]">
                            {dlg.map((line, lIdx) => (
                              <div
                                key={lIdx}
                                className="p-4 sm:p-5 grid grid-cols-[38px_1fr_40px] gap-3 items-center hover:bg-[#FFFDF9] transition"
                              >
                                <div className="font-gaegu text-xl font-bold text-amber-800 bg-[#FFB703]/30 rounded-full w-9 h-9 flex items-center justify-center shrink-0">
                                  {line.speaker}
                                </div>
                                <div>
                                  <div className="text-2xl md:text-3xl font-hanzi font-semibold text-[#2C2C2C] tracking-wide">
                                    {line.hanzi}
                                  </div>
                                  <div className="text-amber-700 font-bold text-xs md:text-sm font-mono-code mt-0.5">
                                    {line.pinyin}
                                  </div>
                                  <div className="text-[#666666] text-xs mt-0.5">
                                    {line.translation}
                                  </div>
                                </div>
                                <button
                                  onClick={() => speechEngine.speak(line.hanzi, audioSpeed)}
                                  className="w-9 h-9 border-2 border-[#E0DED9] hover:border-[#FFB703] bg-[#F8F7F4] hover:bg-[#FFB703]/20 rounded-full flex items-center justify-center transition text-sm shrink-0"
                                  title="Dengarkan Baris Ini"
                                >
                                  🔊
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SUBTAB 2: VOCABULARY (生词) */}
                {lessonSubTab === 'vocab' && (
                  <div className="border-2 border-[#E0DED9] bg-white rounded-[18px] p-6 space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-[#E0DED9] pb-3">
                      <div className="meta-tag">
                        DAFTAR KOSAKATA · BAB {currentLesson.id}
                      </div>
                      <span className="font-gaegu text-lg font-bold text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full">
                        {currentLesson.vocab.length} KATA
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {currentLesson.vocab.map((v, i) => (
                        <div
                          key={i}
                          className="border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-[14px] p-4 text-center hover:border-[#FFB703] transition flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="text-3xl font-hanzi font-semibold text-[#2C2C2C] my-1">
                              {v.hanzi}
                            </div>
                            <div className="text-amber-700 font-mono-code text-xs font-bold">{v.pinyin}</div>
                            <div className="meta-tag text-[9px] mt-0.5">{v.pos}</div>
                            <div className="text-[#555555] text-xs mt-1">{v.translation}</div>
                          </div>

                          <div className="pt-2 flex gap-1.5 justify-center font-mono-code text-[11px]">
                            <button
                              onClick={() => speechEngine.speak(v.hanzi, audioSpeed)}
                              className="border-2 border-[#E0DED9] hover:border-[#FFB703] bg-white px-2 py-1 rounded-md text-[#2C2C2C] transition"
                            >
                              🔊
                            </button>
                            <button
                              onClick={() => handleGoToTianzi(v.hanzi[0])}
                              className="btn-gaegu px-2.5 py-1 text-sm transition"
                            >
                              ✍️ Tulis
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: GRAMMAR (语法) */}
                {lessonSubTab === 'grammar' && (() => {
                  const displayedGrammar = (grammarViewMode === 'chapter' ? currentLesson.grammar : HSK1_COMPLETE_GRAMMAR).filter((g) => {
                    const matchCategory = grammarViewMode === 'chapter' || grammarCategory === 'Semua Kategori' || g.category === grammarCategory;
                    const q = grammarSearch.trim().toLowerCase();
                    if (!q) return matchCategory;
                    const inRule = g.rule.toLowerCase().includes(q);
                    const inDesc = g.desc.toLowerCase().includes(q);
                    const inFormula = (g.formula || '').toLowerCase().includes(q);
                    const inNotes = (g.notes || []).some((n) => n.toLowerCase().includes(q));
                    const inExamples = (g.examples || []).some(
                      (ex) =>
                        ex.hanzi.toLowerCase().includes(q) ||
                        ex.pinyin.toLowerCase().includes(q) ||
                        ex.translation.toLowerCase().includes(q)
                    );
                    return matchCategory && (inRule || inDesc || inFormula || inNotes || inExamples);
                  });

                  return (
                    <div className="border-2 border-[#E0DED9] bg-white rounded-[18px] p-6 space-y-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b-2 border-[#E0DED9] pb-4">
                        <div>
                          <div className="meta-tag">PANDUAN TATA BAHASA MANDARIN</div>
                          <h3 className="font-gaegu text-2xl font-bold text-[#2C2C2C] mt-1">
                            {grammarViewMode === 'chapter'
                              ? `Bab ${currentLesson.id}: ${currentLesson.title} (${currentLesson.grammar.length} Aturan)`
                              : `Kumpulan Lengkap Tata Bahasa (${HSK1_COMPLETE_GRAMMAR.length} Materi)`}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <button
                            onClick={() => setGrammarViewMode('chapter')}
                            className={`px-3 py-1.5 rounded-full font-bold transition border-2 ${
                              grammarViewMode === 'chapter'
                                ? 'border-[#FFB703] bg-[#FFB703] text-[#2C2C2C]'
                                : 'border-[#E0DED9] bg-white text-[#666666]'
                            }`}
                          >
                            Bab {currentLesson.id}
                          </button>
                          <button
                            onClick={() => setGrammarViewMode('all')}
                            className={`px-3 py-1.5 rounded-full font-bold transition border-2 ${
                              grammarViewMode === 'all'
                                ? 'border-[#FFB703] bg-[#FFB703] text-[#2C2C2C]'
                                : 'border-[#E0DED9] bg-white text-[#666666]'
                            }`}
                          >
                            Semua ({HSK1_COMPLETE_GRAMMAR.length})
                          </button>
                          <button
                            onClick={() => setShowTraditional((prev) => !prev)}
                            className={`px-3 py-1.5 rounded-full font-bold transition border-2 ${
                              showTraditional
                                ? 'border-[#FFB703] bg-[#FFFDF9] text-amber-800'
                                : 'border-[#E0DED9] text-[#888888]'
                            }`}
                          >
                            {showTraditional ? '✓ Tradisional' : 'Tradisional'}
                          </button>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-grow font-mono-code text-xs">
                          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={grammarSearch}
                            onChange={(e) => setGrammarSearch(e.target.value)}
                            placeholder="Cari pola tata bahasa (contoh: 是...的, 不 vs 没, 一点儿)..."
                            className="w-full bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-xl pl-9 pr-3 py-2 text-[#2C2C2C] placeholder-[#888888] focus:outline-none focus:border-[#FFB703]"
                          />
                        </div>

                        {grammarViewMode === 'all' && (
                          <div className="flex items-center gap-2 shrink-0 text-xs">
                            <Filter className="w-4 h-4 text-[#FFB703]" />
                            <select
                              value={grammarCategory}
                              onChange={(e) => setGrammarCategory(e.target.value)}
                              className="bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-xl text-[#2C2C2C] px-3 py-2 outline-none cursor-pointer focus:border-[#FFB703]"
                            >
                              {GRAMMAR_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Grammar Cards List */}
                      <div className="space-y-4">
                        {displayedGrammar.map((g, i) => (
                          <div
                            key={g.id || i}
                            className="border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-[16px] p-5 space-y-3 hover:border-[#FFB703] transition"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {g.chapterId && (
                                  <span className="bg-[#FFB703]/30 text-amber-900 font-bold px-2 py-0.5 rounded text-xs">
                                    Bab {g.chapterId}
                                  </span>
                                )}
                                {g.category && (
                                  <span className="meta-tag">
                                    {g.category}
                                  </span>
                                )}
                              </div>
                            </div>

                            <h4 className="font-gaegu text-2xl font-bold text-[#2C2C2C] flex items-center gap-2">
                              <span className="text-amber-500">✨</span>
                              <span>{g.rule}</span>
                            </h4>

                            {/* Formula */}
                            {g.formula && (
                              <div className="card-tianzi p-3 text-left">
                                <span className="meta-tag block mb-1">Rumus Pola Kalimat:</span>
                                <div className="text-amber-800 text-sm font-mono-code font-bold">
                                  {g.formula}
                                </div>
                              </div>
                            )}

                            <p className="text-xs sm:text-sm text-[#444444] leading-relaxed font-sans">
                              {g.desc}
                            </p>

                            {/* Notes */}
                            {g.notes && g.notes.length > 0 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                                <span className="meta-tag text-amber-800 font-bold">Catatan Penting:</span>
                                <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
                                  {g.notes.map((note, nIdx) => (
                                    <li key={nIdx}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Examples */}
                            {g.examples && g.examples.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <span className="meta-tag">Contoh Penggunaan:</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {g.examples.map((ex, exIdx) => (
                                    <div
                                      key={exIdx}
                                      className="border border-[#E0DED9] bg-white rounded-xl p-3 flex items-start justify-between gap-3 shadow-2xs"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="text-base font-hanzi font-semibold text-[#2C2C2C]">
                                          {ex.hanzi}
                                        </div>
                                        <div className="text-amber-700 font-mono-code text-xs font-bold">{ex.pinyin}</div>
                                        <div className="text-[#666666] text-xs">"{ex.translation}"</div>
                                      </div>
                                      <button
                                        onClick={() => speechEngine.speak(ex.hanzi, audioSpeed)}
                                        className="w-7 h-7 border border-[#E0DED9] hover:border-[#FFB703] rounded-full flex items-center justify-center transition text-xs shrink-0"
                                      >
                                        🔊
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* SUBTAB 4: PHONETICS (拼音) */}
                {lessonSubTab === 'phonetics' && (
                  <div className="border-2 border-[#E0DED9] bg-white rounded-[18px] p-6 space-y-6">
                    <div className="meta-tag">PANDUAN NADA &amp; PELAFALAN (PINYIN)</div>

                    <div className="space-y-2 font-mono-code text-xs">
                      {currentLesson.phoneticsInfo.map((p, i) => (
                        <div key={i} className="p-3 bg-[#FFFDF9] border border-[#E0DED9] rounded-xl text-[#444444] flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-[#FFB703] inline-block"></span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t-2 border-[#E0DED9]">
                      <div className="meta-tag mb-3">Latihan 4 Nada Mandarin (声调):</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { tone: 1, name: 'Nada 1 (ˉ) Datar', ex: 'mā (妈)' },
                          { tone: 2, name: 'Nada 2 (ˊ) Naik', ex: 'má (麻)' },
                          { tone: 3, name: 'Nada 3 (ˇ) Melengkung', ex: 'mǎ (马)' },
                          { tone: 4, name: 'Nada 4 (ˋ) Hentak Turun', ex: 'mà (骂)' }
                        ].map((t) => (
                          <button
                            key={t.tone}
                            onClick={() => soundEffects.playTonePitch(t.tone)}
                            className="p-3.5 bg-[#FFFDF9] hover:bg-[#FFB703]/20 border-2 border-[#E0DED9] hover:border-[#FFB703] rounded-xl text-left transition"
                          >
                            <div className="font-gaegu text-xl font-bold text-amber-800">{t.name}</div>
                            <div className="text-lg font-hanzi font-bold text-[#2C2C2C] mt-1">{t.ex}</div>
                            <div className="text-[10px] text-[#888888] font-mono-code mt-2">🔊 Dengar Nada</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 5: QUIZ (测试) */}
                {lessonSubTab === 'quiz' && (
                  <div className="border-2 border-[#E0DED9] bg-white rounded-[18px] p-6 space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-[#E0DED9] pb-3">
                      <div className="meta-tag">KUIS BAB {currentLesson.id}</div>
                      <span className="btn-gaegu px-3 py-1 text-sm">+10 BINTANG / JAWABAN BENAR</span>
                    </div>

                    <div className="space-y-4">
                      {currentLesson.quiz.map((q, qIdx) => {
                        const isChecked = quizChecked[qIdx];
                        const selected = quizAnswers[qIdx];
                        const isCorrect = selected === q.answer;

                        return (
                          <div key={qIdx} className="border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-xl p-4 space-y-3">
                            <p className="font-gaegu text-xl font-bold text-[#2C2C2C]">
                              {qIdx + 1}. {q.q}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, optIdx) => {
                                let btnStyle = "border-2 border-[#E0DED9] bg-white text-[#2C2C2C] hover:border-[#FFB703]";
                                if (isChecked) {
                                  if (optIdx === q.answer) {
                                    btnStyle = "border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                                  } else if (optIdx === selected) {
                                    btnStyle = "border-2 border-red-400 bg-red-50 text-red-700 font-bold";
                                  }
                                }
                                return (
                                  <button
                                    key={optIdx}
                                    disabled={isChecked}
                                    onClick={() => handleQuizAnswer(qIdx, optIdx, q.answer)}
                                    className={`p-3 rounded-xl text-left transition font-sans text-xs ${btnStyle}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {isChecked && (
                              <div className={`p-3 rounded-xl border text-xs ${
                                isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'
                              }`}>
                                {isCorrect ? 'Benar sekali! (+10 ⭐)' : 'Jawaban belum tepat. Jangan menyerah!'}{' '}
                                {q.explanation && <span className="block mt-0.5 text-[#666666] text-[11px]">{q.explanation}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: WORKBOOK 1 */}
            {activeTab === 'workbook' && (
              <WorkbookView
                currentChapterId={currentLesson.id}
                onSelectChapter={(id) => setCurrentChapterIdx(id - 1)}
                onGoToTianzi={handleGoToTianzi}
                currentUser={currentUser}
                audioSpeed={audioSpeed}
              />
            )}

            {/* TAB 3: SIMULASI UJIAN HSK 1 */}
            {activeTab === 'exam' && <ModelTestModal audioSpeed={audioSpeed} />}

            {/* TAB 4: TIANZI GE CANVAS */}
            {activeTab === 'canvas' && (
              <TianziCanvas
                currentChapterId={currentLesson.id}
                currentUser={currentUser}
                availableCharacters={[
                  tianziTarget,
                  ...currentLesson.vocab.map((v) => v.hanzi[0]),
                  ...currentLesson.charactersInfo.characters
                ]}
                audioSpeed={audioSpeed}
              />
            )}

            {/* TAB 5: AUDIO RECORDER */}
            {activeTab === 'recorder' && (
              <AudioRecorder
                currentChapterId={currentLesson.id}
                currentUser={currentUser}
                targetSentence={{
                  hanzi: currentLesson.dialogues[0]?.[0]?.hanzi || '你好！',
                  pinyin: currentLesson.dialogues[0]?.[0]?.pinyin || 'Nǐ hǎo!',
                  translation: currentLesson.dialogues[0]?.[0]?.translation || 'Halo!'
                }}
                audioSpeed={audioSpeed}
              />
            )}

            {/* TAB 6: TUTOR AI LIDIA */}
            {activeTab === 'ai-tutor' && <AITutorView audioSpeed={audioSpeed} />}

            {/* TAB 7: DASBOR ANALISIS DATA */}
            {activeTab === 'analytics' && <AnalyticsDashboard currentUser={currentUser} />}

            {/* TAB 8: PORTAL GURU */}
            {activeTab === 'teacher' && <TeacherPortal />}
          </div>

          {/* Right Sidebar Info Panel (Variation 1 Card Tianzi & Goals) */}
          <aside className="hidden lg:flex flex-col gap-6 p-6 border-l-2 border-[#E0DED9] overflow-y-auto custom-scrollbar bg-[#FFFDF9] select-none shrink-0">
            {/* Variation 1 Tianzi Welcome Card */}
            <div className="card-tianzi p-5 text-center space-y-3">
              <h2 className="font-gaegu text-3xl font-bold text-[#2C2C2C] m-0">Selamat Datang!</h2>
              <p className="text-xs text-[#666666] leading-relaxed">
                Siap untuk belajar menulis Hanzi hari ini? Lidia sudah menyiapkan latihan Tianzi Ge khusus untukmu.
              </p>
              <div className="text-4xl my-2">📝</div>
              <button 
                onClick={() => setActiveTab('canvas')}
                className="btn-gaegu w-full py-2 text-lg shadow-sm"
              >
                Mulai Tulis Hanzi
              </button>
            </div>

            {/* Tujuan Belajar (from Variation 1) */}
            <div className="space-y-1.5 border-t-2 border-[#E0DED9] pt-4">
              <h3 className="meta-tag">TUJUAN BELAJAR HARI INI</h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                Hari ini kita mempelajari materi Bab {currentLesson.id} ({currentLesson.title}), memahami kosakata baru, dan melatih pelafalan nada yang tepat.
              </p>
            </div>

            {/* Active Lesson Picker */}
            <div className="space-y-1.5 border-t-2 border-[#E0DED9] pt-4">
              <div className="meta-tag">PILIH BAB BUKU AJAR</div>
              <select
                value={currentChapterIdx}
                onChange={(e) => handleSelectChapter(Number(e.target.value))}
                className="w-full bg-white border-2 border-[#E0DED9] rounded-xl p-2.5 text-xs font-bold text-[#2C2C2C] focus:border-[#FFB703] outline-none cursor-pointer"
              >
                {HSK_LESSONS.map((l, i) => (
                  <option key={l.id} value={i}>
                    Bab {l.id}: {l.title} - {l.translation}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 border-t-2 border-[#E0DED9] pt-4">
              <div className="meta-tag">TANYA CEPAT LIDIA AI</div>
              <div className="flex flex-col gap-1.5">
                {[
                  '01. 的 vs 得 vs 地',
                  '02. Perbedaan 不 vs 没',
                  '03. Pola Kalimat 一...就...',
                  '04. 会 vs 能 vs 可以'
                ].map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setActiveTab('ai-tutor')}
                    className="p-2 bg-white hover:bg-[#FFB703]/20 border border-[#E0DED9] rounded-xl text-left text-xs font-sans text-[#444444] transition"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Share Link Button */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="mt-auto btn-gaegu w-full py-2 text-lg shadow-sm flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan Kelas</span>
            </button>
          </aside>
        </section>
      </div>

      {/* Variation 1 Footer */}
      <footer className="text-center font-mono-code text-[11px] text-[#888888] shrink-0">
        © 2026 PLATFORM BELAJAR MANDARIN ANAK SEKOLAH · HSK LEVEL 1 INTERAKTIF
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          soundEffects.playSuccess();
        }}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdate={() => setCurrentUser(dbService.getCurrentUser())}
      />

      {/* Share Modal in Variation 1 Friendly Card Style */}
      {isShareOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#E0DED9] rounded-[24px] max-w-md w-full p-6 text-center space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b-2 border-[#E0DED9] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐼</span>
                <h3 className="font-gaegu font-bold text-2xl text-[#2C2C2C]">Bagikan Kelas Mandarin</h3>
              </div>
              <button
                onClick={() => setIsShareOpen(false)}
                className="text-[#888888] hover:text-[#2C2C2C] p-1 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#666666]">
              Ajak teman sekelas belajar bersama! Dapat dibuka langsung di HP, Tablet, atau Laptop.
            </p>

            {/* QR Code */}
            <div className="bg-[#FFFDF9] p-3 inline-block mx-auto border-2 border-[#FFB703] rounded-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  window.location.origin
                )}`}
                alt="QR Code Belajar Mandarin"
                className="w-36 h-36 mx-auto rounded-lg"
              />
              <span className="meta-tag block mt-1.5 font-bold">
                PINDAI QR DI HP
              </span>
            </div>

            {/* Link Copy Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.origin}
                className="w-full bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-xl px-3 py-2 text-xs text-[#2C2C2C]"
              />
              <button
                onClick={handleCopyLink}
                className="btn-gaegu px-4 py-2 text-base transition shrink-0 flex items-center gap-1.5"
              >
                {hasCopiedShare ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopiedShare ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-gaegu text-lg">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Halo! Mari belajar Bahasa Mandarin HSK 1 seru dengan audio native dan AI Lidia di sini: ${window.location.origin}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 border-2 border-emerald-500 bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
              >
                <span>💬 WhatsApp</span>
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Belajar Mandarin HSK 1',
                      text: 'Aplikasi interaktif belajar Mandarin HSK 1 dan Workbook!',
                      url: window.location.origin
                    }).catch(() => {});
                  } else {
                    handleCopyLink();
                  }
                }}
                className="py-2 px-3 border-2 border-[#E0DED9] bg-[#F8F7F4] text-[#2C2C2C] rounded-xl hover:bg-[#E0DED9] transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
