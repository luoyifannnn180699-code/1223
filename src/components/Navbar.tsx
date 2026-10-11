import React from 'react';
import { LogOut, User, Sparkles, Menu } from 'lucide-react';
import { UserProfile } from '../types';
import { speechEngine } from '../services/speech';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  audioSpeed: number;
  setAudioSpeed: (s: number) => void;
  currentChapterId?: number;
  currentChapterTitle?: string;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  audioSpeed,
  setAudioSpeed,
  currentChapterId = 1,
  currentChapterTitle = '你好 Nǐ hǎo',
  onOpenMobileMenu = () => {},
}) => {
  const getTabHeading = () => {
    switch (activeTab) {
      case 'lessons':
        return `Bab ${currentChapterId}: ${currentChapterTitle}`;
      case 'workbook':
        return `Buku Latihan · Bab ${currentChapterId}`;
      case 'exam':
        return 'Simulasi Ujian HSK 1';
      case 'canvas':
        return 'Latihan Menulis Tianzi Ge';
      case 'recorder':
        return 'Latihan Suara & Nada';
      case 'ai-tutor':
        return 'Tutor AI Lidia';
      case 'analytics':
        return 'Dasbor Analisis Data';
      case 'teacher':
        return 'Portal Guru & Nilai';
      default:
        return 'Belajar Mandarin Jadi Seru! 🐼';
    }
  };

  return (
    <header className="nav-card px-3 md:px-6 py-3 md:py-4 flex justify-between items-center gap-2 bg-white shadow-sm shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl hover:bg-[#F8F7F4] text-[#2C2C2C] shrink-0"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="meta-tag hidden sm:block">Mandarin HSK 1 · Belajar Santai & Interaktif</div>
          <h1 className="font-gaegu text-2xl md:text-4xl text-[#2C2C2C] font-bold m-0 leading-tight truncate flex items-center gap-2">
            <span className="truncate">
              {activeTab === 'lessons' ? 'Belajar Mandarin! 🐼' : getTabHeading()}
            </span>
            {activeTab === 'lessons' && (
              <span className="hidden sm:inline text-base md:text-lg font-sans font-normal text-[#888888] bg-[#F8F7F4] border border-[#E0DED9] px-3 py-0.5 rounded-full shrink-0">
                Bab {currentChapterId}
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Voice Model Selector - desktop only */}
        <div className="hidden lg:flex items-center gap-1.5 border-2 border-[#E0DED9] rounded-full px-3 py-1 text-xs bg-[#F8F7F4]">
          <span className="text-[10px] text-[#888888] font-bold uppercase tracking-wider">🎙️ SUARA:</span>
          <select
            value={speechEngine.getVoiceModel()}
            onChange={(e) => {
              speechEngine.setVoiceModel(e.target.value);
              speechEngine.testVoice();
            }}
            className="bg-transparent font-bold text-xs text-[#2C2C2C] outline-none cursor-pointer"
            title="Pilih Model Suara AI Mandarin"
          >
            <option value="xiaoxiao">Lidia AI (Xiaoxiao)</option>
            <option value="yunxi">Laoshi Yunxi</option>
            <option value="xiaoyi">Xiaoyi</option>
            <option value="standard">Standar Sistem</option>
          </select>
        </div>

        {/* Speed toggle - hidden on small mobile */}
        <div className="hidden sm:flex items-center gap-1.5 border-2 border-[#E0DED9] rounded-full px-3 py-1 text-xs font-mono-code bg-[#F8F7F4]">
          <span className="text-[10px] text-[#888888] font-bold uppercase tracking-wider mr-1">AUDIO:</span>
          <button
            onClick={() => setAudioSpeed(0.7)}
            className={`px-2 py-0.5 rounded-full text-xs font-bold transition ${
              audioSpeed === 0.7 ? 'bg-[#FFB703] text-[#2C2C2C] shadow-xs' : 'text-[#666666] hover:text-[#2C2C2C]'
            }`}
          >
            0.7X
          </button>
          <span className="text-[#E0DED9]">|</span>
          <button
            onClick={() => setAudioSpeed(1.0)}
            className={`px-2 py-0.5 rounded-full text-xs font-bold transition ${
              audioSpeed === 1.0 ? 'bg-[#FFB703] text-[#2C2C2C] shadow-xs' : 'text-[#666666] hover:text-[#2C2C2C]'
            }`}
          >
            1.0X
          </button>
        </div>

        {/* User Info & Auth */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 border-2 border-[#E0DED9] hover:border-[#FFB703] bg-[#F8F7F4] px-2.5 md:px-3.5 py-1.5 rounded-full transition text-xs"
            >
              <span className="text-lg">{currentUser.avatar}</span>
              <span className="hidden md:inline font-bold text-[#2C2C2C] max-w-[120px] truncate">
                {currentUser.name}
              </span>
              <span className="hidden lg:inline bg-[#FFB703]/30 text-[#854D0E] font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">
                {currentUser.role}
              </span>
              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 fill-current" />
                {currentUser.totalStars}
              </span>
            </button>
            <button
              onClick={onLogout}
              className="hidden md:block p-2 border-2 border-[#E0DED9] hover:border-red-300 hover:text-red-600 text-[#888888] rounded-full transition"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-gaegu px-3 md:px-5 py-1.5 text-sm md:text-lg shadow-sm flex items-center gap-1.5"
          >
            <User className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Masuk</span>
          </button>
        )}
      </div>
    </header>
  );
};