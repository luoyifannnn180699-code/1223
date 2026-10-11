import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Search, 
  Activity,
  BookOpen
} from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile, AuditLog } from '../types';

interface AnalyticsDashboardProps {
  currentUser: UserProfile | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');

  useEffect(() => {
    setLogs(dbService.getLogs());
    setUsers(dbService.getAllUsers());
  }, []);

  const totalStarsEarned = users.reduce((acc, u) => acc + (u.totalStars || 0), 0);
  const totalCompletedLessons = users.reduce((acc, u) => acc + (u.completedLessons?.length || 0), 0);
  const totalSubmissions = dbService.getAllSubmissions().length;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUser = selectedUserFilter === 'all' || log.userId === selectedUserFilter;
    const matchesAction = selectedActionFilter === 'all' || log.actionType === selectedActionFilter;

    return matchesSearch && matchesUser && matchesAction;
  });

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hsk1_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-[20px] p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="meta-tag">
                SISTEM TELEMETRI &amp; ANALISIS
              </span>
              <span className="text-[#888888]">·</span>
              <span className="font-gaegu text-base font-bold text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Terenkripsi SHA-256
              </span>
            </div>
            <h2 className="font-gaegu text-3xl md:text-5xl text-[#2C2C2C] font-bold mt-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-amber-600" />
              <span>Dasbor Analisis Data &amp; Aktivitas</span>
            </h2>
            <p className="text-xs md:text-sm text-[#666666] font-sans mt-1 max-w-2xl leading-relaxed">
              Memantau metrik pembelajaran murid, progres modul HSK 1, frekuensi latihan, dan jejak audit aktivitas yang aman.
            </p>
          </div>

          <button
            onClick={handleExportLogs}
            className="btn-gaegu px-5 py-2 text-lg shadow-sm flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Log (.JSON)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border-2 border-[#E0DED9] bg-white rounded-2xl p-5 flex items-center gap-3.5 shadow-xs">
          <div className="w-12 h-12 border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-xl text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="meta-tag block">TOTAL PENGGUNA</span>
            <span className="font-gaegu text-3xl font-bold text-[#2C2C2C]">{users.length} Akun</span>
          </div>
        </div>

        <div className="border-2 border-[#E0DED9] bg-white rounded-2xl p-5 flex items-center gap-3.5 shadow-xs">
          <div className="w-12 h-12 border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-xl text-amber-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="meta-tag block">BINTANG DIPEROLEH</span>
            <span className="font-gaegu text-3xl font-bold text-amber-700">{totalStarsEarned} ⭐</span>
          </div>
        </div>

        <div className="border-2 border-[#E0DED9] bg-white rounded-2xl p-5 flex items-center gap-3.5 shadow-xs">
          <div className="w-12 h-12 border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-xl text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="meta-tag block">BAB DIKUASAI</span>
            <span className="font-gaegu text-3xl font-bold text-emerald-800">{totalCompletedLessons} Modul</span>
          </div>
        </div>

        <div className="border-2 border-[#E0DED9] bg-white rounded-2xl p-5 flex items-center gap-3.5 shadow-xs">
          <div className="w-12 h-12 border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-xl text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="meta-tag block">TUGAS DISERAHKAN</span>
            <span className="font-gaegu text-3xl font-bold text-blue-800">{totalSubmissions} Berkas</span>
          </div>
        </div>
      </div>

      {/* Chapters Mastery Overview (1 to 15) */}
      <div className="border-2 border-[#E0DED9] bg-white rounded-[20px] p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="font-gaegu text-2xl font-bold text-[#2C2C2C] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Tingkat Penguasaan 15 Bab HSK 1</span>
          </h3>
          <p className="text-xs text-[#666666] font-sans mt-0.5">
            Pemantauan progres siswa dalam menyelesaikan materi Buku Ajar dan Buku Latihan Workbook 1.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-15 gap-2">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((chNum) => {
            const isCompleted = currentUser?.completedLessons.includes(chNum);
            const isWbCompleted = currentUser?.completedWorkbook.includes(chNum);
            return (
              <div
                key={chNum}
                className={`p-2.5 rounded-xl border-2 text-center transition ${
                  isCompleted
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold'
                    : isWbCompleted
                    ? 'border-[#FFB703] bg-amber-50 text-amber-900 font-bold'
                    : 'border-[#E0DED9] bg-[#F8F7F4] text-[#888888]'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-[#888888]">Bab</div>
                <div className="text-lg font-gaegu font-bold">{chNum}</div>
                <div className="text-[9px] font-bold">
                  {isCompleted ? '✓ Tuntas' : isWbCompleted ? 'Latihan' : 'Belum'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users Summary Table */}
      <div className="border-2 border-[#E0DED9] bg-white rounded-[20px] p-6 space-y-4 shadow-sm">
        <h3 className="font-gaegu text-2xl font-bold text-[#2C2C2C] flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-600" />
          <span>Ringkasan Profil Murid &amp; Pengajar</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b-2 border-[#E0DED9] text-[#888888] uppercase text-[10px]">
                <th className="pb-3 font-bold">Pengguna</th>
                <th className="pb-3 font-bold">Peran</th>
                <th className="pb-3 font-bold">Level</th>
                <th className="pb-3 font-bold">Bintang</th>
                <th className="pb-3 font-bold">Progres Bab</th>
                <th className="pb-3 font-bold">Login Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DED9]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#FFFDF9]">
                  <td className="py-3 flex items-center gap-2">
                    <span className="text-2xl">{u.avatar}</span>
                    <div>
                      <div className="font-bold text-[#2C2C2C]">{u.name}</div>
                      <div className="text-[10px] text-[#888888]">{u.email}</div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-full border ${
                      u.role === 'guru' 
                        ? 'border-amber-400 bg-amber-100 text-amber-900' 
                        : 'border-emerald-400 bg-emerald-100 text-emerald-900'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-[#666666]">{u.level}</td>
                  <td className="py-3 text-amber-600 font-bold font-gaegu text-base">{u.totalStars} ⭐</td>
                  <td className="py-3 text-[#2C2C2C] font-bold">
                    {u.completedLessons.length} / 15 Bab
                  </td>
                  <td className="py-3 text-[#888888] text-[11px]">
                    {new Date(u.lastLoginAt).toLocaleTimeString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs & Audit Table */}
      <div className="border-2 border-[#E0DED9] bg-white rounded-[20px] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="font-gaegu text-2xl font-bold text-[#2C2C2C] flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              <span>Log Aktivitas &amp; Audit Keamanan Real-Time</span>
            </h3>
            <p className="text-xs text-[#666666] font-sans mt-0.5">
              Setiap aksi ditandai dengan stempel waktu dan tanda tangan integritas hash SHA-256.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            {/* Search */}
            <div className="relative flex-grow md:w-48">
              <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aktivitas..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-xl text-[#2C2C2C] placeholder-[#888888] focus:outline-none focus:border-[#FFB703]"
              />
            </div>

            {/* Filter by User */}
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-xl text-[#2C2C2C] px-2.5 py-1.5 focus:outline-none cursor-pointer focus:border-[#FFB703]"
            >
              <option value="all">Semua Pengguna</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Filter by Action */}
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-xl text-[#2C2C2C] px-2.5 py-1.5 focus:outline-none cursor-pointer focus:border-[#FFB703]"
            >
              <option value="all">Semua Jenis Aksi</option>
              <option value="LOGIN">LOGIN</option>
              <option value="REGISTER">REGISTER</option>
              <option value="PLAY_AUDIO">PLAY_AUDIO</option>
              <option value="COMPLETE_LESSON">COMPLETE_LESSON</option>
              <option value="SUBMIT_QUIZ">SUBMIT_QUIZ</option>
              <option value="SUBMIT_HANZI">SUBMIT_HANZI</option>
              <option value="SUBMIT_VOICE">SUBMIT_VOICE</option>
              <option value="SUBMIT_WORKBOOK">SUBMIT_WORKBOOK</option>
              <option value="TAKE_EXAM">TAKE_EXAM</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto max-h-96 custom-scrollbar">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#FFFDF9] sticky top-0 border-b-2 border-[#E0DED9] text-[#888888] uppercase text-[10px]">
              <tr>
                <th className="p-2.5 font-bold">Waktu</th>
                <th className="p-2.5 font-bold">Pengguna</th>
                <th className="p-2.5 font-bold">Aktivitas</th>
                <th className="p-2.5 font-bold">Rincian</th>
                <th className="p-2.5 font-bold">Perangkat</th>
                <th className="p-2.5 font-bold">Hash Integritas (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DED9]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-[#888888]">
                    Tidak ada catatan aktivitas yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FFFDF9] transition">
                    <td className="p-2.5 whitespace-nowrap text-[#666666]">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="p-2.5 font-bold text-[#2C2C2C] whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="border border-[#E0DED9] bg-[#F8F7F4] text-[#2C2C2C] px-2 py-0.5 rounded text-[10px] font-mono-code font-bold">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-2.5 text-[#555555] max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-2.5 text-[#888888] text-[10px] max-w-[120px] truncate" title={log.deviceInfo}>
                      {log.deviceInfo}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5 font-mono-code">
                        {log.hash.slice(0, 16)}...
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
