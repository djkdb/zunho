import type { Lang, LocalizedText } from './types';

/** Shorthand constructor for bilingual strings used throughout the data files. */
export function L(en: string, ko: string): LocalizedText {
  return { en, ko };
}

export function tr(text: LocalizedText, lang: Lang): string {
  return text[lang] ?? text.en;
}

export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((l) => l?.toLowerCase().startsWith('ko')) ? 'ko' : 'en';
}
