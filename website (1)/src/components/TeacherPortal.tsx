import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  CheckSquare, 
  Star, 
  UserPlus, 
  X, 
  CheckCircle2,
  FileText,
  Upload,
  PlusCircle,
  School,
  Filter
} from 'lucide-react';
import { dbService } from '../services/db';
import { StudentSubmission, StudentWorkbookResult, WorkbookQuestionItem } from '../types';

export const TeacherPortal: React.FC = () => {
  const users = dbService.getAllUsers();
  const students = users.filter((u) => u.role === 'siswa');
  const submissions = dbService.getAllSubmissions();
  const workbookResults = dbService.getAllWorkbookResults();

  const [activeTab, setActiveTab] = useState<'submissions' | 'results' | 'roster'>('results');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Modal 1: Grade submission
  const [activeModalSub, setActiveModalSub] = useState<StudentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(90);
  const [gradeFeedback, setGradeFeedback] = useState<string>('Goresan dan pelafalan sangat rapi!');

  // Modal 2: Add single student
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentKelas, setNewStudentKelas] = useState('Kelas 7 (GCC)');

  // Modal 3: Bulk upload students
  const [isBulkStudentOpen, setIsBulkStudentOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState(
    `Budi Santoso, budi7gcc@siswa.edu, Kelas 7 (GCC)\nSiti Aminah, siti10@siswa.edu, Kelas 10\nMichael Tan, michael8@siswa.edu, Kelas 8`
  );
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  // Modal 4: Teacher upload question
  const [isUploadQuestionOpen, setIsUploadQuestionOpen] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<number>(3);
  const [qType, setQType] = useState<'listening' | 'reading' | 'grammar'>('reading');
  const [qDifficulty, setQDifficulty] = useState<'dasar' | 'menengah' | 'mahir'>('menengah');
  const [qText, setQText] = useState('');
  const [qAudioPrompt, setQAudioPrompt] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectAnswer, setQCorrectAnswer] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');

  // Class filtering
  const filteredStudents = students.filter((s) => {
    if (selectedClassFilter === 'all') return true;
    return s.kelas?.includes(selectedClassFilter);
  });

  const filteredResults = workbookResults.filter((r) => {
    if (selectedClassFilter === 'all') return true;
    return r.studentClass?.includes(selectedClassFilter);
  });

  const handleOpenGrade = (sub: StudentSubmission) => {
    setActiveModalSub(sub);
    setGradeScore(sub.score || 90);
    setGradeFeedback(sub.feedback || 'Bagus sekali, pertahankan!');
  };

  const handleSaveGrade = () => {
    if (!activeModalSub) return;
    dbService.gradeSubmission(activeModalSub.id, Number(gradeScore), gradeFeedback);
    setActiveModalSub(null);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;

    await dbService.registerUser(
      newStudentName.trim(),
      newStudentEmail.trim(),
      'SiswaHSK123!',
      'siswa',
      newStudentKelas
    );

    setIsAddStudentOpen(false);
    setNewStudentName('');
    setNewStudentEmail('');
  };

  const handleBulkUploadStudents = async () => {
    const lines = bulkInputText.split('\n').filter((l) => l.trim().length > 0);
    let count = 0;
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const email = parts[1];
        const kelas = parts[2] || 'Umum';
        await dbService.registerUser(name, email, 'SiswaHSK123!', 'siswa', kelas);
        count++;
      }
    }
    setBulkMessage(`Berhasil menambahkan ${count} siswa baru ke dalam sistem!`);
    setTimeout(() => {
      setBulkMessage(null);
      setIsBulkStudentOpen(false);
    }, 2000);
  };

  const handleSaveCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const newQuestion: WorkbookQuestionItem = {
      id: Date.now(),
      type: qType,
      difficulty: qDifficulty,
      audioPrompt: qAudioPrompt.trim() || undefined,
      question: qText.trim(),
      options: qOptions.filter((o) => o.trim().length > 0),
      answer: qCorrectAnswer,
      explanation: qExplanation.trim() || 'Soal tambahan oleh Guru.'
    };

    dbService.addCustomQuestion(targetChapterId, newQuestion);
    setIsUploadQuestionOpen(false);
    setQText('');
    setQAudioPrompt('');
    setQOptions(['', '', '', '']);
    setQExplanation('');
  };

  const handleExportReport = () => {
    let report = "========================================================\n";
    report += "   REKAPITULASI LAPORAN NILAI & HASIL LATIHAN HSK 1    \n";
    report += `   Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}\n`;
    report += "========================================================\n\n";

    report += "HASIL LATIHAN SISWA (WORKBOOK & KUIS TERHUBUNG):\n";
    workbookResults.forEach((r, idx) => {
      report += `${idx + 1}. [Bab ${r.chapterId}] Siswa: ${r.studentName} (${r.studentClass})\n`;
      report += `   Skor: ${r.scorePercent}% (${r.correctAnswers}/${r.totalQuestions} Benar)\n`;
      report += `   Waktu Selesai: ${new Date(r.submittedAt).toLocaleString('id-ID')}\n`;
      if (r.teacherComment) report += `   Komentar Guru: "${r.teacherComment}"\n`;
      report += "\n";
    });

    report += "--------------------------------------------------------\n";
    report += "DAFTAR SISWA MENURUT KELAS (GCC / RCC):\n";
    students.forEach((s, idx) => {
      report += `${idx + 1}. ${s.name} - Kelas: ${s.kelas || 'Umum'} (${s.email}) | Bintang: ${s.totalStars} ⭐\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Nilai_Kelas_GCC_RCC_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Portal Header Banner - Variation 5 Dark Technical Card */}
      <div className="border-2 border-[#E0DED9] bg-white p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-[10px] uppercase tracking-widest bg-white/5 border-2 border-[#E0DED9] text-[#444444] px-2 py-0.5">
                Portal Guru &amp; Pengajar
              </span>
              <span className="font-mono-code text-[10px] uppercase tracking-wider text-emerald-800 border border-emerald-300 bg-emerald-50 px-2 py-0.5">
                Koneksi Hasil Siswa Aktif
              </span>
            </div>
            <h2 className="font-sans text-2xl md:text-3xl text-[#2C2C2C] font-normal flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-amber-700" />
              Portal Guru: Hasil Latihan, Upload Soal &amp; Siswa
            </h2>
            <p className="text-xs text-[#666666] font-sans max-w-2xl">
              Pantau jawaban siswa secara langsung, kelompokkan berdasarkan kelas SMP/SMA GCC &amp; RCC, serta unggah soal dan daftar siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs uppercase">
            <button
              onClick={() => setIsUploadQuestionOpen(true)}
              className="bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-bold px-3 py-2 transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Soal</span>
            </button>

            <button
              onClick={() => setIsBulkStudentOpen(true)}
              className="border-2 border-[#E0DED9] hover:border-zinc-400 bg-[#F8F7F4] text-[#2C2C2C] px-3 py-2 transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Siswa</span>
            </button>

            <button
              onClick={handleExportReport}
              className="border-2 border-[#E0DED9] hover:border-zinc-400 bg-[#F8F7F4] text-[#2C2C2C] px-3 py-2 transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor Rekap</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation for Teacher Portal */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-[#E0DED9] font-mono-code text-xs uppercase">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 transition ${
                activeTab === 'results' ? 'bg-[#FFB703] text-[#2C2C2C] font-bold' : 'text-[#666666] hover:text-[#2C2C2C] bg-[#F8F7F4]'
              }`}
            >
              Hasil Siswa ({workbookResults.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-3 py-1.5 transition ${
                activeTab === 'submissions' ? 'bg-[#FFB703] text-[#2C2C2C] font-bold' : 'text-[#666666] hover:text-[#2C2C2C] bg-[#F8F7F4]'
              }`}
            >
              Tugas Hanzi &amp; Suara ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 transition ${
                activeTab === 'roster' ? 'bg-[#FFB703] text-[#2C2C2C] font-bold' : 'text-[#666666] hover:text-[#2C2C2C] bg-[#F8F7F4]'
              }`}
            >
              Daftar Siswa ({students.length})
            </button>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#888888]" />
            <span className="text-[#666666]">Kelas:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-white border-2 border-[#E0DED9] text-[#2C2C2C] px-2 py-1 outline-none cursor-pointer"
            >
              <option value="all">Semua Kelas</option>
              <optgroup label="Tingkat SMP">
                <option value="Kelas 7 (RCC)">Kelas 7 (RCC)</option>
                <option value="Kelas 7 (GCC)">Kelas 7 (GCC)</option>
                <option value="Kelas 8">Kelas 8</option>
                <option value="Kelas 9">Kelas 9</option>
              </optgroup>
              <optgroup label="Tingkat SMA">
                <option value="Kelas 10">Kelas 10</option>
                <option value="Kelas 11">Kelas 11</option>
                <option value="Kelas 12">Kelas 12</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: HASIL JAWABAN SISWA */}
      {activeTab === 'results' && (
        <div className="border-2 border-[#E0DED9] bg-white p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[#E0DED9] pb-3">
            <div>
              <h3 className="font-mono-code text-xs uppercase tracking-widest text-[#2C2C2C] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-800" />
                <span>Hasil Pengerjaan Latihan Siswa ({filteredResults.length})</span>
              </h3>
              <p className="text-xs text-[#666666] font-sans mt-0.5">
                Nilai dan jawaban siswa saat mengerjakan soal di tab Buku Latihan otomatis muncul di sini.
              </p>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-10 text-[#888888] font-mono-code text-xs">
              Belum ada hasil latihan siswa yang dikirimkan untuk filter kelas ini.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredResults.map((res) => (
                <div
                  key={res.id}
                  className="border-2 border-[#E0DED9] bg-[#FFFDF9] p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code font-bold text-sm text-[#2C2C2C]">
                          {res.studentName}
                        </span>
                        <span className="font-mono-code text-[10px] text-[#444444] border-2 border-[#E0DED9] bg-white/5 px-2 py-0.5 flex items-center gap-1">
                          <School className="w-3 h-3 text-red-400" />
                          {res.studentClass}
                        </span>
                        <span className="font-mono-code text-[10px] text-[#666666] border border-white/5 px-2 py-0.5">
                          Bab {res.chapterId}
                        </span>
                      </div>
                      <div className="font-mono-code text-[11px] text-[#888888] mt-0.5">
                        Waktu Kirim: {new Date(res.submittedAt).toLocaleTimeString('id-ID')}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-mono-code font-bold text-amber-700 block">
                        {res.scorePercent}%
                      </span>
                      <span className="font-mono-code text-[10px] text-[#666666]">
                        {res.correctAnswers} / {res.totalQuestions} Benar
                      </span>
                    </div>
                  </div>

                  {/* Summary of Questions */}
                  <div className="border-2 border-[#E0DED9] bg-white p-3 text-xs space-y-1 max-h-36 overflow-y-auto custom-scrollbar font-mono-code">
                    <span className="text-[10px] text-[#888888] uppercase block mb-1">
                      Sampel Jawaban Siswa:
                    </span>
                    {res.answersSummary.slice(0, 5).map((ans, aIdx) => (
                      <div key={aIdx} className="flex justify-between items-center text-[11px]">
                        <span className="truncate max-w-sm text-[#444444]">
                          {ans.question}
                        </span>
                        <span className={ans.isCorrect ? 'text-emerald-800' : 'text-red-400'}>
                          {ans.isCorrect ? '✓ Benar' : '✗ Salah'} ({ans.selected})
                        </span>
                      </div>
                    ))}
                    {res.answersSummary.length > 5 && (
                      <div className="text-[10px] text-[#888888] italic">
                        + {res.answersSummary.length - 5} soal lainnya
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TUGAS MASUK (HANZI & SUARA) */}
      {activeTab === 'submissions' && (
        <div className="border-2 border-[#E0DED9] bg-white p-6 space-y-4">
          <h3 className="font-mono-code text-xs uppercase tracking-widest text-[#2C2C2C] border-b border-[#E0DED9] pb-3">
            Antrean Tugas Tulisan Kotak Tianzi Ge &amp; Rekaman Suara Siswa ({submissions.length})
          </h3>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto custom-scrollbar">
            {submissions.length === 0 ? (
              <p className="text-xs font-mono-code text-[#888888] text-center py-8">Belum ada tugas masuk.</p>
            ) : (
              submissions.map((sub) => (
                <div key={sub.id} className="border-2 border-[#E0DED9] bg-[#FFFDF9] p-4 space-y-2 font-mono-code">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono-code text-[10px] uppercase tracking-wider bg-white/5 border-2 border-[#E0DED9] text-[#444444] px-2 py-0.5">
                        Bab {sub.chapterId}: {sub.type}
                      </span>
                      <h4 className="text-xs font-bold text-[#2C2C2C] mt-1">
                        Siswa: {sub.studentName} {sub.studentClass && `(${sub.studentClass})`} • Target: {sub.target}
                      </h4>
                    </div>
                    <span className={`text-[9px] uppercase px-2 py-0.5 font-bold border ${
                      sub.status === 'Sudah Dinilai' 
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-300' 
                        : 'border-amber-400/40 bg-amber-950/20 text-amber-300'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  {sub.type.includes('Hanzi') && sub.dataUrl && (
                    <div className="w-24 h-24 bg-white border-2 border-[#E0DED9] p-1">
                      <img src={sub.dataUrl} alt="Tulisan Siswa" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {sub.type.includes('Suara') && sub.dataUrl && (
                    <audio src={sub.dataUrl} controls className="w-full max-w-sm mt-1" />
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-[#E0DED9] text-xs">
                    <div>
                      <span className="text-[#666666]">
                        Nilai: <strong className="text-amber-700 text-sm">{sub.score ?? '-'}</strong>/100
                      </span>
                      {sub.feedback && (
                        <p className="text-[11px] text-[#666666] italic mt-0.5">
                          "{sub.feedback}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenGrade(sub)}
                      className="border-2 border-[#E0DED9] hover:border-zinc-400 bg-[#F8F7F4] text-[#2C2C2C] px-3 py-1.5 text-xs transition flex items-center gap-1 uppercase"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>{sub.status === 'Sudah Dinilai' ? 'Ubah Nilai' : 'Beri Nilai'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR SISWA (ROSTER) */}
      {activeTab === 'roster' && (
        <div className="border-2 border-[#E0DED9] bg-white p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[#E0DED9] pb-3">
            <h3 className="font-mono-code text-xs uppercase tracking-widest text-[#2C2C2C]">
              Roster Siswa ({filteredStudents.length} Siswa Terdaftar)
            </h3>
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-mono-code font-bold px-3 py-1.5 text-xs uppercase tracking-wider transition flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah 1 Siswa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono-code">
            {filteredStudents.map((st) => (
              <div key={st.id} className="p-3.5 border-2 border-[#E0DED9] bg-[#FFFDF9] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#2C2C2C] flex items-center gap-1.5">
                    <span>{st.avatar}</span>
                    {st.name}
                  </span>
                  <span className="text-[10px] text-amber-400">
                    {st.totalStars} ⭐
                  </span>
                </div>
                <div className="text-[11px] text-[#666666] flex items-center gap-1">
                  <School className="w-3 h-3 text-red-400" />
                  {st.kelas || 'Belum ada kelas'}
                </div>
                <div className="text-[10px] text-[#888888]">{st.email}</div>
                <div className="text-[10px] text-[#666666] flex justify-between pt-1 border-t border-[#E0DED9]">
                  <span>Bab: {st.completedLessons.length}/15</span>
                  <span>Workbook: {st.completedWorkbook.length}/15</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD SOAL GURU */}
      {isUploadQuestionOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveCustomQuestion} className="bg-white border-2 border-[#E0DED9] max-w-lg w-full p-6 space-y-3.5 my-6 font-mono-code text-xs text-[#2C2C2C]">
            <div className="flex justify-between items-center border-b border-[#E0DED9] pb-3">
              <h3 className="font-bold text-sm uppercase text-[#2C2C2C] flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-amber-700" />
                Upload / Tambah Soal Latihan Baru
              </h3>
              <button type="button" onClick={() => setIsUploadQuestionOpen(false)} className="text-[#888888] hover:text-[#2C2C2C]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Target Bab</label>
                <select
                  value={targetChapterId}
                  onChange={(e) => setTargetChapterId(Number(e.target.value))}
                  className="w-full bg-white border-2 border-[#E0DED9] p-2 text-xs"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((ch) => (
                    <option key={ch} value={ch} className="bg-white">
                      Bab {ch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Kategori</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as any)}
                  className="w-full bg-white border-2 border-[#E0DED9] p-2 text-xs"
                >
                  <option value="reading" className="bg-white">Membaca (阅读)</option>
                  <option value="listening" className="bg-white">Mendengar (听力)</option>
                  <option value="grammar" className="bg-white">Tata Bahasa (语法)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Tingkat</label>
                <select
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value as any)}
                  className="w-full bg-white border-2 border-[#E0DED9] p-2 text-xs uppercase"
                >
                  <option value="dasar" className="bg-white">Dasar</option>
                  <option value="menengah" className="bg-white">Menengah</option>
                  <option value="mahir" className="bg-white">Mahir</option>
                </select>
              </div>
            </div>

            {qType === 'listening' && (
              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Teks Suara Audio Soal</label>
                <input
                  type="text"
                  placeholder="Contoh: 你好！很高兴认识你！"
                  value={qAudioPrompt}
                  onChange={(e) => setQAudioPrompt(e.target.value)}
                  className="w-full bg-white border-2 border-[#E0DED9] p-2 text-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] text-[#666666] mb-1">Pertanyaan Soal</label>
              <textarea
                required
                rows={2}
                placeholder="Tuliskan pertanyaan soal latihan..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="w-full bg-white border-2 border-[#E0DED9] p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#666666] mb-1">Pilihan Jawaban</label>
              <div className="space-y-1.5">
                {qOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={qCorrectAnswer === oIdx}
                      onChange={() => setQCorrectAnswer(oIdx)}
                      title="Tandai sebagai kunci jawaban"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}...`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...qOptions];
                        copy[oIdx] = e.target.value;
                        setQOptions(copy);
                      }}
                      className="w-full bg-white border-2 border-[#E0DED9] px-2.5 py-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-[#888888] mt-1 block">
                *Pilih tombol radio di samping kiri opsi yang merupakan kunci jawaban yang benar.
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-[#666666] mb-1">Penjelasan / Pembahasan Soal</label>
              <input
                type="text"
                placeholder="Penjelasan ringkas materi ini..."
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                className="w-full bg-white border-2 border-[#E0DED9] p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 uppercase">
              <button
                type="button"
                onClick={() => setIsUploadQuestionOpen(false)}
                className="px-4 py-2 border-2 border-[#E0DED9] hover:border-zinc-500 bg-[#F8F7F4] text-[#444444]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-bold"
              >
                Simpan &amp; Terbitkan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: BULK UPLOAD SISWA */}
      {isBulkStudentOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#E0DED9] max-w-lg w-full p-6 space-y-4 font-mono-code text-xs text-[#2C2C2C]">
            <div className="flex justify-between items-center border-b border-[#E0DED9] pb-3">
              <h3 className="font-bold text-sm uppercase text-[#2C2C2C] flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-700" />
                Upload Daftar Nama Siswa Massal
              </h3>
              <button onClick={() => setIsBulkStudentOpen(false)} className="text-[#888888] hover:text-[#2C2C2C]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#666666]">
              Tempelkan daftar siswa dengan format <code>Nama, Email, Kelas</code> per baris:
            </p>

            <textarea
              rows={6}
              value={bulkInputText}
              onChange={(e) => setBulkInputText(e.target.value)}
              className="w-full bg-white border-2 border-[#E0DED9] p-3 text-xs focus:outline-none focus:border-zinc-400"
            />

            {bulkMessage && (
              <div className="p-2.5 border border-emerald-300 bg-emerald-50 text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                <span>{bulkMessage}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1 uppercase">
              <button
                onClick={() => setIsBulkStudentOpen(false)}
                className="px-4 py-2 border-2 border-[#E0DED9] hover:border-zinc-500 bg-[#F8F7F4] text-[#444444]"
              >
                Batal
              </button>
              <button
                onClick={handleBulkUploadStudents}
                className="px-5 py-2 bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-bold"
              >
                Proses Impor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE STUDENT ADD */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white border-2 border-[#E0DED9] max-w-md w-full p-6 space-y-4 font-mono-code text-xs text-[#2C2C2C]">
            <div className="flex justify-between items-center border-b border-[#E0DED9] pb-3">
              <h3 className="font-bold text-sm uppercase text-[#2C2C2C]">Tambah Siswa Baru</h3>
              <button type="button" onClick={() => setIsAddStudentOpen(false)} className="text-[#888888] hover:text-[#2C2C2C]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[#666666] mb-1">Nama Siswa</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahma"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full bg-white border-2 border-[#E0DED9] px-3 py-2 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[#666666] mb-1">Email Siswa</label>
                <input
                  type="email"
                  required
                  placeholder="siti@siswa.edu"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full bg-white border-2 border-[#E0DED9] px-3 py-2 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[#666666] mb-1">Pilih Jenjang &amp; Kelas</label>
                <select
                  value={newStudentKelas}
                  onChange={(e) => setNewStudentKelas(e.target.value)}
                  className="w-full bg-white border-2 border-[#E0DED9] px-3 py-2 text-xs"
                >
                  <optgroup label="Tingkat SMP">
                    <option value="Kelas 7 (RCC)" className="bg-white">Kelas 7 (RCC)</option>
                    <option value="Kelas 7 (GCC)" className="bg-white">Kelas 7 (GCC)</option>
                    <option value="Kelas 8" className="bg-white">Kelas 8</option>
                    <option value="Kelas 9" className="bg-white">Kelas 9</option>
                  </optgroup>
                  <optgroup label="Tingkat SMA">
                    <option value="Kelas 10" className="bg-white">Kelas 10</option>
                    <option value="Kelas 11" className="bg-white">Kelas 11</option>
                    <option value="Kelas 12" className="bg-white">Kelas 12</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 uppercase">
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="px-4 py-2 border-2 border-[#E0DED9] hover:border-zinc-500 bg-[#F8F7F4] text-[#444444]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-bold"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: GRADE SUBMISSION */}
      {activeModalSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#E0DED9] max-w-md w-full p-6 space-y-4 font-mono-code text-xs text-[#2C2C2C]">
            <div className="flex justify-between items-center border-b border-[#E0DED9] pb-3">
              <h3 className="font-bold text-sm uppercase text-[#2C2C2C]">
                Penilaian Tugas: {activeModalSub.studentName}
              </h3>
              <button onClick={() => setActiveModalSub(null)} className="text-[#888888] hover:text-[#2C2C2C]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[#666666] mb-1">Skor Nilai (0 - 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full bg-white border-2 border-[#E0DED9] px-3 py-2 text-xs font-bold focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[#666666] mb-1">Catatan &amp; Umpan Balik Guru</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Catatan untuk siswa..."
                  className="w-full bg-white border-2 border-[#E0DED9] px-3 py-2 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 uppercase">
              <button
                onClick={() => setActiveModalSub(null)}
                className="px-4 py-2 border-2 border-[#E0DED9] hover:border-zinc-500 bg-[#F8F7F4] text-[#444444]"
              >
                Batal
              </button>
              <button
                onClick={handleSaveGrade}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-[#2C2C2C] font-bold"
              >
                Simpan Penilaian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
