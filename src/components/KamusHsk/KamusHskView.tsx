import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { speechEngine } from '../../services/speech';
import type { HskWord } from './hskTypes';
import { HskWordCard } from './HskWordCard';
import { FlashcardHsk } from './FlashcardHsk';

type Mode = 'list' | 'flashcard';

const LEVELS = ['all', 'new-1', 'new-2', 'new-3', 'new-4', 'new-5', 'new-6', 'new-7', 'new-8', 'new-9'];

export function KamusHskView() {
  const [words, setWords] = useState<HskWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [mode, setMode] = useState<Mode>('list');

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'hskVocabulary.json')
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data: HskWord[]) => {
        setWords(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Gagal load hskVocabulary.json:', err);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return words.filter((w) => {
      const matchLevel = level === 'all' || w.level.includes(level);
      if (!matchLevel) return false;
      if (!q) return true;
      const form = w.forms[0];
      return (
        w.simplified.includes(q) ||
        (form?.transcriptions.pinyin.toLowerCase().includes(q) ?? false) ||
        (form?.meanings.some((m) => m.toLowerCase().includes(q)) ?? false)
      );
    });
  }, [words, level, search]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 12,
  });

  const handleSpeak = (text: string) => {
    speechEngine.speak(text, 0.85);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#888888]">
        Memuat kamus HSK... (11.000+ kata)
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle Mode */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('list')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition ${
            mode === 'list'
              ? 'bg-[#FFB703] text-[#2C2C2C] shadow-sm'
              : 'bg-[#F8F7F4] text-[#666666] hover:bg-[#E0DED9]'
          }`}
        >
          📖 Daftar
        </button>
        <button
          onClick={() => setMode('flashcard')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition ${
            mode === 'flashcard'
              ? 'bg-[#FFB703] text-[#2C2C2C] shadow-sm'
              : 'bg-[#F8F7F4] text-[#666666] hover:bg-[#E0DED9]'
          }`}
        >
          🎴 Flashcard
        </button>
      </div>

      {/* Filter */}
      {mode === 'list' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  level === lv
                    ? 'bg-[#FFB703] text-[#2C2C2C]'
                    : 'bg-[#F8F7F4] text-[#666666] hover:bg-[#E0DED9]'
                }`}
              >
                {lv === 'all' ? 'Semua' : lv.replace('new-', 'HSK ')}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari hanzi / pinyin / arti..."
            className="w-full px-4 py-2.5 bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-2xl text-sm focus:outline-none focus:border-[#FFB703]"
          />

          <div className="text-xs text-[#888888]">
            Menampilkan <span className="font-bold text-[#2C2C2C]">{filtered.length}</span> kata
          </div>

          <div
            ref={parentRef}
            className="h-[60vh] overflow-auto bg-white rounded-[20px] border-2 border-[#E0DED9]"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((v) => {
                const word = filtered[v.index];
                return (
                  <div
                    key={word.simplified + '-' + v.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${v.size}px`,
                      transform: `translateY(${v.start}px)`,
                    }}
                  >
                    <HskWordCard word={word} onSpeak={handleSpeak} />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {mode === 'flashcard' && (
        <FlashcardHsk
          words={filtered.length > 0 ? filtered : words}
          onExit={() => setMode('list')}
          onSpeak={handleSpeak}
        />
      )}
    </div>
  );
}