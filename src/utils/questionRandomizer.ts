import { Question, UserStats } from '../types/nmt';

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
