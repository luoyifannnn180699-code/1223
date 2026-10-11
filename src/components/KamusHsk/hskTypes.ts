// src/components/KamusHsk/hskTypes.ts
export interface HskWordForm {
  traditional: string;
  transcriptions: {
    pinyin: string;
    numeric: string;
  };
  meanings: string[];
  classifiers?: string[];
}

export interface HskWord {
  simplified: string;
  radical?: string;
  level: string[];
  frequency?: number;
  pos?: string[];
  forms: HskWordForm[];
}

export interface ContohKalimat {
  kalimat: string;
  pinyin: string;
  arti: string;
}