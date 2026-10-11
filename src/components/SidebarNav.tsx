import React from 'react';
import { UserProfile } from '../types';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth
}) => {
  const tabs = [
    { id: 'lessons', label: 'Buku Ajar (15 Bab)', icon: '📖' },
    { id: 'workbook', label: 'Buku Latihan (Workbook)', icon: '✍️' },
    { id: 'exam', label: 'Simulasi Ujian HSK 1', icon: '🎓' },
    { id: 'canvas', label: 'Tulis Hanzi Tianzi Ge', icon: '📝' },
    { id: 'recorder', label: 'Latihan Suara & Nada', icon: '🎧' },
    { id: 'ai-tutor', label: 'Tutor AI Lidia', icon: '🤖' },
    { id: 'analytics', label: 'Dasbor Analisis Data', icon: '📊' },
    { id: 'teacher', label: 'Portal Guru', icon: '👨‍🏫', teacherOnly: true }
  ];

  return (
    <aside className="panel w-64 md:w-72 flex flex-col p-5 bg-white border-2 border-[#E0DED9] rounded-[20px] shrink-0 z-30 select-none overflow-y-auto custom-scrollbar shadow-sm">
      {/* Brand Header */}
      <div 
        onClick={() => setActiveTab('lessons')}
        className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#E0DED9] cursor-pointer hover:opacity-80 transition"
      >
        <span className="text-3xl">🐼</span>
        <div>
          <div className="meta-tag">MENU UTAMA</div>
          <div className="font-gaegu text-2xl font-bold text-[#2C2C2C] leading-none">
            Mandarin Asyik
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col gap-1.5 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.teacherOnly && currentUser?.role !== 'guru') {
                  onOpenAuth();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left transition font-sans text-sm ${
                isActive
                  ? 'bg-[#FFB703] text-[#2C2C2C] font-bold shadow-xs'
                  : 'text-[#555555] hover:bg-[#F8F7F4] hover:text-[#2C2C2C]'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
              {tab.teacherOnly && (
                <span className="ml-auto text-[9px] font-mono uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  Guru
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Progress Card */}
      <div className="mt-auto pt-4 border-t-2 border-[#E0DED9] space-y-1">
        <div className="meta-tag">BINTANG PRESTASI</div>
        <div className="font-gaegu text-2xl text-[#2C2C2C] font-bold flex items-center justify-between">
          <span>Koleksi:</span>
          <span className="text-amber-600 flex items-center gap-1">
            {currentUser?.totalStars ?? 65} ⭐
          </span>
        </div>
        <p className="text-xs text-[#888888]">
          {currentUser ? `Siswa: ${currentUser.name}` : 'Login untuk menyimpan nilaimu'}
        </p>
      </div>
    </aside>
  );
};
