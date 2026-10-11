import React, { useState, useRef } from 'react';
import { Mic, Square, Volume2, CloudUpload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { speechEngine } from '../services/speech';
import { soundEffects } from '../services/soundEffects';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface AudioRecorderProps {
  currentUser?: UserProfile | null;
  currentChapterId?: number;
  onSubmitted?: () => void;
  audioSpeed?: number;
  targetSentence?: { hanzi: string; pinyin: string; translation: string };
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  currentUser,
  currentChapterId = 1,
  onSubmitted,
  audioSpeed = 0.7,
  targetSentence: propSentence
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Target sentence for this chapter
  const defaultTargetSentences: Record<number, { hanzi: string; pinyin: string; translation: string }> = {
    1: { hanzi: '你好！很高兴认识你。', pinyin: 'Nǐ hǎo! Hěn gāoxìng rènshí nǐ.', translation: 'Halo! Sangat senang mengenalmu.' },
    2: { hanzi: '谢谢你！不客气。', pinyin: 'Xièxiè nǐ! Bù kèqì.', translation: 'Terima kasih! Sama-sama.' },
    3: { hanzi: '你叫什么名字？我叫李月。', pinyin: 'Nǐ jiào shénme míngzì? Wǒ jiào Lǐ Yuè.', translation: 'Siapa namamu? Namaku Li Yue.' },
    4: { hanzi: '她是我的汉语老师。', pinyin: 'Tā shì wǒ de hànyǔ lǎoshī.', translation: 'Dia adalah guru bahasa Mandarinku.' },
    5: { hanzi: '你家有几口人？我家有三口人。', pinyin: 'Nǐ jiā yǒu jǐ kǒu rén? Wǒ jiā yǒu sān kǒu rén.', translation: 'Keluargamu ada berapa orang? Keluargaku ada 3 orang.' }
  };

  const targetSentence = propSentence || defaultTargetSentences[currentChapterId] || defaultTargetSentences[1];

  const handleListenTarget = () => {
    speechEngine.speak(targetSentence.hanzi, audioSpeed);
  };

  const startRecording = async () => {
    try {
      setStatusMessage(null);
      setIsSubmitted(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setStatusMessage('Gagal mengakses mikrofon. Harap berikan izin akses mikrofon pada browser Anda.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSubmit = () => {
    if (!audioBlobUrl) return;

    dbService.saveStudentSubmission({
      studentId: currentUser?.id || 'guest',
      studentName: currentUser?.name || 'Siswa Mandarin',
      studentClass: currentUser?.kelas || 'GCC/RCC',
      chapterId: currentChapterId,
      type: 'Rekaman Suara Pelafalan',
      target: `${targetSentence.hanzi} (${targetSentence.pinyin})`,
      dataUrl: audioBlobUrl
    });

    soundEffects.playSuccess();
    setIsSubmitted(true);
    setStatusMessage('Rekaman suara berhasil dikirim ke Guru! +10 Bintang 🌟');
    if (onSubmitted) onSubmitted();
  };

  return (
    <div className="border-2 border-[#E0DED9] bg-white rounded-[20px] p-6 md:p-8 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
      <div className="space-y-1">
        <span className="meta-tag">
          PELATIHAN NADA &amp; BICARA · 口语训练
        </span>
        <h3 className="font-gaegu text-3xl md:text-4xl font-bold text-[#2C2C2C]">
          Perekam Suara Pelafalan
        </h3>
        <p className="text-xs md:text-sm text-[#666666] font-sans">
          Dengarkan pelafalan standar dari native speaker, lalu rekam suaramu untuk dievaluasi oleh Guru.
        </p>
      </div>

      {/* Target Sentence Box */}
      <div className="card-tianzi p-6 space-y-3 text-center">
        <span className="meta-tag block">
          TARGET KALIMAT BAB INI:
        </span>
        <div className="text-3xl md:text-4xl font-hanzi font-semibold text-[#2C2C2C] tracking-wide">
          {targetSentence.hanzi}
        </div>
        <div className="text-amber-700 font-mono-code text-base md:text-lg font-bold">
          {targetSentence.pinyin}
        </div>
        <div className="text-[#666666] text-xs md:text-sm">
          "{targetSentence.translation}"
        </div>

        <div className="pt-2">
          <button
            onClick={handleListenTarget}
            className="border-2 border-[#E0DED9] hover:border-[#FFB703] bg-white text-[#2C2C2C] text-xs font-bold px-4 py-2 rounded-full transition inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>Dengarkan Native 🔊</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <div>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-18 h-18 border-4 border-[#FFB703] bg-[#FFB703] hover:scale-105 text-[#2C2C2C] rounded-full flex items-center justify-center text-2xl transition shadow-md"
              title="Mulai Rekam Suara"
            >
              <Mic className="w-8 h-8" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-18 h-18 border-4 border-red-500 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl animate-pulse ring-4 ring-red-200"
              title="Hentikan Rekaman"
            >
              <Square className="w-7 h-7" />
            </button>
          )}
        </div>

        <div className="text-xs text-[#666666] font-sans">
          {isRecording ? (
            <span className="text-red-600 font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              Sedang merekam... ({recordingSeconds}s) - Bicara sekarang!
            </span>
          ) : audioBlobUrl ? (
            'Rekaman selesai. Dengarkan kembali di bawah atau rekam ulang.'
          ) : (
            'Klik tombol mikrofon di atas untuk mulai merekam suaramu.'
          )}
        </div>

        {/* Audio Player Preview */}
        {audioBlobUrl && (
          <div className="w-full border-2 border-[#E0DED9] bg-[#FFFDF9] rounded-2xl p-4 space-y-3 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#2C2C2C]">Hasil Rekaman Suaramu:</span>
              <span className="meta-tag bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                SIAP DIKIRIM
              </span>
            </div>

            <audio src={audioBlobUrl} controls className="w-full rounded-md" />

            <div className="flex gap-2">
              <button
                onClick={startRecording}
                className="w-1/3 py-2 border-2 border-[#E0DED9] hover:border-[#FFB703] bg-white rounded-full text-xs font-bold text-[#444444] transition flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ulang</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitted}
                className="w-2/3 py-2 btn-gaegu text-lg shadow-xs flex items-center justify-center gap-1.5"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isSubmitted ? 'Terkirim ke Guru' : 'Kirim ke Guru (+10 ⭐)'}</span>
              </button>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className={`p-3 border-2 rounded-xl text-xs flex items-center justify-center gap-2 w-full font-bold ${
            isSubmitted ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-red-400 bg-red-50 text-red-900'
          }`}>
            {isSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
