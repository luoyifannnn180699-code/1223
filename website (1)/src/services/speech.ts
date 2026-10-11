/**
 * Enhanced Mandarin Speech Synthesis Engine (Web Speech API)
 * Optimised for Mandarin (zh-CN) pronunciation, tone clarity, natural inflection,
 * and learner-friendly cadence with neural voice prioritization.
 */

export interface VoiceModelOption {
  id: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
  recommended?: boolean;
}

class MandarinSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private selectedModelId = 'xiaoxiao'; // 'xiaoxiao' | 'yunxi' | 'xiaoyi' | 'standard'

  public readonly availableModels: VoiceModelOption[] = [
    {
      id: 'xiaoxiao',
      name: 'Lidia AI (Xiaoxiao)',
      description: 'Suara wanita alami, ramah, artikulasi 4 nada jernih (Rekomendasi Pemula)',
      gender: 'female',
      recommended: true
    },
    {
      id: 'yunxi',
      name: 'Laoshi Yunxi',
      description: 'Suara pria hangat, intonasi pengajar resmi standar HSK Hanban',
      gender: 'male'
    },
    {
      id: 'xiaoyi',
      name: 'Xiaoyi Santai',
      description: 'Suara wanita ceria dengan tempo santai untuk dialog sehari-hari',
      gender: 'female'
    },
    {
      id: 'standard',
      name: 'Standar Sistem',
      description: 'Mesin sintesis suara bawaan peramban',
      gender: 'female'
    }
  ];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public setVoiceModel(modelId: string) {
    if (this.availableModels.some((m) => m.id === modelId)) {
      this.selectedModelId = modelId;
    }
  }

  public getVoiceModel(): string {
    return this.selectedModelId;
  }

  private getBestMandarinVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) this.loadVoices();
    if (!this.voices.length) return null;

    // Filter Chinese voices (zh-CN, zh-HK, zh-TW, cmn)
    const zhVoices = this.voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('zh') ||
        v.lang.toLowerCase().includes('cmn') ||
        v.lang.toLowerCase().includes('chinese')
    );

    if (zhVoices.length === 0) return null;

    // 1. Try to find user-selected model
    if (this.selectedModelId === 'xiaoxiao') {
      const match = zhVoices.find(
        (v) =>
          v.name.toLowerCase().includes('xiaoxiao') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('tingting') ||
          v.name.toLowerCase().includes('meijia')
      );
      if (match) return match;
    } else if (this.selectedModelId === 'yunxi') {
      const match = zhVoices.find(
        (v) =>
          v.name.toLowerCase().includes('yunxi') ||
          v.name.toLowerCase().includes('yunjian') ||
          v.name.toLowerCase().includes('kangkang') ||
          v.name.toLowerCase().includes('sin-ji')
      );
      if (match) return match;
    } else if (this.selectedModelId === 'xiaoyi') {
      const match = zhVoices.find(
        (v) =>
          v.name.toLowerCase().includes('xiaoyi') ||
          v.name.toLowerCase().includes('yaoyao') ||
          v.name.toLowerCase().includes('huihui')
      );
      if (match) return match;
    }

    // 2. High priority fallback: Natural or Online Chinese voices
    const neuralVoice = zhVoices.find(
      (v) =>
        (v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('online') ||
          v.name.toLowerCase().includes('google') ||
          v.name.toLowerCase().includes('premium')) &&
        (v.lang === 'zh-CN' || v.lang === 'cmn-Hans-CN')
    );
    if (neuralVoice) return neuralVoice;

    // 3. Exact zh-CN match
    const zhCnVoice = zhVoices.find((v) => v.lang === 'zh-CN' || v.lang === 'cmn-Hans-CN');
    if (zhCnVoice) return zhCnVoice;

    return zhVoices[0];
  }

  /**
   * Cleans and formats Mandarin text to enforce clear tone intervals
   */
  private prepareTextForLearners(text: string): string {
    // Strip HTML or markdown tags if any
    let clean = text.replace(/<[^>]*>?/gm, '').trim();
    // Add micro-pause spacing after commas and semicolons for tone digestion
    clean = clean.replace(/([，,])/g, '$1 ');
    return clean;
  }

  speak(text: string, speed = 0.8, onEnd?: () => void) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      if (onEnd) onEnd();
      return;
    }

    this.stop();

    const preparedText = this.prepareTextForLearners(text);
    const utterance = new SpeechSynthesisUtterance(preparedText);
    const voice = this.getBestMandarinVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'zh-CN';
    }

    // Learner-friendly speed control (0.6x - 1.2x)
    utterance.rate = Math.max(0.5, Math.min(1.2, speed));

    // Pitch tuning: slightly elevated for clear, cheerful female tone or balanced male tone
    if (this.selectedModelId === 'yunxi') {
      utterance.pitch = 0.95;
    } else if (this.selectedModelId === 'xiaoyi') {
      utterance.pitch = 1.05;
    } else {
      utterance.pitch = 1.02; // Xiaoxiao / default
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  testVoice() {
    const testSample =
      this.selectedModelId === 'yunxi'
        ? '你好！我是云希老师。欢迎来到汉语课堂，让我们一起努力学习！'
        : '你好！我是丽迪娅。欢迎学习中文，跟我一起大声读出来吧！';
    this.speak(testSample, 0.75);
  }
}

export const speechEngine = new MandarinSpeechEngine();
