import { SubjectId } from '../types/nmt';

export const SUBJECT_METADATA: Record<SubjectId, {
  name: string;
  shortName: string;
  maxOfficialPoints: number;
  testDurationMinutes: number;
  badgeColor: string;
  topics: string[];
}> = {
  ukr: {
    name: 'Українська мова',
    shortName: 'Укр. мова',
    maxOfficialPoints: 45,
    testDurationMinutes: 60,
    badgeColor: 'blue',
    topics: [
      'Фонетика та наголоси',
      'Орфографія',
      'Лексикологія та фразеологія',
      'Будова слова та словотвір',
      'Морфологія',
      'Дієслово, дієприкметник і дієприслівник',
      'Службові частини мови та правопис НЕ',
      'Словосполучення і просте речення',
      'Синтаксис та пунктуація',
      'Пряма мова, цитування та діалог',
      'Робота з текстом',
    ],
  },
  math: {
    name: 'Математика',
    shortName: 'Математика',
    maxOfficialPoints: 32,
    testDurationMinutes: 60,
    badgeColor: 'emerald',
    topics: [
      'Арифметика та алгебра',
      'Раціональні, ірраціональні та степеневі вирази',
      'Показникові та логарифмічні вирази',
      'Тригонометричні вирази та рівняння',
      'Функції та їх графіки',
      'Рівняння та нерівності',
      'Числові послідовності та прогресії',
      'Планіметрія',
      'Стереометрія',
      'Координати та вектори у просторі',
      'Похідна та інтеграл',
      'Теорія ймовірностей',
    ],
  },
  history: {
    name: 'Історія України',
    shortName: 'Історія',
    maxOfficialPoints: 54,
    testDurationMinutes: 60,
    badgeColor: 'amber',
    topics: [
      'Стародавня історія України',
      'Русь-Україна',
      'Королівство Руське та литовсько-польська доба',
      'Козацька доба',
      'Гетьманщина у другій половині XVII–XVIII ст.',
      'Українські землі у XIX ст.',
      'Україна на початку XX ст. та Перша світова війна',
      'Українська революція 1917–1921',
      'УСРР у міжвоєнний період (1921–1939)',
      'Україна у Другій світовій',
      'Відновлення незалежності та сучасність',
    ],
  },
  eng: {
    name: 'Англійська мова',
    shortName: 'Англійська',
    maxOfficialPoints: 32,
    testDurationMinutes: 60,
    badgeColor: 'violet',
    topics: [
      'Reading & Comprehension',
      'Grammar: Tenses & Voice',
      'Conditionals & Modals',
      'Gerund, Infinitive & Participles',
      'Pronouns, Quantifiers & Determiners',
      'Adjectives, Adverbs & Comparisons',
      'Relative Clauses & Conjunctions',
      'Vocabulary & Phrasal Verbs',
      'Prepositions & Collocations',
      'Use of English: Cloze & Word Formation',
    ],
  },
};

/**
 * Converts raw points to NMT scale (100 - 200) following official Ukrainian Center for
 * Educational Quality Assessment (УЦОЯО) translation methodology.
 */
export function calculateNmtScore(rawPoints: number, maxRawPoints: number, subjectId: SubjectId): number {
  if (maxRawPoints <= 0) return 100;
  if (rawPoints <= 0) return 100;

  // Normalized percentage
  const ratio = Math.min(1, Math.max(0, rawPoints / maxRawPoints));

  if (ratio === 1) return 200;
  if (ratio < 0.15) {
    // Under passing threshold
    return Math.round(100 + ratio * 100);
  }

  // Official curve: s-curve from 100 to 200
  // 15% ratio translates to ~100
  // 50% ratio translates to ~145-150
  // 80% ratio translates to ~175-180
  // 100% ratio translates to 200
  const normalized = (ratio - 0.15) / 0.85;
  const score = 100 + Math.round(normalized * 100);
  return Math.min(200, Math.max(100, score));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getScoreDescriptor(score: number): { label: string; textClass: string; desc: string } {
  if (score >= 190) return { label: 'Відмінно', textClass: 'text-emerald-700 font-semibold', desc: 'Високий шанс вступити на бюджет у будь-який топ-ВНЗ' };
  if (score >= 175) return { label: 'Дуже добре', textClass: 'text-emerald-600 font-semibold', desc: 'Гарний конкурентний результат для більшості спеціальностей' };
  if (score >= 150) return { label: 'Добре', textClass: 'text-zinc-800 font-medium', desc: 'Впевнений прохідний рівень, є простір для підтягування окремих тем' };
  if (score >= 130) return { label: 'Задовільно', textClass: 'text-amber-700 font-medium', desc: 'Рекомендуємо пройти роботу над помилками та повторити теорію' };
  return { label: 'Потребує підготовки', textClass: 'text-rose-700 font-medium', desc: 'Зверніть увагу на базові теми та систематичні тренування' };
}
