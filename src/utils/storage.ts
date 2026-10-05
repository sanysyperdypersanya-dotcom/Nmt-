import {
  SubjectId,
  UserStats,
  TestSession,
  UISettings,
  SiteRegistration,
  ConnectedSheetConfig,
} from '../types/nmt';

const STORAGE_KEY = 'nmt_prep_user_stats_v1';
const UI_SETTINGS_KEY = 'nmt_prep_ui_settings_v1';
const REGISTRATIONS_KEY = 'nmt_prep_site_registrations_v1';
const SHEET_CONFIG_KEY = 'nmt_prep_sheet_config_v1';

export function loadSiteRegistrations(): SiteRegistration[] {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SiteRegistration[];
  } catch (e) {
    console.error('Failed to load registrations:', e);
    return [];
  }
}

export function saveSiteRegistrations(registrations: SiteRegistration[]): void {
  try {
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
  } catch (e) {
    console.error('Failed to save registrations:', e);
  }
}

export function loadConnectedSheetConfig(): ConnectedSheetConfig | null {
  try {
    const raw = localStorage.getItem(SHEET_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConnectedSheetConfig;
  } catch (e) {
    console.error('Failed to load sheet config:', e);
    return null;
  }
}

export function saveConnectedSheetConfig(config: ConnectedSheetConfig | null): void {
  try {
    if (!config) {
      localStorage.removeItem(SHEET_CONFIG_KEY);
    } else {
      localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(config));
    }
  } catch (e) {
    console.error('Failed to save sheet config:', e);
  }
}

export const DEFAULT_UI_SETTINGS: UISettings = {
  theme: 'light',
  fontSizeScale: 100,
  fontFamily: 'sans',
  lineSpacing: 'normal',
  layoutDensity: 'comfortable',
  showTopCountdown: true,
  highContrastText: false,
  autoAdvanceOnSingleChoice: false,
};

export function loadUISettings(): UISettings {
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return DEFAULT_UI_SETTINGS;
    return { ...DEFAULT_UI_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load UI settings:', e);
    return DEFAULT_UI_SETTINGS;
  }
}

export function saveUISettings(settings: UISettings): void {
  try {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save UI settings:', e);
  }
}

export const INITIAL_USER_STATS: UserStats = {
  userName: 'Майбутній студент',
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  totalCompletedTests: 0,
  totalQuestionsAnswered: 0,
  totalCorrectAnswers: 0,
  subjectStats: {
    ukr: { testsCompleted: 0, questionsAnswered: 0, correctAnswers: 0, bestNmtScore: 0, avgNmtScore: 0, topicMastery: {} },
    math: { testsCompleted: 0, questionsAnswered: 0, correctAnswers: 0, bestNmtScore: 0, avgNmtScore: 0, topicMastery: {} },
    history: { testsCompleted: 0, questionsAnswered: 0, correctAnswers: 0, bestNmtScore: 0, avgNmtScore: 0, topicMastery: {} },
    eng: { testsCompleted: 0, questionsAnswered: 0, correctAnswers: 0, bestNmtScore: 0, avgNmtScore: 0, topicMastery: {} },
  },
  history: [],
  mistakeQuestionIds: [],
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return checkAndUpdateStreak(INITIAL_USER_STATS);
    const parsed = JSON.parse(raw) as UserStats;
    return checkAndUpdateStreak(parsed);
  } catch (e) {
    console.error('Failed to load user stats from localStorage:', e);
    return INITIAL_USER_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats to localStorage:', e);
  }
}

function checkAndUpdateStreak(stats: UserStats): UserStats {
  const today = new Date().toISOString().split('T')[0];
  if (!stats.lastActiveDate) {
    stats.lastActiveDate = today;
    stats.streakDays = 1;
    return stats;
  }

  if (stats.lastActiveDate === today) {
    // Already logged in today
    return stats;
  }

  const lastDate = new Date(stats.lastActiveDate);
  const currentDate = new Date(today);
  const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    stats.streakDays += 1;
  } else if (diffDays > 1) {
    // Missed a day
    stats.streakDays = 1;
  }
  stats.lastActiveDate = today;
  return stats;
}

export function recordTestSessionResult(stats: UserStats, session: TestSession): UserStats {
  const updated: UserStats = JSON.parse(JSON.stringify(stats));

  // Track mistakes & topic mastery per question's actual subjectId
  session.questions.forEach((q) => {
    const qSubId = q.subjectId;
    const userAns = session.userAnswers[q.id];
    let isCorrect = false;

    if (q.type === 'single') {
      isCorrect = userAns === q.correctOptionId;
    } else if (q.type === 'numeric') {
      if (userAns !== undefined && userAns !== null && userAns !== '') {
        const numVal = parseFloat(String(userAns).replace(',', '.'));
        const targetVal = parseFloat(String(q.correctNumeric).replace(',', '.'));
        isCorrect = Math.abs(numVal - targetVal) < 0.001;
      }
    } else if (q.type === 'matching' && q.correctMatching) {
      let correctMatches = 0;
      Object.entries(q.correctMatching).forEach(([key, val]) => {
        if (userAns && userAns[key] === val) {
          correctMatches++;
        }
      });
      isCorrect = correctMatches === Object.keys(q.correctMatching).length;
    }

    if (!isCorrect) {
      if (!updated.mistakeQuestionIds.includes(q.id)) {
        updated.mistakeQuestionIds.push(q.id);
      }
    } else {
      updated.mistakeQuestionIds = updated.mistakeQuestionIds.filter((id) => id !== q.id);
    }

    // Update topic mastery on the question's own subject
    const topic = q.topic;
    if (!updated.subjectStats[qSubId].topicMastery[topic]) {
      updated.subjectStats[qSubId].topicMastery[topic] = { total: 0, correct: 0 };
    }
    updated.subjectStats[qSubId].topicMastery[topic].total += 1;
    if (isCorrect) {
      updated.subjectStats[qSubId].topicMastery[topic].correct += 1;
    }
  });

  if (session.mode === 'simulation' && session.subjectScores) {
    // Update stats for all subjects included in the NMT simulation
    (Object.keys(session.subjectScores) as SubjectId[]).forEach((sId) => {
      const sScore = session.subjectScores?.[sId];
      if (!sScore) return;
      const subQs = session.questions.filter((q) => q.subjectId === sId);
      const subStats = updated.subjectStats[sId];

      subStats.testsCompleted += 1;
      subStats.questionsAnswered += subQs.length;
      subStats.correctAnswers += sScore.rawPoints;

      if (sScore.nmtScore > subStats.bestNmtScore) {
        subStats.bestNmtScore = sScore.nmtScore;
      }

      if (subStats.avgNmtScore === 0) {
        subStats.avgNmtScore = sScore.nmtScore;
      } else {
        subStats.avgNmtScore = Math.round(
          (subStats.avgNmtScore * (subStats.testsCompleted - 1) + sScore.nmtScore) / subStats.testsCompleted
        );
      }
    });
  } else {
    // Single subject or mistakes test
    const subId = session.subjectId;
    const subStats = updated.subjectStats[subId];
    subStats.testsCompleted += 1;
    subStats.questionsAnswered += session.questions.length;

    const correctCount = session.score.rawPoints;
    subStats.correctAnswers += correctCount;

    if (session.score.nmtScore > subStats.bestNmtScore) {
      subStats.bestNmtScore = session.score.nmtScore;
    }

    if (subStats.avgNmtScore === 0) {
      subStats.avgNmtScore = session.score.nmtScore;
    } else {
      subStats.avgNmtScore = Math.round(
        (subStats.avgNmtScore * (subStats.testsCompleted - 1) + session.score.nmtScore) / subStats.testsCompleted
      );
    }
  }

  // Update global counters
  updated.totalCompletedTests += 1;
  updated.totalQuestionsAnswered += session.questions.length;
  updated.totalCorrectAnswers += session.score.rawPoints;

  // Add to history (keep last 30 tests)
  updated.history.unshift(session);
  if (updated.history.length > 30) {
    updated.history.pop();
  }

  saveUserStats(updated);
  return updated;
}
