/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  SubjectId,
  TestSession,
  UserStats,
  UISettings,
  Question,
  SiteRegistration,
} from './types/nmt';
import { NMT_QUESTIONS } from './data/questions';
import {
  pickSmartShuffledQuestions,
  buildOfficialNmtSubjectBlock,
} from './utils/questionRandomizer';
import { getCurrentNmtYear } from './utils/scoring';
import {
  loadUserStats,
  saveUserStats,
  recordTestSessionResult,
  loadUISettings,
  saveUISettings,
  loadSiteRegistrations,
  saveSiteRegistrations,
  loadActiveAccountId,
  saveActiveAccountId,
} from './utils/storage';
import { SoundscapeId, ambientAudio } from './utils/ambientAudio';

import { HeaderTimer } from './components/HeaderTimer';
import { SubjectSelector } from './components/SubjectSelector';
import { TestRunner } from './components/TestRunner';
import { TestResultsModal } from './components/TestResultsModal';
import { PersonalStatsView } from './components/PersonalStatsView';
import { ReferenceModal } from './components/ReferenceModal';
import { InterfaceSettingsModal } from './components/InterfaceSettingsModal';
import { AmbientZenBar } from './components/AmbientZenBar';
import { ParticipantRegistrationView } from './components/ParticipantRegistrationView';

import {
  LayoutGrid,
  BarChart2,
  BookOpen,
  Sliders,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export default function App() {
  const nmtYear = getCurrentNmtYear();
  const [registrations, setRegistrations] = useState<SiteRegistration[]>(() =>
    loadSiteRegistrations(loadUserStats())
  );
  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
    const savedId = loadActiveAccountId();
    const initialRegs = loadSiteRegistrations(loadUserStats());
    if (savedId && initialRegs.some((r) => r.id === savedId)) {
      return savedId;
    }
    return initialRegs[0]?.id || '';
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const savedId = loadActiveAccountId();
    const initialRegs = loadSiteRegistrations(loadUserStats());
    const found =
      initialRegs.find((r) => r.id === savedId) || initialRegs[0];
    return found ? found.stats : loadUserStats();
  });

  const [uiSettings, setUiSettings] = useState<UISettings>(loadUISettings);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'subjects' | 'stats' | 'registration'>('subjects');

  // Background Sounds & Zen Mode state
  const [activeSound, setActiveSound] = useState<SoundscapeId>('off');
  const [soundVolume, setSoundVolume] = useState<number>(0.35);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // User preference: whether tests are timed or untimed
  const [isTimedDefault, setIsTimedDefault] = useState<boolean>(true);
  const [customSingleMinutes, setCustomSingleMinutes] = useState<number>(60);

  // Currently running interactive test
  const [activeTestSession, setActiveTestSession] = useState<TestSession | null>(null);
  const [confirmExitTest, setConfirmExitTest] = useState<boolean>(false);

  // Completed test modal review
  const [reviewSession, setReviewSession] = useState<TestSession | null>(null);

  // Quick Reference Sheet modal
  const [referenceSubject, setReferenceSubject] = useState<SubjectId | null>(null);

  // Sync user stats to local storage AND into the currently active account's isolated stats
  useEffect(() => {
    saveUserStats(userStats);
    setRegistrations((prev) =>
      prev.map((reg) =>
        reg.id === activeAccountId
          ? {
              ...reg,
              fullName: userStats.userName,
              questionsAnswered: userStats.totalQuestionsAnswered,
              stats: userStats,
            }
          : reg
      )
    );
  }, [userStats, activeAccountId]);

  // Sync registrations to local storage
  useEffect(() => {
    saveSiteRegistrations(registrations);
  }, [registrations]);

  // Sync active account ID to local storage
  useEffect(() => {
    saveActiveAccountId(activeAccountId);
  }, [activeAccountId]);

  const handleSwitchAccount = (account: SiteRegistration) => {
    setActiveAccountId(account.id);
    setUserStats(account.stats);
  };

  const handleAddRegistration = (newReg: SiteRegistration, switchImmediately: boolean) => {
    setRegistrations((prev) => [newReg, ...prev]);
    if (switchImmediately) {
      setActiveAccountId(newReg.id);
      setUserStats(newReg.stats);
    }
  };

  const handleDeleteRegistration = (id: string) => {
    setRegistrations((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      if (id === activeAccountId && remaining.length > 0) {
        setActiveAccountId(remaining[0].id);
        setUserStats(remaining[0].stats);
      }
      return remaining;
    });
  };

  // Apply and persist UI settings (Theme: light/dark/system, Font Scale, Font Family, Line Spacing)
  useEffect(() => {
    saveUISettings(uiSettings);

    const root = document.documentElement;
    root.style.fontSize = `${uiSettings.fontSizeScale}%`;
    root.dataset.font = uiSettings.fontFamily;
    root.dataset.leading = uiSettings.lineSpacing;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (uiSettings.theme === 'dark') {
      applyTheme(true);
    } else if (uiSettings.theme === 'light') {
      applyTheme(false);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [uiSettings]);

  // Cleanup audio on unmount & sync document title with dynamic NMT year
  useEffect(() => {
    document.title = `НМТ ${nmtYear} Тренажер — Тести та Персональна Статистика`;
    return () => {
      ambientAudio.stop();
    };
  }, [nmtYear]);

  // Handler to start a single-subject test (Full NMT variant, Blitz of 5 questions, or single Topic test)
  const handleStartTest = (
    subjectId: SubjectId,
    mode: 'full' | 'blitz' | 'topic',
    topicFilter?: string,
    overrideTimed?: boolean,
    overrideMinutes?: number
  ) => {
    const subjectPool = NMT_QUESTIONS.filter((q) => q.subjectId === subjectId);
    let pool: Question[] = [];

    if (mode === 'topic' && topicFilter) {
      const topicPool = subjectPool.filter((q) => q.topic === topicFilter);
      pool = pickSmartShuffledQuestions(topicPool, undefined, userStats);
    } else if (mode === 'blitz') {
      // Strictly 5 smart-shuffled questions with anti-repetition cooldown
      pool = pickSmartShuffledQuestions(subjectPool, 5, userStats);
    } else {
      // Official 25-question NMT block variant: smart anti-repetition within official NMT structural order
      // (e.g. Math: 1-6 Algebra single -> Functions/Graphs -> Geometry -> Matching -> Open-ended Numeric at the end)
      pool = buildOfficialNmtSubjectBlock(subjectPool, 25, userStats);
    }

    if (pool.length === 0) return;

    const useTimed = overrideTimed !== undefined ? overrideTimed : isTimedDefault;
    const durationMins =
      overrideMinutes !== undefined
        ? overrideMinutes
        : mode === 'blitz'
        ? 5
        : mode === 'topic'
        ? 10
        : customSingleMinutes;

    const title =
      mode === 'full'
        ? `Демонстраційний варіант НМТ (${pool.length} завдань)`
        : mode === 'blitz'
        ? `Бліц-тест (5 завдань)`
        : `Тема: ${topicFilter}`;

    const newSession: TestSession = {
      id: `test-${Date.now()}`,
      subjectId,
      title,
      mode,
      topicFilter,
      questions: pool,
      userAnswers: {},
      flaggedQuestionIds: [],
      timeSpentSeconds: 0,
      isTimed: useTimed,
      timeLimitSeconds: durationMins * 60,
      isCompleted: false,
      score: {
        rawPoints: 0,
        maxRawPoints: pool.reduce((acc, q) => acc + q.maxPoints, 0),
        percentage: 0,
        nmtScore: 100,
      },
    };

    setConfirmExitTest(false);
    setActiveTestSession(newSession);
    setActiveTab('subjects');
  };

  // Handler to start Custom Multi-Topic Test from TopicTestBuilder (1 to 32 questions)
  const handleStartCustomTopicTest = (options: {
    subjectId: SubjectId;
    selectedTopics: string[];
    questions: Question[];
    isTimed: boolean;
    durationMinutes: number;
    enterZenMode: boolean;
  }) => {
    const { subjectId, selectedTopics, questions, isTimed, durationMinutes, enterZenMode } =
      options;
    if (questions.length === 0) return;

    const topicsSummary =
      selectedTopics.length === 1
        ? selectedTopics[0]
        : `${selectedTopics.length} обраних тем`;

    const newSession: TestSession = {
      id: `custom-${Date.now()}`,
      subjectId,
      title: `Конструктор (${questions.length} пит. · ${topicsSummary})`,
      mode: 'topic',
      topicFilter: topicsSummary,
      questions,
      userAnswers: {},
      flaggedQuestionIds: [],
      timeSpentSeconds: 0,
      isTimed,
      timeLimitSeconds: durationMinutes * 60,
      isCompleted: false,
      score: {
        rawPoints: 0,
        maxRawPoints: questions.reduce((acc, q) => acc + q.maxPoints, 0),
        percentage: 0,
        nmtScore: 100,
      },
    };

    if (enterZenMode) {
      setIsZenMode(true);
    }

    setConfirmExitTest(false);
    setActiveTestSession(newSession);
    setActiveTab('subjects');
  };

  // Handler to start Full 4-Subject NMT Simulation (Official NMT order within each subject block)
  const handleStartSimulation = (options: {
    isTimed: boolean;
    durationMinutes: number;
    structure: 'two-stage' | 'all-at-once';
    questionsPerSubject?: number;
  }) => {
    const perSub = options.questionsPerSubject || 25;
    const orderedSubjects: SubjectId[] = ['ukr', 'math', 'history', 'eng'];
    const pool = orderedSubjects.flatMap((sId) => {
      const subPool = NMT_QUESTIONS.filter((q) => q.subjectId === sId);
      return buildOfficialNmtSubjectBlock(subPool, perSub, userStats);
    });

    if (pool.length === 0) return;

    const newSession: TestSession = {
      id: `sim-${Date.now()}`,
      subjectId: 'ukr',
      title:
        options.structure === 'two-stage'
          ? `Повна симуляція НМТ (${pool.length} пит. · 2 етапи)`
          : `Повна симуляція НМТ (${pool.length} пит. · 4 блоки)`,
      mode: 'simulation',
      simulationStructure: options.structure,
      questions: pool,
      userAnswers: {},
      flaggedQuestionIds: [],
      timeSpentSeconds: 0,
      isTimed: options.isTimed,
      timeLimitSeconds: options.durationMinutes * 60,
      isCompleted: false,
      score: {
        rawPoints: 0,
        maxRawPoints: pool.reduce((acc, q) => acc + q.maxPoints, 0),
        percentage: 0,
        nmtScore: 100,
      },
    };

    setConfirmExitTest(false);
    setActiveTestSession(newSession);
    setActiveTab('subjects');
  };

  // Handler for mistakes practice
  const handleStartMistakesTest = () => {
    const mistakeIds = userStats.mistakeQuestionIds;
    if (mistakeIds.length === 0) return;

    const rawPool = NMT_QUESTIONS.filter((q) => mistakeIds.includes(q.id));
    const pool = pickSmartShuffledQuestions(rawPool, undefined, userStats);
    if (pool.length === 0) return;

    const firstSub = pool[0].subjectId;
    const newSession: TestSession = {
      id: `mistakes-${Date.now()}`,
      subjectId: firstSub,
      title: `Робота над помилками (${pool.length} завдань)`,
      mode: 'mistakes',
      questions: pool,
      userAnswers: {},
      flaggedQuestionIds: [],
      timeSpentSeconds: 0,
      isTimed: isTimedDefault,
      timeLimitSeconds: Math.max(10, pool.length * 3) * 60,
      isCompleted: false,
      score: {
        rawPoints: 0,
        maxRawPoints: pool.reduce((acc, q) => acc + q.maxPoints, 0),
        percentage: 0,
        nmtScore: 100,
      },
    };

    setConfirmExitTest(false);
    setActiveTestSession(newSession);
  };

  // Handler when a test is finished
  const handleFinishTest = (completedSession: TestSession) => {
    const updatedStats = recordTestSessionResult(userStats, completedSession);
    setUserStats(updatedStats);
    setActiveTestSession(null);
    setReviewSession(completedSession);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans selection:bg-zinc-200">
      {/* 1. IF ZEN MODE IS ACTIVE: Minimalist Zen Control Bar */}
      {isZenMode ? (
        <div className="bg-white border-b border-zinc-200 px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Режим Дзен · Простір глибокої концентрації</span>
            </div>

            <AmbientZenBar
              activeSound={activeSound}
              soundVolume={soundVolume}
              onChangeSound={setActiveSound}
              onChangeVolume={setSoundVolume}
              isZenMode={isZenMode}
              onToggleZenMode={() => setIsZenMode(false)}
              uiSettings={uiSettings}
              onUpdateUISettings={setUiSettings}
            />
          </div>
        </div>
      ) : (
        /* STANDARD HEADER: SAMOGO VERKHU CHAS + QUICK INTERFACE CONTROLS */
        <>
          <HeaderTimer
            streakDays={userStats.streakDays}
            totalAnswered={userStats.totalQuestionsAnswered}
            userName={userStats.userName}
            uiSettings={uiSettings}
            onUpdateUISettings={setUiSettings}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
            onOpenRegistrationTab={() => setActiveTab('registration')}
            registrations={registrations}
            activeAccountId={activeAccountId}
            onQuickSwitchAccount={handleSwitchAccount}
          />

          {/* Navigation Sub-Header with Ambient Sounds & Zen Mode */}
          {!activeTestSession && (
            <div className="border-b border-zinc-200 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('subjects')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === 'subjects'
                        ? 'border-zinc-950 text-zinc-950'
                        : 'border-transparent text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>4 Блоки, Конструктор та Симуляція</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('stats')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === 'stats'
                        ? 'border-zinc-950 text-zinc-950'
                        : 'border-transparent text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Персональна статистика</span>
                    {userStats.totalCompletedTests > 0 && (
                      <span className="font-mono text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded">
                        {userStats.totalCompletedTests}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('registration')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                      activeTab === 'registration'
                        ? 'border-zinc-950 text-zinc-950'
                        : 'border-transparent text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Акаунти учасників</span>
                    {registrations.length > 0 && (
                      <span className="font-mono text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded">
                        {registrations.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 py-2">
                  {/* Ambient Sounds & Zen Mode Controls */}
                  <AmbientZenBar
                    activeSound={activeSound}
                    soundVolume={soundVolume}
                    onChangeSound={setActiveSound}
                    onChangeVolume={setSoundVolume}
                    isZenMode={isZenMode}
                    onToggleZenMode={() => setIsZenMode(true)}
                    uiSettings={uiSettings}
                    onUpdateUISettings={setUiSettings}
                  />

                  <button
                    type="button"
                    onClick={() => setReferenceSubject('math')}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-zinc-800 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Теорія та Довідник</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Body */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 ${
          isZenMode
            ? 'py-8 sm:py-12 max-w-4xl'
            : uiSettings.layoutDensity === 'compact'
            ? 'py-4'
            : uiSettings.layoutDensity === 'spacious'
            ? 'py-10'
            : 'py-6 sm:py-8'
        }`}
      >
        {/* If taking a test right now */}
        {activeTestSession ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {confirmExitTest ? (
                <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs">
                  <span className="text-zinc-800 font-medium">
                    Вийти з тесту? Поточний прогрес буде скасовано.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTestSession(null);
                      setConfirmExitTest(false);
                    }}
                    className="px-2.5 py-1 bg-zinc-900 text-white rounded font-semibold"
                  >
                    Так, вийти
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmExitTest(false)}
                    className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-700 rounded font-medium"
                  >
                    Скасувати
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmExitTest(true)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1"
                >
                  ← Перервати та повернутись
                </button>
              )}

              {!isZenMode && (
                <div className="flex items-center gap-2">
                  <AmbientZenBar
                    activeSound={activeSound}
                    soundVolume={soundVolume}
                    onChangeSound={setActiveSound}
                    onChangeVolume={setSoundVolume}
                    isZenMode={isZenMode}
                    onToggleZenMode={() => setIsZenMode(true)}
                    uiSettings={uiSettings}
                    onUpdateUISettings={setUiSettings}
                  />

                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-700 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Налаштування</span>
                  </button>
                </div>
              )}
            </div>

            <TestRunner
              session={activeTestSession}
              autoAdvanceOnSingleChoice={uiSettings.autoAdvanceOnSingleChoice}
              onFinishTest={handleFinishTest}
              onCancelTest={() => setActiveTestSession(null)}
              onOpenReference={(subId) => setReferenceSubject(subId)}
            />
          </div>
        ) : activeTab === 'subjects' ? (
          /* 2. SUBJECTS BLOCKS, TOPIC TEST BUILDER & FULL SIMULATION VIEW */
          <SubjectSelector
            userStats={userStats}
            isTimedDefault={isTimedDefault}
            onToggleTimedDefault={setIsTimedDefault}
            customSingleMinutes={customSingleMinutes}
            onChangeCustomSingleMinutes={setCustomSingleMinutes}
            onStartTest={handleStartTest}
            onStartSimulation={handleStartSimulation}
            onStartCustomTopicTest={handleStartCustomTopicTest}
            onOpenReference={(subId) => setReferenceSubject(subId)}
            onOpenMistakes={handleStartMistakesTest}
          />
        ) : activeTab === 'registration' ? (
          /* 3. MULTI-ACCOUNT VIEW */
          <ParticipantRegistrationView
            registrations={registrations}
            activeAccountId={activeAccountId}
            onSwitchAccount={handleSwitchAccount}
            onAddRegistration={handleAddRegistration}
            onDeleteRegistration={handleDeleteRegistration}
            userStats={userStats}
            onGoToStats={() => setActiveTab('stats')}
          />
        ) : (
          /* 4. PERSONAL STATS & PROGRESS TRACKER VIEW */
          <PersonalStatsView
            userStats={userStats}
            onUpdateStats={setUserStats}
            onStartMistakesTest={handleStartMistakesTest}
            onReviewPastSession={(s) => setReviewSession(s)}
            onBackToSubjects={() => setActiveTab('subjects')}
          />
        )}
      </main>

      {/* Test Results Modal */}
      {reviewSession && (
        <TestResultsModal
          session={reviewSession}
          onRetry={() => {
            const currentMode = reviewSession.mode;
            const currentSub = reviewSession.subjectId;
            const filter = reviewSession.topicFilter;
            const wasTimed = reviewSession.isTimed;
            const structure = reviewSession.simulationStructure || 'two-stage';
            setReviewSession(null);

            if (currentMode === 'simulation') {
              handleStartSimulation({
                isTimed: wasTimed,
                durationMinutes: Math.round((reviewSession.timeLimitSeconds || 240 * 60) / 60),
                structure,
                questionsPerSubject: Math.round(reviewSession.questions.length / 4) || 25,
              });
            } else if (reviewSession.id.startsWith('custom-')) {
              const sessionTopics = Array.from(
                new Set(reviewSession.questions.map((q) => q.topic))
              );
              const candidatePool = NMT_QUESTIONS.filter(
                (q) => q.subjectId === currentSub && sessionTopics.includes(q.topic)
              );
              const freshQuestions = pickSmartShuffledQuestions(
                candidatePool,
                reviewSession.questions.length,
                userStats
              );
              handleStartCustomTopicTest({
                subjectId: currentSub,
                selectedTopics: sessionTopics,
                questions: freshQuestions,
                isTimed: wasTimed,
                durationMinutes: Math.round((reviewSession.timeLimitSeconds || 30 * 60) / 60),
                enterZenMode: isZenMode,
              });
            } else {
              handleStartTest(
                currentSub,
                currentMode === 'mistakes' ? 'full' : currentMode,
                filter,
                wasTimed
              );
            }
          }}
          onGoToStats={() => {
            setReviewSession(null);
            setActiveTab('stats');
          }}
          onClose={() => setReviewSession(null)}
        />
      )}

      {/* Reference Formulas Cheatsheet Modal */}
      {referenceSubject && (
        <ReferenceModal
          initialSubjectId={referenceSubject}
          onClose={() => setReferenceSubject(null)}
        />
      )}

      {/* Detailed Interface Settings Modal */}
      {isSettingsModalOpen && (
        <InterfaceSettingsModal
          settings={uiSettings}
          onUpdateSettings={setUiSettings}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {/* Minimal Footer (hidden in Zen Mode) */}
      {!isZenMode && (
        <footer className="border-t border-zinc-200 bg-white py-6 mt-12 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {nmtYear} НМТ Тренажер · Створено для підготовки українських абітурієнтів</p>
            <div className="flex items-center gap-4 text-zinc-600">
              <span>Історія України</span>
              <span>·</span>
              <span>Математика</span>
              <span>·</span>
              <span>Українська мова</span>
              <span>·</span>
              <span>Англійська мова</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
