import React from 'react';
import { UserProfile } from '../types';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const tabs = [
    { id: 'lessons', label: 'Buku Ajar (15 Bab)', icon: '📖' },
    { id: 'workbook', label: 'Buku Latihan (Workbook)', icon: '✍️' },
    { id: 'exam', label: 'Simulasi Ujian HSK 1', icon: '🎓' },
    { id: 'canvas', label: 'Tulis Hanzi Tianzi Ge', icon: '📝' },
    { id: 'recorder', label: 'Latihan Suara & Nada', icon: '🎧' },
    { id: 'ai-tutor', label: 'Tutor AI Lidia', icon: '🤖' },
    { id: 'kamus-hsk', label: 'Kamus HSK 1-9', icon: '📚' },
    { id: 'analytics', label: 'Dasbor Analisis Data', icon: '📊' },
    { id: 'teacher', label: 'Portal Guru', icon: '👨‍🏫', teacherOnly: true },
  ];

  const handleTabClick = (tabId: string, teacherOnly?: boolean) => {
    if (teacherOnly && currentUser?.role !== 'guru') {
      onOpenAuth();
    } else {
      setActiveTab(tabId);
    }
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar / Mobile Drawer */}
      <aside
        className={`
          panel p-5 bg-white border-2 border-[#E0DED9] shadow-sm select-none overflow-y-auto custom-scrollbar
          w-64 md:w-72 md:flex md:flex-col md:rounded-[20px] shrink-0
          ${isMobileOpen
            ? 'flex flex-col fixed inset-y-4 left-4 right-4 z-50 rounded-[20px] max-w-sm'
            : 'hidden md:flex'
          }
        `}
      >
        {/* Brand Header */}
        <div
          onClick={() => handleTabClick('lessons')}
          className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#E0DED9] cursor-pointer hover:opacity-80 transition"
        >
          <span className="text-3xl">🐼</span>
          <div>
            <div className="meta-tag">MENU UTAMA</div>
            <div className="font-gaegu text-2xl font-bold text-[#2C2C2C] leading-none">
              Mandarin Asyik
            </div>
          </div>
          {/* Close button on mobile */}
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              className="ml-auto md:hidden text-2xl text-[#888888] hover:text-[#2C2C2C] p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5 w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.teacherOnly)}
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
    </>
  );
};