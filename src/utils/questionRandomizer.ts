import { Question, SubjectId, UserStats } from '../types/nmt';

const DECK_STORAGE_KEY = 'nmt_prep_smart_deck_state_v1';

interface QuestionExposureEntry {
  seenCount: number;
  lastSeenStep: number;
}

interface DeckState {
  step: number;
  entries: Record<string, QuestionExposureEntry>;
}

function loadDeckState(): DeckState {
  try {
    const raw = localStorage.getItem(DECK_STORAGE_KEY);
    if (!raw) {
      return { step: 0, entries: {} };
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.entries) {
      return {
        step: Number(parsed.step) || 0,
        entries: parsed.entries,
      };
    }
    return { step: 0, entries: {} };
  } catch {
    return { step: 0, entries: {} };
  }
}

function saveDeckState(state: DeckState): void {
  try {
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save smart deck state:', e);
  }
}

/**
 * Unbiased cryptographic Fisher-Yates shuffle.
 * Guarantees every permutation is equally likely and eliminates V8 Array.sort() bias.
 */
export function fisherYatesShuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  const n = arr.length;
  if (n <= 1) return arr;

  const randomBuffer = new Uint32Array(n);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomBuffer);
  } else {
    for (let i = 0; i < n; i++) {
      randomBuffer[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }

  for (let i = n - 1; i > 0; i--) {
    const j = randomBuffer[i] % (i + 1);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  return arr;
}

function buildRecentHistoryPenalty(userStats?: UserStats): Record<string, number> {
  const penalty: Record<string, number> = {};
  if (userStats && Array.isArray(userStats.history)) {
    userStats.history.slice(0, 10).forEach((session, idx) => {
      const weight = 10 - idx;
      session.questions.forEach((q) => {
        penalty[q.id] = (penalty[q.id] || 0) + weight;
      });
    });
  }
  return penalty;
}

function prioritizePool(
  pool: readonly Question[],
  deck: DeckState,
  recentHistoryPenalty: Record<string, number>
): Question[] {
  // Unbiased Fisher-Yates pre-shuffle so initial file order has zero effect
  const preShuffled = fisherYatesShuffle(pool);

  return [...preShuffled].sort((a, b) => {
    const entryA = deck.entries[a.id] || { seenCount: 0, lastSeenStep: 0 };
    const entryB = deck.entries[b.id] || { seenCount: 0, lastSeenStep: 0 };

    // 1. Fewer times shown comes first
    if (entryA.seenCount !== entryB.seenCount) {
      return entryA.seenCount - entryB.seenCount;
    }

    // 2. Lower recent test history weight comes first
    const penA = recentHistoryPenalty[a.id] || 0;
    const penB = recentHistoryPenalty[b.id] || 0;
    if (penA !== penB) {
      return penA - penB;
    }

    // 3. Longest time since last shown comes first
    if (entryA.lastSeenStep !== entryB.lastSeenStep) {
      return entryA.lastSeenStep - entryB.lastSeenStep;
    }

    return 0;
  });
}

function recordQuestionsShown(deck: DeckState, selected: readonly Question[]): void {
  if (selected.length === 0) return;
  const nextStep = deck.step + 1;
  deck.step = nextStep;
  selected.forEach((q) => {
    const prev = deck.entries[q.id] || { seenCount: 0, lastSeenStep: 0 };
    deck.entries[q.id] = {
      seenCount: prev.seenCount + 1,
      lastSeenStep: nextStep,
    };
  });
  saveDeckState(deck);
}

const MATH_ALGEBRA_TOPICS = new Set([
  'Арифметика та алгебра',
  'Раціональні, ірраціональні та степеневі вирази',
  'Показникові та логарифмічні вирази',
  'Тригонометричні вирази та рівняння',
  'Рівняння та нерівності',
  'Числові послідовності та прогресії',
]);

const MATH_FUNCTIONS_TOPICS = new Set([
  'Функції та їх графіки',
  'Похідна та інтеграл',
  'Теорія ймовірностей',
]);

const MATH_GEOMETRY_TOPICS = new Set([
  'Планіметрія',
  'Стереометрія',
  'Координати та вектори у просторі',
]);

const UKR_EARLY_TOPICS = new Set([
  'Фонетика та наголоси',
  'Орфографія',
  'Лексикологія та фразеологія',
]);

const HISTORY_CHRONOLOGY_ORDER: Record<string, number> = {
  'Стародавня історія України': 1,
  'Русь-Україна': 2,
  'Королівство Руське та литовсько-польська доба': 3,
  'Козацька доба': 4,
  'Гетьманщина у другій половині XVII–XVIII ст.': 5,
  'Українські землі у XIX ст.': 6,
  'Україна на початку XX ст. та Перша світова війна': 7,
  'Українська революція 1917–1921': 8,
  'УСРР у міжвоєнний період (1921–1939)': 9,
  'Україна у Другій світовій': 10,
  'Відновлення незалежності та сучасність': 11,
};

/**
 * Returns the numeric tier index (0..N) that defines the official УЦОЯО NMT position
 * of a question inside a full subject block or full 4-subject NMT simulation:
 *
 * - MATHEMATICS:
 *   0: Single-choice Algebra & Expressions (Questions 1–6)
 *   1: Single-choice Functions, Graphs, Calculus & Probability (Questions 7–10)
 *   2: Single-choice Geometry (Planimetry, Stereometry, Vectors with diagrams) (Questions 11–15)
 *   3: Matching tasks (Логічні пари 1–3 -> А–Д) (Questions 16–18)
 *   4: Open-ended Numeric answer: Algebra, Equations, Progressions, Calculus (Questions 19–22)
 *   5: Open-ended Numeric answer: Geometry & 3D Vectors (Hardest tasks at the very end, Questions 23–25)
 *
 * - UKRAINIAN LANGUAGE:
 *   0: Single-choice Phonetics, Stress, Orthography, Lexicology (Questions 1–10)
 *   1: Single-choice Morphology, Syntax, Punctuation, Direct Speech, Reading (Questions 11–20)
 *   2: Matching tasks (Встановлення відповідності 1–4 -> А–Д) (Questions 21–25)
 *
 * - HISTORY OF UKRAINE:
 *   0..10: Single-choice tasks in chronological order of historical periods
 *   20..30: Matching tasks in chronological order at the end of the block
 *
 * - ENGLISH LANGUAGE:
 *   0: Reading & Comprehension — Matching (Tasks 1, 3, 4: Headings, Multiple Matching, Gapped Text)
 *   1: Reading & Comprehension — Single-choice Long Text Comprehension (Task 2)
 *   2: Use of English — Grammar & Vocabulary Single-choice / Matching
 */
export function getOfficialNmtTier(q: Question): number {
  if (q.subjectId === 'math') {
    if (q.type === 'single') {
      if (MATH_ALGEBRA_TOPICS.has(q.topic)) return 0;
      if (MATH_FUNCTIONS_TOPICS.has(q.topic)) return 1;
      if (MATH_GEOMETRY_TOPICS.has(q.topic)) return 2;
      return 1;
    }
    if (q.type === 'matching') {
      return 3;
    }
    // q.type === 'numeric' (вписна відповідь — завжди в кінці тесту!)
    if (MATH_GEOMETRY_TOPICS.has(q.topic)) {
      return 5; // Складні задачі з геометрії та векторів з вписною відповіддю — у самому кінці
    }
    return 4; // Алгебраїчні завдання з вписною відповіддю — перед геометричними
  }

  if (q.subjectId === 'ukr') {
    if (q.type === 'single') {
      return UKR_EARLY_TOPICS.has(q.topic) ? 0 : 1;
    }
    return 2; // matching at the end
  }

  if (q.subjectId === 'history') {
    const chrono = HISTORY_CHRONOLOGY_ORDER[q.topic] || 6;
    if (q.type === 'single') {
      return chrono;
    }
    return 20 + chrono; // matching at the end in chronological order
  }

  if (q.subjectId === 'eng') {
    if (q.topic === 'Reading & Comprehension') {
      return q.type === 'matching' ? 0 : 1;
    }
    return q.type === 'single' ? 2 : 3;
  }

  return 0;
}

/**
 * Human-readable badge showing which official NMT structural section the current question belongs to.
 */
export function getOfficialNmtSlotBadge(q: Question): string {
  if (q.subjectId === 'math') {
    const tier = getOfficialNmtTier(q);
    switch (tier) {
      case 0:
        return 'Частина 1 · Тестова алгебра (Вибір 1 з 5)';
      case 1:
        return 'Частина 1 · Графіки функцій, похідна та ймовірність';
      case 2:
        return 'Частина 1 · Тестова геометрія з рисунками';
      case 3:
        return 'Частина 2 · Завдання на відповідність (Логічні пари)';
      case 4:
        return 'Частина 3 · Вписна відповідь (Алгебра та аналіз)';
      case 5:
        return 'Частина 3 · Вписна відповідь (Геометрія підвищеної складності)';
      default:
        return 'Блок математики НМТ';
    }
  }

  if (q.subjectId === 'ukr') {
    if (q.type === 'single') {
      return UKR_EARLY_TOPICS.has(q.topic)
        ? 'Частина 1 · Орфоепія, орфографія та лексика'
        : 'Частина 1 · Граматика, синтаксис і пунктуація';
    }
    return 'Частина 2 · Завдання на встановлення відповідності';
  }

  if (q.subjectId === 'history') {
    return q.type === 'single'
      ? 'Частина 1 · Хронологічні тестові завдання'
      : 'Частина 2 · Завдання на встановлення відповідності';
  }

  if (q.subjectId === 'eng') {
    if (q.topic === 'Reading & Comprehension') {
      return q.type === 'matching'
        ? 'Part 1 · Reading: Matching & Gapped Text'
        : 'Part 1 · Reading Comprehension (Multiple Choice)';
    }
    return 'Part 2 · Use of English (Vocabulary & Grammar)';
  }

  return '';
}

/**
 * Builds an authentic NMT subject block of `targetCount` questions:
 * - Uses smart anti-repetition prioritization within each tier so questions rarely repeat.
 * - Strictly preserves the official УЦОЯО NMT structural sequence:
 *   e.g. for Math:
 *     1–6: Single-choice Algebra
 *     7–10: Single-choice Functions & Graphs
 *     11–15: Single-choice Geometry
 *     16–18: Matching tasks
 *     19–25: Harder Open-Ended Numeric Answer tasks at the end (Algebra -> Geometry).
 */
export function buildOfficialNmtSubjectBlock(
  pool: readonly Question[],
  targetCount: number = 25,
  userStats?: UserStats
): Question[] {
  if (pool.length === 0) return [];
  const totalToPick = Math.min(targetCount, pool.length);
  const subId: SubjectId = pool[0].subjectId;

  const deck = loadDeckState();
  const recentHistoryPenalty = buildRecentHistoryPenalty(userStats);

  // Helper to pick up to `quota` prioritized & shuffled questions from a candidate list
  const pickFromBucket = (
    candidates: Question[],
    quota: number,
    alreadyPickedIds: Set<string>
  ): Question[] => {
    const available = candidates.filter((q) => !alreadyPickedIds.has(q.id));
    if (available.length === 0 || quota <= 0) return [];
    const prioritized = prioritizePool(available, deck, recentHistoryPenalty);
    const chosen = fisherYatesShuffle(prioritized.slice(0, Math.min(quota, prioritized.length)));
    chosen.forEach((q) => alreadyPickedIds.add(q.id));
    return chosen;
  };

  const pickedIds = new Set<string>();
  let structuredSelection: Question[] = [];

  if (subId === 'math') {
    const tier0AlgebraSingle = pool.filter((q) => getOfficialNmtTier(q) === 0);
    const tier1FuncSingle = pool.filter((q) => getOfficialNmtTier(q) === 1);
    const tier2GeomSingle = pool.filter((q) => getOfficialNmtTier(q) === 2);
    const tier3Matching = pool.filter((q) => getOfficialNmtTier(q) === 3);
    const tier4AlgebraNumeric = pool.filter((q) => getOfficialNmtTier(q) === 4);
    const tier5GeomNumeric = pool.filter((q) => getOfficialNmtTier(q) === 5);

    // Scale quotas proportionally to totalToPick (baseline 25 questions: 6 + 4 + 5 + 3 + 4 + 3 = 25)
    const scale = totalToPick / 25;
    const q0 = Math.max(1, Math.round(6 * scale));
    const q1 = Math.max(1, Math.round(4 * scale));
    const q2 = Math.max(1, Math.round(5 * scale));
    const q3 = Math.min(tier3Matching.length, Math.max(2, Math.round(3 * scale)));
    const q4 = Math.max(1, Math.round(4 * scale));
    const q5 = Math.max(1, totalToPick - (q0 + q1 + q2 + q3 + q4));

    structuredSelection = [
      ...pickFromBucket(tier0AlgebraSingle, q0, pickedIds),
      ...pickFromBucket(tier1FuncSingle, q1, pickedIds),
      ...pickFromBucket(tier2GeomSingle, q2, pickedIds),
      ...pickFromBucket(tier3Matching, q3, pickedIds),
      ...pickFromBucket(tier4AlgebraNumeric, q4, pickedIds),
      ...pickFromBucket(tier5GeomNumeric, q5, pickedIds),
    ];
  } else if (subId === 'ukr') {
    const tier0EarlySingle = pool.filter((q) => getOfficialNmtTier(q) === 0);
    const tier1GrammarSingle = pool.filter((q) => getOfficialNmtTier(q) === 1);
    const tier2Matching = pool.filter((q) => getOfficialNmtTier(q) === 2);

    const scale = totalToPick / 25;
    const q0 = Math.max(1, Math.round(10 * scale));
    const q1 = Math.max(1, Math.round(10 * scale));
    const q2 = Math.max(1, totalToPick - (q0 + q1));

    structuredSelection = [
      ...pickFromBucket(tier0EarlySingle, q0, pickedIds),
      ...pickFromBucket(tier1GrammarSingle, q1, pickedIds),
      ...pickFromBucket(tier2Matching, q2, pickedIds),
    ];
  } else if (subId === 'history') {
    const singlePool = pool.filter((q) => q.type === 'single');
    const matchingPool = pool.filter((q) => q.type === 'matching');

    const scale = totalToPick / 25;
    const qSingle = Math.max(1, Math.round(20 * scale));
    const qMatching = Math.max(1, totalToPick - qSingle);

    const chosenSingles = pickFromBucket(singlePool, qSingle, pickedIds);
    const chosenMatchings = pickFromBucket(matchingPool, qMatching, pickedIds);

    structuredSelection = [...chosenSingles, ...chosenMatchings];
  } else if (subId === 'eng') {
    const readingMatching = pool.filter((q) => getOfficialNmtTier(q) === 0);
    const readingSingle = pool.filter((q) => getOfficialNmtTier(q) === 1);
    const useOfEngSingle = pool.filter((q) => getOfficialNmtTier(q) === 2);
    const useOfEngMatching = pool.filter((q) => getOfficialNmtTier(q) === 3);

    const scale = totalToPick / 25;
    const q0 = Math.min(readingMatching.length, Math.max(2, Math.round(4 * scale)));
    const q1 = Math.min(readingSingle.length, Math.max(2, Math.round(5 * scale)));
    const q3 = Math.min(useOfEngMatching.length, Math.max(1, Math.round(2 * scale)));
    const q2 = Math.max(1, totalToPick - (q0 + q1 + q3));

    structuredSelection = [
      ...pickFromBucket(readingMatching, q0, pickedIds),
      ...pickFromBucket(readingSingle, q1, pickedIds),
      ...pickFromBucket(useOfEngSingle, q2, pickedIds),
      ...pickFromBucket(useOfEngMatching, q3, pickedIds),
    ];
  }

  // If structuredSelection has fewer than totalToPick (e.g. when a bucket had fewer items than quota),
  // top up from remaining unseen questions in pool
  if (structuredSelection.length < totalToPick) {
    const remainingNeeded = totalToPick - structuredSelection.length;
    const topUp = pickFromBucket([...pool], remainingNeeded, pickedIds);
    structuredSelection.push(...topUp);
  } else if (structuredSelection.length > totalToPick) {
    structuredSelection = structuredSelection.slice(0, totalToPick);
  }

  // Stable sort by official NMT tier so that even topped-up questions strictly sit in their proper NMT part
  // (e.g., all single-choice Algebra first, then Functions/Graphs, then Geometry, then Matching, and Numeric at the very end)
  const orderedFinal = [...structuredSelection].sort(
    (a, b) => getOfficialNmtTier(a) - getOfficialNmtTier(b)
  );

  recordQuestionsShown(deck, orderedFinal);
  return orderedFinal;
}

/**
 * Selects `count` questions from `pool` using a persistent anti-repetition deck:
 * 1. Questions that have been shown the fewest times (or never shown) are prioritized first.
 * 2. Questions shown in recent tests have a cooldown penalty so they are pushed to the back.
 * 3. Ties are broken by an unbiased Fisher-Yates shuffle so static file order never leaks through.
 * 4. The final chosen subset is shuffled again with Fisher-Yates and recorded in the deck state.
 */
export function pickSmartShuffledQuestions(
  pool: readonly Question[],
  count?: number,
  userStats?: UserStats
): Question[] {
  if (pool.length === 0) return [];
  const targetCount = count !== undefined ? Math.min(count, pool.length) : pool.length;

  const deck = loadDeckState();
  const recentHistoryPenalty = buildRecentHistoryPenalty(userStats);
  const prioritized = prioritizePool(pool, deck, recentHistoryPenalty);

  const selected = fisherYatesShuffle(prioritized.slice(0, targetCount));
  recordQuestionsShown(deck, selected);

  return selected;
}

/**
 * Picks `targetCount` questions balanced proportionally across `topics` from `pool`,
 * prioritizing unseen / least-recently-seen questions within each topic, and then
 * permanently shuffles the resulting test (or preserves topic grouping if `shuffleFinalOrder` is false).
 */
export function pickBalancedSmartTopicQuestions(
  pool: readonly Question[],
  topics: readonly string[],
  targetCount: number,
  shuffleFinalOrder: boolean = true,
  userStats?: UserStats
): Question[] {
  if (pool.length === 0 || topics.length === 0 || targetCount < 1) return [];

  const deck = loadDeckState();
  const recentHistoryPenalty = buildRecentHistoryPenalty(userStats);

  // Randomize topic order for round-robin so the first topic doesn't always get the extra question
  const topicOrder = shuffleFinalOrder ? fisherYatesShuffle(topics) : [...topics];

  const byTopic: Record<string, Question[]> = {};
  topicOrder.forEach((t) => {
    const topicQs = pool.filter((q) => q.topic === t);
    byTopic[t] = prioritizePool(topicQs, deck, recentHistoryPenalty);
  });

  const picked: Question[] = [];
  let round = 0;
  const maxToPick = Math.min(targetCount, pool.length);

  while (picked.length < maxToPick) {
    let addedInRound = false;
    for (const t of topicOrder) {
      if (picked.length >= maxToPick) break;
      const candidate = byTopic[t]?.[round];
      if (candidate) {
        picked.push(candidate);
        addedInRound = true;
      }
    }
    if (!addedInRound) break;
    round++;
  }

  const finalQuestions = shuffleFinalOrder ? fisherYatesShuffle(picked) : picked;
  recordQuestionsShown(deck, finalQuestions);

  return finalQuestions;
}
