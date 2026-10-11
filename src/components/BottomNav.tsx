import React from 'react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMenu: () => void;
}

const TABS = [
  { id: 'lessons', label: 'Buku', icon: '📖' },
  { id: 'workbook', label: 'Latihan', icon: '✍️' },
  { id: 'exam', label: 'Ujian', icon: '🎓' },
  { id: 'ai-tutor', label: 'Tutor', icon: '🤖' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-[#E0DED9] flex items-center justify-around px-2 pt-1"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition min-w-[60px] ${
              isActive ? 'bg-[#FFB703]/25' : 'active:bg-[#F8F7F4]'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span
              className={`text-[10px] font-bold ${
                isActive ? 'text-[#2C2C2C]' : 'text-[#888888]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* More button */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition active:bg-[#F8F7F4] min-w-[60px]"
      >
        <span className="text-xl">⋯</span>
        <span className="text-[10px] font-bold text-[#888888]">Lainnya</span>
      </button>
    </nav>
  );
};