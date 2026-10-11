// src/services/speech.ts
// Audio Mandarin 3-tier priority:
// 1. audio-cmn (suara manusia asli dari GitHub)
// 2. Google Translate TTS (natural, butuh internet)
// 3. Web Speech API (offline, robot)

const AUDIO_CMN_BASE = 'https://cdn.jsdelivr.net/gh/hugolpz/audio-cmn@master/96k/hsk/';

let currentAudio: HTMLAudioElement | null = null;

/**
 * Cek apakah teks hanya berisi karakter Hanzi (tanpa spasi/tanda baca).
 */
function isSingleHanziOrWord(text: string): boolean {
  return /^[\u4e00-\u9fa5]+$/.test(text.trim());
}

/**
 * Putar audio dari audio-cmn (suara manusia).
 * Berhasil = return true.
 */
async function tryAudioCmn(text: string): Promise<boolean> {
  if (!isSingleHanziOrWord(text)) return false;

  const trimmed = text.trim();
  const url = `${AUDIO_CMN_BASE}cmn-${encodeURIComponent(trimmed)}.mp3`;

  try {
    stopAudio();

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';

    // Cek dulu apakah file-nya ada (HEAD request via fetch)
    const check = await fetch(url, { method: 'HEAD' });
    if (!check.ok) return false;

    await audio.play();
    currentAudio = audio;
    return true;
  } catch {
    return false;
  }
}

/**
 * Putar Google Translate TTS (suara natural untuk frasa/kalimat).
 */
async function tryGoogleTTS(text: string): Promise<boolean> {
  try {
    // Google TTS max ~200 char
    const truncated = text.length > 180 ? text.slice(0, 180) : text;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      truncated
    )}&tl=zh-CN&client=tw-ob`;

    stopAudio();

    const audio = new Audio(url);
    await audio.play();
    currentAudio = audio;
    return true;
  } catch {
    return false;
  }
}

/**
 * Web Speech API (fallback offline).
 */
function speakWithWebSpeech(text: string, rate: number): void {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = rate;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const chineseVoice =
    voices.find((v) => v.lang === 'zh-CN') ||
    voices.find((v) => v.lang.startsWith('zh-CN')) ||
    voices.find((v) => v.lang.startsWith('zh'));

  if (chineseVoice) utterance.voice = chineseVoice;

  window.speechSynthesis.speak(utterance);
}

function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * FUNGSI UTAMA — panggil ini dari komponen.
 */
export async function speakMandarin(text: string, rate: number = 0.85): Promise<void> {
  if (!text || !text.trim()) return;

  // 1. Coba audio-cmn (suara manusia asli)
  if (await tryAudioCmn(text)) return;

  // 2. Coba Google TTS (natural)
  if (await tryGoogleTTS(text)) return;

  // 3. Fallback Web Speech (robot, offline)
  speakWithWebSpeech(text, rate);
}

export function stopSpeaking(): void {
  stopAudio();
}

// Backward compatibility — kalau komponen pakai speechEngine.speak(...)
export const speechEngine = {
  speak: (text: string, rate: number = 0.85) => speakMandarin(text, rate),
  stop: stopSpeaking,
};

// Preload voices untuk Web Speech fallback
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}