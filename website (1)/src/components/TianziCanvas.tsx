import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Download, Send, Volume2, CheckCircle2, PenTool } from 'lucide-react';
import { speechEngine } from '../services/speech';
import { soundEffects } from '../services/soundEffects';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface TianziCanvasProps {
  initialChar?: string;
  currentUser?: UserProfile | null;
  currentChapterId?: number;
  onSubmitted?: () => void;
  availableCharacters?: string[];
  audioSpeed?: number;
}

export const TianziCanvas: React.FC<TianziCanvasProps> = ({
  initialChar = '你',
  currentUser,
  currentChapterId = 1,
  onSubmitted,
  availableCharacters: propCharacters,
  audioSpeed = 0.7
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>('#2C2C2C');
  const [brushWidth, setBrushWidth] = useState<number>(8);
  const [selectedChar, setSelectedChar] = useState<string>(initialChar);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  const defaultCharacters = [
    '你', '好', '我', '叫', '是', '老', '师', '学', '生', '人',
    '中', '国', '美', '的', '什', '么', '名', '字', '哪', '国',
    '他', '她', '很', '高', '兴', '认', '识', '在', '哪', '儿'
  ];

  const availableCharacters = propCharacters && propCharacters.length > 0
    ? Array.from(new Set(propCharacters.filter(Boolean)))
    : defaultCharacters;

  useEffect(() => {
    if (initialChar) {
      setSelectedChar(initialChar);
    }
  }, [initialChar]);

  // Draw Tianzi grid background lines
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Canvas background (warm paper texture)
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Outer border
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Tianzi orthogonal dashed center lines
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);

    // Horizontal center
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Vertical center
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Diagonal guidelines
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    ctx.restore();
  }, []);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx, canvas.width, canvas.height);
    setHasDrawn(false);
  }, [drawGrid]);

  useEffect(() => {
    resetCanvas();
  }, [selectedChar, resetCanvas]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    resetCanvas();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `hanzi_${selectedChar}_tianzi.png`;
    link.href = canvas.toDataURL();
    link.click();
    dbService.logActivity('SUBMIT_HANZI', `Mengunduh latihan Hanzi: ${selectedChar}`);
  };

  const handleSpeak = () => {
    speechEngine.speak(selectedChar, audioSpeed);
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    dbService.saveStudentSubmission({
      studentId: currentUser?.id || 'guest',
      studentName: currentUser?.name || 'Siswa Mandarin',
      studentClass: currentUser?.kelas || 'GCC/RCC',
      chapterId: currentChapterId,
      type: 'Tulisan Hanzi (田字格)',
      target: selectedChar,
      dataUrl: canvas.toDataURL()
    });

    soundEffects.playStar();
    setSubmittedSuccess(true);
    if (onSubmitted) onSubmitted();
    setTimeout(() => setSubmittedSuccess(false), 4000);
  };

  return (
    <div className="border-2 border-[#E0DED9] bg-white rounded-[20px] p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-[#E0DED9] pb-5">
        <div>
          <span className="meta-tag">
            LATIHAN MENULIS AKSARA MANDARIN · 田字格
          </span>
          <h3 className="font-gaegu text-3xl md:text-4xl font-bold text-[#2C2C2C] mt-1 flex items-center gap-2">
            Kanvas Kotak Tianzi Ge
          </h3>
          <p className="text-xs md:text-sm text-[#666666] font-sans mt-0.5">
            Tulis karakter Hanzi dengan panduan garis ortogonal dan diagonal untuk melatih proporsi goresan yang tepat.
          </p>
        </div>

        {/* Character Picker */}
        <div className="flex items-center gap-2 border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-xl p-1.5 text-xs">
          <span className="meta-tag pl-2">PILIH:</span>
          <select
            value={selectedChar}
            onChange={(e) => setSelectedChar(e.target.value)}
            className="bg-white border-2 border-[#E0DED9] text-[#2C2C2C] font-bold px-3 py-1 rounded-lg text-sm outline-none cursor-pointer focus:border-[#FFB703]"
          >
            {availableCharacters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={handleSpeak}
            className="p-1.5 border-2 border-[#E0DED9] hover:border-[#FFB703] bg-white rounded-lg text-amber-600 transition"
            title="Dengarkan Pelafalan Karakter"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative card-tianzi p-4 shadow-sm">
          {/* Watermark Guide */}
          {showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center font-hanzi text-[180px] text-[#2C2C2C]/10 pointer-events-none select-none">
              {selectedChar}
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="bg-transparent cursor-crosshair touch-none relative z-10 rounded-lg shadow-inner"
          />
        </div>

        {/* Drawing Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-2xl p-3.5 w-full max-w-xl text-xs font-sans">
          {/* Stroke Color */}
          <div className="flex items-center gap-1.5">
            <span className="meta-tag mr-1 text-[11px]">Tinta:</span>
            {[
              { color: '#2C2C2C', label: 'Hitam Kaligrafi' },
              { color: '#DC2626', label: 'Merah Vermilion' },
              { color: '#2563EB', label: 'Biru' },
              { color: '#D97706', label: 'Emas Amber' }
            ].map((item) => (
              <button
                key={item.color}
                onClick={() => setStrokeColor(item.color)}
                style={{ backgroundColor: item.color }}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  strokeColor === item.color ? 'border-[#2C2C2C] scale-110 ring-2 ring-[#FFB703]' : 'border-white opacity-70 hover:opacity-100'
                }`}
                title={item.label}
              />
            ))}
          </div>

          <div className="h-5 w-px bg-[#E0DED9] hidden sm:block"></div>

          {/* Brush Size */}
          <div className="flex items-center gap-1.5">
            <span className="meta-tag text-[11px]">Kuas:</span>
            <select
              value={brushWidth}
              onChange={(e) => setBrushWidth(Number(e.target.value))}
              className="bg-white border-2 border-[#E0DED9] rounded-lg text-[#2C2C2C] text-xs p-1 outline-none cursor-pointer focus:border-[#FFB703]"
            >
              <option value={4}>4px (Halus)</option>
              <option value={8}>8px (Sedang)</option>
              <option value={14}>14px (Tebal)</option>
            </select>
          </div>

          <div className="h-5 w-px bg-[#E0DED9] hidden sm:block"></div>

          {/* Toggle Watermark */}
          <button
            onClick={() => setShowWatermark(!showWatermark)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition border-2 ${
              showWatermark ? 'border-[#FFB703] bg-[#FFB703] text-[#2C2C2C]' : 'border-[#E0DED9] bg-white text-[#777777]'
            }`}
          >
            {showWatermark ? 'Panduan: Nyala' : 'Panduan: Mati'}
          </button>

          {/* Actions */}
          <button
            onClick={handleClear}
            className="border-2 border-[#E0DED9] hover:border-[#FFB703] bg-white text-[#444444] px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!hasDrawn}
            className="border-2 border-[#E0DED9] hover:border-[#FFB703] bg-white text-[#444444] disabled:opacity-30 px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1"
            title="Unduh Gambar Tulisan"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={!hasDrawn}
            className="btn-gaegu disabled:opacity-40 px-4 py-1.5 text-base flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim (+10 ⭐)</span>
          </button>
        </div>

        {submittedSuccess && (
          <div className="p-3 border-2 border-emerald-400 bg-emerald-50 rounded-xl text-emerald-900 font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tugas tulisan Hanzi berhasil dikirim dan tersimpan! +10 Bintang 🌟</span>
          </div>
        )}
      </div>
    </div>
  );
};
