export type SubjectId = 'ukr' | 'math' | 'history' | 'eng';

export type QuestionType = 'single' | 'matching' | 'numeric';

export interface SingleOption {
  id: string; // 'A', 'B', 'V', 'H', 'D' or 'A', 'B', 'C', 'D'
  text: string;
}

export interface MatchingItem {
  id: string;
  num: number;
  text: string;
}

export interface MatchingChoice {
  id: string;
  letter: string;
  text: string;
}

export interface Question {
  id: string;
  subjectId: SubjectId;
  topic: string;
  yearOrSource: string;
  title?: string;
  text: string;
  context?: string;
  type: QuestionType;
  options?: SingleOption[];
  correctOptionId?: string;
  // Matching format: 1-4 with A-D
  matchingLeft?: MatchingItem[];
  matchingRight?: MatchingChoice[];
  correctMatching?: Record<string, string>; // e.g. { "1": "В", "2": "А", "3": "Д", "4": "Б" }
  // Numeric format for Math
  correctNumeric?: number | string;
  numericTolerance?: number;
  maxPoints: number;
  explanation: string;
  formulaNote?: string;
  diagramId?: string;
}

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  shortName: string;
  description: string;
  color: string;
  iconName: string;
  maxOfficialPoints: number;
  testDurationMinutes: number;
  topics: string[];
}

export interface SubjectScoreBreakdown {
  rawPoints: number;
  maxRawPoints: number;
  percentage: number;
  nmtScore: number; // 100 - 200
}

export interface TestTimeConfig {
  isTimed: boolean;
  timeLimitMinutes: number; // used when isTimed === true
}

export interface TestSession {
  id: string;
  subjectId: SubjectId;
  title: string;
  mode: 'full' | 'blitz' | 'topic' | 'mistakes' | 'simulation';
  topicFilter?: string;
  questions: Question[];
  userAnswers: Record<string, any>;
  flaggedQuestionIds: string[];
  timeSpentSeconds: number;
  isTimed: boolean;
  timeLimitSeconds?: number;
  timeExpired?: boolean;
  simulationStructure?: 'two-stage' | 'all-at-once';
  subjectScores?: Partial<Record<SubjectId, SubjectScoreBreakdown>>;
  completedAt?: string;
  isCompleted: boolean;
  score: SubjectScoreBreakdown;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontFamilyMode = 'sans' | 'serif' | 'mono';
export type LineSpacingMode = 'normal' | 'relaxed' | 'loose';
export type LayoutDensityMode = 'compact' | 'comfortable' | 'spacious';

export interface UISettings {
  theme: ThemeMode; // 'light' | 'dark' | 'system'
  fontSizeScale: number; // e.g., 85, 100, 115, 130, 145 (%)
  fontFamily: FontFamilyMode;
  lineSpacing: LineSpacingMode;
  layoutDensity: LayoutDensityMode;
  showTopCountdown: boolean;
  highContrastText: boolean;
  autoAdvanceOnSingleChoice: boolean;
}

export interface UserStats {
  userName: string;
  streakDays: number;
  lastActiveDate: string;
  totalCompletedTests: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  subjectStats: Record<SubjectId, {
    testsCompleted: number;
    questionsAnswered: number;
    correctAnswers: number;
    bestNmtScore: number;
    avgNmtScore: number;
    topicMastery: Record<string, { total: number; correct: number }>;
  }>;
  history: TestSession[];
  mistakeQuestionIds: string[];
}

export interface SiteRegistration {
  id: string;
  registeredAt: string;
  fullName: string;
  email: string;
  phone?: string;
  schoolOrCity: string;
  targetScore: number;
  pinCode?: string;
  questionsAnswered: number;
  stats: UserStats;
}



