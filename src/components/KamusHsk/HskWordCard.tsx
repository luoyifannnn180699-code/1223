import React from 'react';
import type { HskWord } from './hskTypes';

interface Props {
  word: HskWord;
  onSpeak?: (text: string) => void;
}

export function HskWordCard({ word, onSpeak }: Props) {
  const form = word.forms[0];
  return (
    <div className="p-3 border-b border-[#E0DED9] hover:bg-[#FFFDF9] transition-colors">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-hanzi font-semibold text-[#2C2C2C]">
          {word.simplified}
        </span>
        {form && (
          <span className="text-sm text-amber-700 font-bold font-mono-code">
            {form.transcriptions.pinyin}
          </span>
        )}
        {word.level?.[0] && (
          <span className="text-[10px] uppercase bg-[#FFB703]/30 text-amber-900 px-2 py-0.5 rounded-full font-bold">
            {word.level[0].replace('new-', 'HSK ')}
          </span>
        )}
        {form && onSpeak && (
          <button
            onClick={() => onSpeak(form.traditional || word.simplified)}
            className="ml-auto text-[#888888] hover:text-amber-600 transition p-1.5 hover:bg-amber-50 rounded-lg"
            title="Putar audio"
          >
            🔊
          </button>
        )}
      </div>
      {form && (
        <div className="text-sm text-[#555555] mt-1">
          {form.meanings.join('; ')}
        </div>
      )}
    </div>
  );
}