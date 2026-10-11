/**
 * Speech Engine 3-Tier untuk Bahasa Mandarin
 * 1. audio-cmn (suara manusia asli dari GitHub) — prioritas 1
 * 2. Google Translate TTS (suara natural) — prioritas 2
 * 3. Web Speech API (browser, offline) — prioritas 3 (fallback)
 *
 * Tetap mempertahankan API voice model (Lidia/Yunxi/Xiaoyi) untuk UI.
 */

export interface VoiceModelOption {
  id: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
  recommended?: boolean;
}

const AUDIO_CMN_BASE =
  'https://cdn.jsdelivr.net/gh/hugolpz/audio-cmn@master/96k/hsk/';

class MandarinSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private selectedModelId: string = 'xiaoxiao';

  public readonly availableModels: VoiceModelOption[] = [
    {
      id: 'xiaoxiao',
      name: 'Lidia AI (Xiaoxiao)',
      description: 'Suara wanita alami, ramah, artikulasi 4 nada jernih',
      gender: 'female',
      recommended: true,
    },
    {
      id: 'yunxi',
      name: 'Laoshi Yunxi',
      description: 'Suara pria hangat, intonasi pengajar resmi standar HSK',
      gender: 'male',
    },
    {
      id: 'xiaoyi',
      name: 'Xiaoyi Santai',
      description: 'Suara wanita ceria dengan tempo santai',
      gender: 'female',
    },
    {
      id: 'standard',
      name: 'Standar Sistem',
      description: 'Mesin sintesis suara bawaan peramban',
      gender: 'female',
    },
  ];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (typeof this.synth.onvoiceschanged !== 'undefined') {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  // ============================================================
  // VOICE MODEL API (untuk UI pemilih voice)
  // ============================================================
  public setVoiceModel(modelId: string): void {
    if (this.availableModels.some((m) => m.id === modelId)) {
      this.selectedModelId = modelId;
    }
  }

  public getVoiceModel(): string {
    return this.selectedModelId;
  }
public testVoice(): void {
  // Uji voice model dengan kalimat sapaan Mandarin
  this.speak('你好，我是丽迪娅老师', 0.85);
}
  // ============================================================
  // SPEAK — 3-tier priority
  // ============================================================
  public async speak(text: string, rate: number = 0.85): Promise<void> {
    if (!text || !text.trim()) return;

    // Prioritas 1: audio-cmn (suara manusia asli) untuk kata tunggal
    if (await this.tryAudioCmn(text)) return;

    // Prioritas 2: Google TTS (natural) untuk kalimat
    if (await this.tryGoogleTTS(text)) return;

    // Prioritas 3: Web Speech (fallback, robot)
    this.speakWithWebSpeech(text, rate);
  }

  public stop(): void {
    this.stopAudio();
    if (this.synth) this.synth.cancel();
  }

  // ============================================================
  // PRIVATE — audio-cmn
  // ============================================================
  private isSingleHanziOrWord(text: string): boolean {
    return /^[\u4e00-\u9fa5]+$/.test(text.trim());
  }

  private async tryAudioCmn(text: string): Promise<boolean> {
    if (!this.isSingleHanziOrWord(text)) return false;

    const trimmed = text.trim();
    const url = `${AUDIO_CMN_BASE}cmn-${encodeURIComponent(trimmed)}.mp3`;

    try {
      this.stopAudio();
      const audio = new Audio(url);
      audio.crossOrigin = 'anonymous';

      // Cek dulu apakah file ada (HEAD request)
      const check = await fetch(url, { method: 'HEAD' });
      if (!check.ok) return false;

      await audio.play();
      this.currentAudio = audio;
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================
  // PRIVATE — Google TTS
  // ============================================================
  private async tryGoogleTTS(text: string): Promise<boolean> {
    try {
      const truncated = text.length > 180 ? text.slice(0, 180) : text;
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        truncated
      )}&tl=zh-CN&client=tw-ob`;

      this.stopAudio();
      const audio = new Audio(url);
      await audio.play();
      this.currentAudio = audio;
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================
  // PRIVATE — Web Speech (fallback)
  // ============================================================
  private loadVoices(): void {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  private getBestMandarinVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) this.loadVoices();
    if (!this.voices.length) return null;

    const zhVoices = this.voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('zh') ||
        v.lang.toLowerCase().includes('cmn') ||
        v.lang.toLowerCase().includes('chinese')
    );

    if (zhVoices.length === 0) return null;

    // Prioritas berdasarkan model yang dipilih
    if (this.selectedModelId === 'xiaoxiao') {
      const m = zhVoices.find(
        (v) =>
          v.name.toLowerCase().includes('xiaoxiao') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('tingting') ||
          v.name.toLowerCase().includes('meijia')
      );
      if (m) return m;
    } else if (this.selectedModelId === 'yunxi') {
      const m = zhVoices.find(
        (v) =>
          v.name.toLowerCase().includes('yunxi') ||
          v.name.toLowerCase().includes('yunjian') ||
          v.name.toLowerCase().includes('kangkang') ||
          v.name.toLowerCase().includes('sin-ji')
      );
      if (m) return m;
    } else if (this.selectedModelId === 'xiaoyi') {
      const m = zhVoices.find(
        (v) =>
          v.name.toLowerCase().includes('xiaoyi') ||
          v.name.toLowerCase().includes('yaoyao') ||
          v.name.toLowerCase().includes('huihui')
      );
      if (m) return m;
    }

    // Fallback: cari voice natural/premium
    const neural = zhVoices.find(
      (v) =>
        (v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('online') ||
          v.name.toLowerCase().includes('google') ||
          v.name.toLowerCase().includes('premium')) &&
        (v.lang === 'zh-CN' || v.lang === 'cmn-Hans-CN')
    );
    if (neural) return neural;

    const zhCn = zhVoices.find(
      (v) => v.lang === 'zh-CN' || v.lang === 'cmn-Hans-CN'
    );
    if (zhCn) return zhCn;

    return zhVoices[0];
  }

  private speakWithWebSpeech(text: string, rate: number): void {
    if (!this.synth) return;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = 1;

    const voice = this.getBestMandarinVoice();
    if (voice) utterance.voice = voice;

    this.synth.speak(utterance);
  }

  private stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}

// Singleton instance
export const speechEngine = new MandarinSpeechEngine();

// Backward-compatible exports
export const speakMandarin = (text: string, rate?: number) =>
  speechEngine.speak(text, rate);

export const stopSpeaking = () => speechEngine.stop();

// Preload voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}