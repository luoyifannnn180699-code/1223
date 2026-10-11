import React, { useState } from 'react';
import {
  Send,
  Volume2,
  Lightbulb,
  BookOpen,
  Search,
  MessageSquare
} from 'lucide-react';
import { speechEngine } from '../services/speech';
import { LIDIA_GRAMMAR_KB, LidiaGrammarEntry, LidiaGrammarExample } from '../data/lidiaAdvancedGrammarKB';

interface AITutorViewProps {
  audioSpeed?: number;
}

export const AITutorView: React.FC<AITutorViewProps> = ({ audioSpeed = 0.7 }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        'Halo! Saya Lidia (丽迪娅老师), tutor AI tata bahasa Mandarin Anda! 🐼\n\nSaya menguasai seluruh materi tata bahasa HSK 1 hingga HSK 9 serta AllSet Learning Chinese Grammar Wiki. Tanyakan apa saja mengenai pola kalimat, perbedaan kata, atau cara penggunaan partikel yang tepat!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lidiaMode, setLidiaMode] = useState<'chat' | 'encyclopedia'>('chat');
  const [searchKB, setSearchKB] = useState('');
  const [selectedKBItem, setSelectedKBItem] = useState<LidiaGrammarEntry | null>(null);

  const handleSend = async (userQuery?: string) => {
    const textToSend = userQuery || inputValue;
    if (!textToSend.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    if (!userQuery) setInputValue('');
    setIsLoading(true);

    // Delay kecil biar UX terasa natural
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Cari di knowledge base lokal
    const q = textToSend.toLowerCase();
    const matched = LIDIA_GRAMMAR_KB.find((kb) => {
      if (kb.title.toLowerCase().includes(q)) return true;
      if (kb.keywords.some((k) => q.includes(k.toLowerCase()))) return true;
      if (kb.examples.some((e) => q.includes(e.hanzi))) return true;
      return false;
    });

    if (matched) {
      const mistakes =
        matched.boundariesAndMistakes && matched.boundariesAndMistakes.length > 0
          ? matched.boundariesAndMistakes
              .map((m) => `❌ Salah: "${m.wrong}" ➔ ✅ Benar: "${m.right}"\n   Alasan: ${m.reason}`)
              .join('\n\n')
          : 'Perhatikan urutan kata dan fungsi partikel yang tepat.';

      const reply =
        `Berikut penjelasan mengenai **${matched.title}**:\n\n` +
        `📐 **Rumus:**\n${matched.formula}\n\n` +
        `📖 **Penjelasan:**\n${matched.summary}\n\n` +
        `⚠️ **Kesalahan Umum:**\n${mistakes}\n\n` +
        `✅ **Contoh Benar:**\n${matched.examples
          .map((e: LidiaGrammarExample) => `• ${e.hanzi} (${e.pinyin}) = ${e.translation}`)
          .join('\n')}`;

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Pertanyaan bagus! Untuk materi tersebut, pastikan memperhatikan subjek, kata kerja, dan penempatan keterangan waktu atau tempat yang selalu mendahului predikat dalam Bahasa Mandarin.\n\n' +
            '💡 Coba tanyakan topik berikut yang sudah tersedia di pustaka saya:\n' +
            '• 有点儿 vs 一点儿\n' +
            '• 一...就... (begitu... langsung...)\n' +
            '• 还是 vs 或者\n' +
            '• 会 vs 能 vs 可以\n' +
            '• 的 vs 得 vs 地\n' +
            '• 不 vs 没\n' +
            '• Struktur 是...的\n' +
            '• 把字句 & 被字句\n\n' +
            'Atau buka tab **Pustaka** untuk lihat semua topik yang tersedia!'
        }
      ]);
    }

    setIsLoading(false);
  };

  const handleSpeakText = (text: string) => {
    // Extract Hanzi strings
    const hanziOnly = text.match(/[\u4e00-\u9fa5]+/g)?.join(' ') || text;
    speechEngine.speak(hanziOnly, audioSpeed);
  };

  const filteredKB = LIDIA_GRAMMAR_KB.filter((kb) => {
    const q = searchKB.toLowerCase().trim();
    if (!q) return true;
    return (
      kb.title.toLowerCase().includes(q) ||
      kb.formula.toLowerCase().includes(q) ||
      kb.summary.toLowerCase().includes(q) ||
      kb.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-[20px] p-6 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="meta-tag">TUTOR AI MANDARIN INTERAKTIF</div>
            <h2 className="font-gaegu text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-1 flex items-center gap-2">
              <span>Lidia AI (丽迪娅老师)</span>
              <span className="text-xl">🐼</span>
            </h2>
            <p className="text-[#666666] text-xs md:text-sm font-sans mt-0.5">
              Tanyakan pola kalimat, aturan tata bahasa HSK, atau perbedaan kata langsung dengan Lidia!
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 border-2 border-[#E0DED9] bg-white rounded-full p-1 text-xs">
            <button
              onClick={() => setLidiaMode('chat')}
              className={`px-4 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${
                lidiaMode === 'chat'
                  ? 'bg-[#FFB703] text-[#2C2C2C] shadow-xs'
                  : 'text-[#666666] hover:text-[#2C2C2C]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ruang Tanya</span>
            </button>
            <button
              onClick={() => setLidiaMode('encyclopedia')}
              className={`px-4 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${
                lidiaMode === 'encyclopedia'
                  ? 'bg-[#FFB703] text-[#2C2C2C] shadow-xs'
                  : 'text-[#666666] hover:text-[#2C2C2C]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pustaka ({LIDIA_GRAMMAR_KB.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Topic Chips */}
        <div className="pt-3 border-t-2 border-[#E0DED9] flex flex-wrap gap-2 text-xs">
          {[
            { label: '01. 有点儿 vs 一点儿', query: 'Jelaskan perbedaan 有点儿 (yǒudiǎnr) dan 一点儿 (yìdiǎnr) beserta rumus dan contoh kesalahannya!' },
            { label: '02. Pola 一...就...', query: 'Bagaimana cara menggunakan struktur 一...就... (yī... jiù...) yang benar beserta batasan kesalahannya?' },
            { label: '03. 还是 vs 或者', query: 'Apa perbedaan 还是 (háishì) dan 或者 (huòzhě) untuk mengatakan "atau" dalam Bahasa Mandarin?' },
            { label: '04. 会 vs 能 vs 可以', query: 'Jelaskan perbedaan 会 (huì), 能 (néng), dan 可以 (kěyǐ) beserta contoh kalimat dan batasannya!' },
            { label: '05. 的 vs 得 vs 地', query: 'Jelaskan perbedaan tiga partikel de: 的 vs 得 vs 地 beserta rumus dan perbaikan kesalahannya!' },
            { label: '06. 不 vs 没', query: 'Jelaskan perbedaan kata negasi 不 (bù) vs 没 (méi) beserta aturan mengapa 没 tidak boleh digabung dengan 了!' }
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleSend(chip.query)}
              className="border-2 border-[#E0DED9] hover:border-[#FFB703] bg-white text-[#555555] hover:text-[#2C2C2C] px-3 py-1 rounded-full transition font-sans text-xs font-bold"
            >
              💡 {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* MODE 1: CHAT VIEW */}
      {lidiaMode === 'chat' && (
        <div className="border-2 border-[#E0DED9] bg-white rounded-[20px] p-6 flex flex-col h-[580px] shadow-sm">
          <div className="meta-tag mb-2">OBROLAN BERSAMA LIDIA AI</div>

          {/* Messages Feed */}
          <div className="flex-grow overflow-y-auto space-y-4 p-2 custom-scrollbar">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-9 h-9 border-2 border-[#E0DED9] bg-[#FFB703]/20 text-[#2C2C2C] rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    🐼
                  </div>
                )}

                <div
                  className={`p-4 sm:p-5 max-w-2xl leading-relaxed whitespace-pre-line relative group border-2 ${
                    m.role === 'user'
                      ? 'border-[#FFB703] bg-[#FFB703] text-[#2C2C2C] font-bold rounded-[18px] text-xs sm:text-sm shadow-2xs'
                      : 'border-[#E0DED9] bg-[#FFFDF9] text-[#2C2C2C] rounded-[18px] font-sans text-xs sm:text-sm'
                  }`}
                >
                  {m.content}

                  {m.role === 'assistant' && (
                    <button
                      onClick={() => handleSpeakText(m.content)}
                      className="absolute bottom-2 right-2 p-1.5 bg-white border border-[#E0DED9] hover:border-[#FFB703] rounded-full text-amber-600 opacity-60 group-hover:opacity-100 transition shadow-2xs"
                      title="Dengarkan Pelafalan"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#888888] font-mono-code p-2">
                <span className="w-2 h-2 rounded-full bg-[#FFB703] animate-ping"></span>
                <span>Lidia sedang menyiapkan penjelasan...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="pt-4 border-t-2 border-[#E0DED9] flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya tata bahasa (contoh: Kapan menggunakan 几 dan 多少?)..."
              className="flex-grow bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#2C2C2C] placeholder-[#888888] focus:outline-none focus:border-[#FFB703]"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              className="btn-gaegu disabled:opacity-40 px-5 py-2.5 text-lg shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Kirim</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: ENCYCLOPEDIA VIEW */}
      {lidiaMode === 'encyclopedia' && (
        <div className="border-2 border-[#E0DED9] bg-white rounded-[20px] p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-[#E0DED9] pb-4">
            <div>
              <div className="meta-tag">PUSTAKA RESMI TATA BAHASA</div>
              <h3 className="font-gaegu text-3xl font-bold text-[#2C2C2C]">
                Ensiklopedia Tata Bahasa Mandarin ({filteredKB.length} Bab)
              </h3>
            </div>

            <div className="relative w-full md:w-64 font-mono-code text-xs">
              <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKB}
                onChange={(e) => setSearchKB(e.target.value)}
                placeholder="Cari pustaka tata bahasa..."
                className="w-full bg-[#F8F7F4] border-2 border-[#E0DED9] rounded-xl pl-9 pr-3 py-2 text-[#2C2C2C] placeholder-[#888888] focus:outline-none focus:border-[#FFB703]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKB.map((kb) => (
              <div
                key={kb.id}
                onClick={() => setSelectedKBItem(kb)}
                className="border-2 border-[#E0DED9] bg-[#FFFDF9] hover:border-[#FFB703] rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div>
                  <span className="font-gaegu text-base font-bold bg-[#FFB703]/30 text-amber-900 px-2.5 py-0.5 rounded-full inline-block">
                    {kb.level}
                  </span>
                  <h4 className="font-gaegu text-2xl font-bold text-[#2C2C2C] mt-2">
                    {kb.title}
                  </h4>
                  <div className="text-amber-800 text-xs font-mono-code font-bold mt-1 line-clamp-1">
                    {kb.formula}
                  </div>
                  <p className="text-xs text-[#666666] mt-2 line-clamp-2">
                    {kb.summary}
                  </p>
                </div>

                <div className="meta-tag text-amber-700 flex items-center gap-1 pt-2 border-t border-[#E0DED9]">
                  <span>LIHAT RUMUS &amp; CONTOH →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Detail KB Item */}
          {selectedKBItem && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-[#E0DED9] rounded-[24px] max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start border-b-2 border-[#E0DED9] pb-3">
                  <div>
                    <span className="font-gaegu text-base font-bold bg-[#FFB703]/30 text-amber-900 px-3 py-0.5 rounded-full">
                      {selectedKBItem.level}
                    </span>
                    <h3 className="font-gaegu text-3xl font-bold text-[#2C2C2C] mt-1">
                      {selectedKBItem.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedKBItem(null)}
                    className="text-[#888888] hover:text-[#2C2C2C] p-1 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="card-tianzi p-4">
                  <span className="meta-tag block mb-1">RUMUS POLA STRUKTUR:</span>
                  <div className="font-mono-code text-sm font-bold text-amber-800">
                    {selectedKBItem.formula}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="meta-tag">PENJELASAN:</span>
                  <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
                    {selectedKBItem.summary}
                  </p>
                </div>

                {selectedKBItem.boundariesAndMistakes && selectedKBItem.boundariesAndMistakes.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                    <span className="meta-tag text-amber-800 font-bold">KESALAHAN UMUM SISWA:</span>
                    <div className="space-y-1 text-xs text-amber-900">
                      {selectedKBItem.boundariesAndMistakes.map((m, mI) => (
                        <div key={mI}>
                          <span className="line-through text-red-600">{m.wrong}</span> ➔ <span className="font-bold text-emerald-700">{m.right}</span> ({m.reason})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="meta-tag">CONTOH KALIMAT:</span>
                  <div className="space-y-2">
                    {selectedKBItem.examples.map((ex: LidiaGrammarExample, exI: number) => (
                      <div
                        key={exI}
                        className="border border-[#E0DED9] bg-[#FFFDF9] rounded-xl p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-base font-hanzi font-semibold text-[#2C2C2C]">
                            {ex.hanzi}
                          </div>
                          <div className="text-amber-700 text-xs font-mono-code font-bold">
                            {ex.pinyin}
                          </div>
                          <div className="text-xs text-[#666666]">"{ex.translation}"</div>
                        </div>
                        <button
                          onClick={() => speechEngine.speak(ex.hanzi, audioSpeed)}
                          className="w-8 h-8 border border-[#E0DED9] hover:border-[#FFB703] rounded-full flex items-center justify-center transition text-xs shrink-0"
                        >
                          🔊
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSend(`Jelaskan lebih mendalam tentang ${selectedKBItem.title} dan berikan 3 soal latihan!`);
                    setSelectedKBItem(null);
                    setLidiaMode('chat');
                  }}
                  className="btn-gaegu w-full py-2 text-lg shadow-sm"
                >
                  Tanyakan Ini ke Lidia AI
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};