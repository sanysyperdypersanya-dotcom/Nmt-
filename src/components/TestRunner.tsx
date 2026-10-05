import React, { useState, useEffect, useRef } from 'react';
import { Question, SubjectId, TestSession, SubjectScoreBreakdown } from '../types/nmt';
import { SUBJECT_METADATA, formatTime, calculateNmtScore } from '../utils/scoring';
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  BookOpen,
  Sparkles,
  Coffee,
  Play,
  Pause,
  Infinity as InfinityIcon,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface TestRunnerProps {
  session: TestSession;
  autoAdvanceOnSingleChoice?: boolean;
  onFinishTest: (completedSession: TestSession) => void;
  onCancelTest: () => void;
  onOpenReference: (subjectId: SubjectId) => void;
}

function formatDurationClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return formatTime(safe);
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  session: initialSession,
  autoAdvanceOnSingleChoice = false,
  onFinishTest,
  onCancelTest,
  onOpenReference,
}) => {
  const [session, setSession] = useState<TestSession>(initialSession);
  const [isExamMode, setIsExamMode] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState<boolean>(false);

  // Simulation stage state ('stage1' = ukr+math, 'break' = 20m break, 'stage2' = history+eng, 'all' = all 4)
  const isTwoStageSim =
    session.mode === 'simulation' && session.simulationStructure === 'two-stage';

  const [simStage, setSimStage] = useState<'stage1' | 'break' | 'stage2' | 'all'>(
    isTwoStageSim ? 'stage1' : 'all'
  );
  const [breakRemainingSeconds, setBreakRemainingSeconds] = useState<number>(20 * 60);

  // Timed countdown state
  // For two-stage simulation, each stage gets half of total timeLimitSeconds (e.g. 120 min per stage)
  const initialStageLimit = isTwoStageSim
    ? Math.floor((session.timeLimitSeconds || 240 * 60) / 2)
    : session.timeLimitSeconds || 60 * 60;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialStageLimit);

  // Visible questions for the current stage
  const stageQuestions = session.questions.filter((q) => {
    if (simStage === 'stage1') return q.subjectId === 'ukr' || q.subjectId === 'math';
    if (simStage === 'stage2') return q.subjectId === 'history' || q.subjectId === 'eng';
    return true;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = stageQuestions[currentIndex] || stageQuestions[0];
  const currentSubMeta = SUBJECT_METADATA[currentQ.subjectId];
  const totalStageQuestions = stageQuestions.length;

  const finishRef = useRef<((expired?: boolean) => void) | null>(null);

  // Check if a single question has been answered by user
  const isQuestionAnswered = (q: Question, answersMap: Record<string, any>): boolean => {
    const ans = answersMap[q.id];
    if (q.type === 'single') return ans !== undefined;
    if (q.type === 'numeric') return ans !== undefined && ans !== '';
    if (q.type === 'matching' && q.matchingLeft) {
      if (!ans) return false;
      return Object.keys(ans).length === q.matchingLeft.length;
    }
    return false;
  };

  // Compute points for a subset of questions
  const evaluateQuestions = (
    qs: Question[],
    answersMap: Record<string, any>,
    subId: SubjectId
  ): SubjectScoreBreakdown => {
    let rawPoints = 0;
    let maxRawPoints = 0;

    qs.forEach((q) => {
      maxRawPoints += q.maxPoints;
      const ans = answersMap[q.id];

      if (q.type === 'single') {
        if (ans === q.correctOptionId) {
          rawPoints += q.maxPoints;
        }
      } else if (q.type === 'numeric') {
        if (ans !== undefined && ans !== '') {
          const numVal = parseFloat(String(ans).replace(',', '.'));
          const targetVal = parseFloat(String(q.correctNumeric).replace(',', '.'));
          if (Math.abs(numVal - targetVal) < 0.001) {
            rawPoints += q.maxPoints;
          }
        }
      } else if (q.type === 'matching' && q.correctMatching) {
        if (ans) {
          Object.entries(q.correctMatching).forEach(([numK, letterV]) => {
            if (ans[numK] === letterV) {
              rawPoints += 1;
            }
          });
        }
      }
    });

    const percentage = maxRawPoints > 0 ? Math.round((rawPoints / maxRawPoints) * 100) : 0;
    const nmtScore = calculateNmtScore(rawPoints, maxRawPoints, subId);

    return { rawPoints, maxRawPoints, percentage, nmtScore };
  };

  // Finalize test and calculate all scores
  const handleConfirmFinish = (expired = false) => {
    if (session.mode === 'simulation') {
      const subjects: SubjectId[] = ['ukr', 'math', 'history', 'eng'];
      const subjectScores: Partial<Record<SubjectId, SubjectScoreBreakdown>> = {};
      let totalRaw = 0;
      let totalMaxRaw = 0;
      let sumNmt = 0;
      let countSubs = 0;

      subjects.forEach((sId) => {
        const subQs = session.questions.filter((q) => q.subjectId === sId);
        if (subQs.length > 0) {
          const breakdown = evaluateQuestions(subQs, session.userAnswers, sId);
          subjectScores[sId] = breakdown;
          totalRaw += breakdown.rawPoints;
          totalMaxRaw += breakdown.maxRawPoints;
          sumNmt += breakdown.nmtScore;
          countSubs += 1;
        }
      });

      const overallPercentage =
        totalMaxRaw > 0 ? Math.round((totalRaw / totalMaxRaw) * 100) : 0;
      const avgNmtScore = countSubs > 0 ? Math.round(sumNmt / countSubs) : 100;

      const completed: TestSession = {
        ...session,
        timeSpentSeconds: elapsedSeconds,
        timeExpired: expired,
        completedAt: new Date().toISOString(),
        isCompleted: true,
        subjectScores,
        score: {
          rawPoints: totalRaw,
          maxRawPoints: totalMaxRaw,
          percentage: overallPercentage,
          nmtScore: avgNmtScore,
        },
      };

      onFinishTest(completed);
      return;
    }

    // Standard single-subject or mistakes test
    const breakdown = evaluateQuestions(
      session.questions,
      session.userAnswers,
      session.subjectId
    );

    const completed: TestSession = {
      ...session,
      timeSpentSeconds: elapsedSeconds,
      timeExpired: expired,
      completedAt: new Date().toISOString(),
      isCompleted: true,
      score: breakdown,
    };

    onFinishTest(completed);
  };

  finishRef.current = handleConfirmFinish;

  // Transition from Stage 1 -> Break -> Stage 2
  const handleStartStage2 = () => {
    setSimStage('stage2');
    setCurrentIndex(0);
    setShowExplanation(false);
    setShowConfirmFinish(false);
    setRemainingSeconds(initialStageLimit);
  };

  // Main timer effect
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      if (simStage === 'break') {
        setBreakRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleStartStage2();
            return 0;
          }
          return prev - 1;
        });
        return;
      }

      setElapsedSeconds((prev) => prev + 1);

      if (session.isTimed) {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (simStage === 'stage1') {
              setSimStage('break');
              setShowConfirmFinish(false);
              return 0;
            } else {
              if (finishRef.current) finishRef.current(true);
              return 0;
            }
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, simStage, session.isTimed]);

  // Toggle between Timed and Untimed on the fly
  const handleToggleTimedInRunner = () => {
    setSession((prev) => {
      const nextTimed = !prev.isTimed;
      if (nextTimed && remainingSeconds <= 0) {
        setRemainingSeconds(initialStageLimit);
      }
      return {
        ...prev,
        isTimed: nextTimed,
      };
    });
  };

  // Answer handlers
  const handleSelectSingleOption = (optionId: string) => {
    setSession((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [currentQ.id]: optionId,
      },
    }));

    if (autoAdvanceOnSingleChoice && isExamMode && currentIndex < totalStageQuestions - 1) {
      setTimeout(() => {
        setCurrentIndex((prevIdx) => Math.min(totalStageQuestions - 1, prevIdx + 1));
        setShowExplanation(false);
      }, 300);
    }
  };

  const handleSelectMatching = (numKey: string, letterVal: string) => {
    const currentMatches = session.userAnswers[currentQ.id] || {};
    const updated = { ...currentMatches, [numKey]: letterVal };

    setSession((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [currentQ.id]: updated,
      },
    }));
  };

  const handleNumericInput = (val: string) => {
    setSession((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [currentQ.id]: val,
      },
    }));
  };

  const handleToggleFlag = (qId: string) => {
    setSession((prev) => {
      const isFlagged = prev.flaggedQuestionIds.includes(qId);
      return {
        ...prev,
        flaggedQuestionIds: isFlagged
          ? prev.flaggedQuestionIds.filter((id) => id !== qId)
          : [...prev.flaggedQuestionIds, qId],
      };
    });
  };

  // Count answered in current stage
  const answeredStageCount = stageQuestions.filter((q) =>
    isQuestionAnswered(q, session.userAnswers)
  ).length;

  // Subjects available in current stage (for Simulation tabs)
  const stageSubjects: SubjectId[] =
    simStage === 'stage1'
      ? ['ukr', 'math']
      : simStage === 'stage2'
      ? ['history', 'eng']
      : ['ukr', 'math', 'history', 'eng'];

  // ========================================================
  // RENDER INTER-STAGE BREAK SCREEN (ПЕРЕРВА МІЖ ЕТАПАМИ НМТ)
  // ========================================================
  if (simStage === 'break') {
    const ukrQs = session.questions.filter((q) => q.subjectId === 'ukr');
    const mathQs = session.questions.filter((q) => q.subjectId === 'math');
    const ukrDone = ukrQs.filter((q) => isQuestionAnswered(q, session.userAnswers)).length;
    const mathDone = mathQs.filter((q) => isQuestionAnswered(q, session.userAnswers)).length;

    return (
      <div className="max-w-2xl mx-auto bg-white border-2 border-zinc-900 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-center my-6">
        <div className="inline-flex p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
          <Coffee className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Симуляція НМТ 2027 · Перерва між етапами
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-950">
            Перший етап (Українська мова + Математика) завершено!
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-lg mx-auto leading-relaxed">
            На реальному тестуванні НМТ між першим та другим двомовними блоками передбачена
            20-хвилинна перерва. Ви можете перепочити або одразу перейти до другого етапу.
          </p>
        </div>

        {/* Break countdown */}
        <div className="p-5 bg-zinc-950 text-white rounded-xl max-w-xs mx-auto space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">
            Таймер перерви
          </div>
          <div className="text-3xl font-mono font-extrabold text-amber-400">
            {formatTime(breakRemainingSeconds)}
          </div>
        </div>

        {/* Stage 1 Summary */}
        <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="text-xs font-bold text-zinc-900">Українська мова</div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              Збережено відповідей: {ukrDone} / {ukrQs.length}
            </div>
          </div>
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="text-xs font-bold text-zinc-900">Математика</div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              Збережено відповідей: {mathDone} / {mathQs.length}
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleStartStage2}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Пропустити перерву та почати Етап 2 (Історія + Англійська)</span>
          </button>
        </div>
      </div>
    );
  }

  const timeLowWarning = session.isTimed && remainingSeconds <= 300; // < 5 mins
  const timeCriticalWarning = session.isTimed && remainingSeconds <= 60; // < 1 min

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Test Control Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
        {/* Progress bar for timed tests */}
        {session.isTimed && initialStageLimit > 0 && (
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                timeCriticalWarning
                  ? 'bg-rose-600'
                  : timeLowWarning
                  ? 'bg-amber-500'
                  : 'bg-zinc-900'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, (remainingSeconds / initialStageLimit) * 100)
                )}%`,
              }}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {session.mode === 'simulation' ? (
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {simStage === 'stage1'
                    ? 'Симуляція НМТ · Етап 1 з 2'
                    : simStage === 'stage2'
                    ? 'Симуляція НМТ · Етап 2 з 2'
                    : 'Симуляція НМТ · Усі 4 блоки'}
                </span>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {currentSubMeta.name}
                </span>
              )}
              <span className="text-zinc-300">/</span>
              <span className="text-xs font-medium text-zinc-800 font-mono">
                {session.title}
              </span>
            </div>
            <h2 className="text-base font-bold text-zinc-950 mt-0.5">
              Завдання {currentIndex + 1} з {totalStageQuestions} · {currentSubMeta.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timed / Untimed Live Display & Switcher */}
            {session.isTimed ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-mono font-bold transition-colors ${
                  timeCriticalWarning
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : timeLowWarning
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Залишилось: {formatDurationClock(remainingSeconds)}</span>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-0.5 rounded hover:bg-zinc-200 text-zinc-700"
                  title={isPaused ? 'Продовжити відлік' : 'Призупинити таймер'}
                >
                  {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-700">
                <InfinityIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span>Без ліміту ({formatDurationClock(elapsedSeconds)})</span>
              </div>
            )}

            {/* Quick toggle button: На час / Без часу */}
            <button
              type="button"
              onClick={handleToggleTimedInRunner}
              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition-colors"
              title="Перемкнути режим контролю часу"
            >
              {session.isTimed ? 'Вимкнути ліміт' : 'Увімкнути таймер'}
            </button>

            {/* Formulas reference button */}
            <button
              type="button"
              onClick={() => onOpenReference(currentQ.subjectId)}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-medium transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Довідник</span>
            </button>

            {/* Toggle Exam vs Study Mode */}
            <button
              type="button"
              onClick={() => setIsExamMode(!isExamMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isExamMode
                  ? 'bg-zinc-900 text-white'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {isExamMode ? 'Режим: Іспит' : 'Режим: Навчання'}
            </button>
          </div>
        </div>

        {/* If in NMT Simulation: Subject Switcher Tabs (like in real UCEQA test center) */}
        {session.mode === 'simulation' && (
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-zinc-100">
            <span className="text-[11px] font-bold uppercase text-zinc-500 mr-1">
              Предмети етапу:
            </span>
            {stageSubjects.map((subId) => {
              const sMeta = SUBJECT_METADATA[subId];
              const subIndices = stageQuestions
                .map((q, idx) => (q.subjectId === subId ? idx : -1))
                .filter((idx) => idx !== -1);
              if (subIndices.length === 0) return null;

              const isCurrentSubject = currentQ.subjectId === subId;
              const subAnswered = subIndices.filter((idx) =>
                isQuestionAnswered(stageQuestions[idx], session.userAnswers)
              ).length;

              return (
                <button
                  key={subId}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(subIndices[0]);
                    setShowExplanation(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
                    isCurrentSubject
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <span>{sMeta.name}</span>
                  <span
                    className={`font-mono text-[11px] ${
                      isCurrentSubject ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    {subAnswered}/{subIndices.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Question Numbers Navigation Grid */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
            {stageQuestions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isFlagged = session.flaggedQuestionIds.includes(q.id);
              const isAnswered = isQuestionAnswered(q, session.userAnswers);

              let btnClass = 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200';
              if (isAnswered) {
                btnClass = 'bg-zinc-800 text-white border-zinc-800';
              }
              if (isCurrent) {
                btnClass = 'ring-2 ring-zinc-950 font-bold bg-white text-zinc-950 border-zinc-900';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowExplanation(false);
                  }}
                  className={`relative w-8 h-8 rounded text-xs font-mono transition-all flex items-center justify-center border ${btnClass}`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmFinish(true)}
            className="shrink-0 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            {simStage === 'stage1' ? 'Завершити Етап 1 →' : 'Завершити тест'}
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-6">
        {/* Meta row: topic, source, points, flag button */}
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-900">{currentSubMeta.shortName}</span>
            <span>·</span>
            <span className="font-medium text-zinc-700">{currentQ.topic}</span>
            <span>·</span>
            <span>{currentQ.yearOrSource}</span>
            <span>·</span>
            <span className="font-mono text-zinc-800">
              Макс: {currentQ.maxPoints} {currentQ.maxPoints === 1 ? 'бал' : 'бали'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleToggleFlag(currentQ.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
              session.flaggedQuestionIds.includes(currentQ.id)
                ? 'bg-amber-100 text-amber-800 border border-amber-300 font-medium'
                : 'hover:bg-zinc-100 text-zinc-600'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{session.flaggedQuestionIds.includes(currentQ.id) ? 'Позначено' : 'Позначити'}</span>
          </button>
        </div>

        {/* Question context */}
        {currentQ.context && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-xs leading-relaxed text-zinc-800 italic">
            {currentQ.context}
          </div>
        )}

        {/* Question Text */}
        <div className="text-zinc-950 font-medium text-base sm:text-lg leading-relaxed whitespace-pre-line">
          {currentQ.text}
        </div>

        {/* 1. SINGLE CHOICE FORMAT */}
        {currentQ.type === 'single' && currentQ.options && (
          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((opt) => {
              const selected = session.userAnswers[currentQ.id] === opt.id;
              const isTraining = !isExamMode;
              const isCorrectOpt = opt.id === currentQ.correctOptionId;

              let style = 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-900';
              if (selected) {
                style = 'bg-zinc-900 border-zinc-900 text-white font-medium shadow-xs';
              }
              if (isTraining && selected) {
                if (isCorrectOpt) {
                  style = 'bg-emerald-600 border-emerald-600 text-white font-medium';
                } else {
                  style = 'bg-rose-600 border-rose-600 text-white font-medium';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectSingleOption(opt.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center gap-3.5 ${style}`}
                >
                  <span
                    className={`w-7 h-7 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 border ${
                      selected
                        ? 'bg-white text-zinc-900 border-white'
                        : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="text-sm leading-normal">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. MATCHING FORMAT (1-4 to A-D) */}
        {currentQ.type === 'matching' && currentQ.matchingLeft && currentQ.matchingRight && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Умова (1–{currentQ.matchingLeft.length})
                </div>
                {currentQ.matchingLeft.map((item) => {
                  const assignedLetter = session.userAnswers[currentQ.id]?.[item.id];
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-start gap-2.5 text-xs text-zinc-900"
                    >
                      <span className="w-5 h-5 rounded bg-zinc-800 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                        {item.num}
                      </span>
                      <span className="leading-snug">{item.text}</span>
                      {assignedLetter && (
                        <span className="ml-auto font-mono font-bold px-2 py-0.5 bg-zinc-900 text-white rounded text-[11px] shrink-0">
                          → {assignedLetter}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Column */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Варіанти (А–{currentQ.matchingRight[currentQ.matchingRight.length - 1]?.letter})
                </div>
                {currentQ.matchingRight.map((choice) => (
                  <div
                    key={choice.id}
                    className="p-3 bg-white border border-zinc-200 rounded-lg flex items-start gap-2.5 text-xs text-zinc-800"
                  >
                    <span className="w-5 h-5 rounded bg-zinc-200 text-zinc-800 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                      {choice.letter}
                    </span>
                    <span className="leading-snug">{choice.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official NMT Matching Matrix Grid */}
            <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div className="text-xs font-bold text-zinc-800 mb-2">
                Таблиця відповідей (натисніть клітинку для встановлення пари):
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 border border-zinc-200 bg-zinc-100 font-bold text-zinc-700">#</th>
                      {currentQ.matchingRight.map((c) => (
                        <th
                          key={c.letter}
                          className="p-2 border border-zinc-200 bg-zinc-100 font-mono font-bold text-zinc-800"
                        >
                          {c.letter}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentQ.matchingLeft.map((leftItem) => {
                      const currentSelected = session.userAnswers[currentQ.id]?.[leftItem.id];
                      return (
                        <tr key={leftItem.id}>
                          <td className="p-2 border border-zinc-200 font-mono font-bold bg-zinc-100 text-zinc-900">
                            {leftItem.num}
                          </td>
                          {currentQ.matchingRight!.map((rightChoice) => {
                            const isChosen = currentSelected === rightChoice.letter;
                            return (
                              <td key={rightChoice.letter} className="p-1 border border-zinc-200">
                                <button
                                  type="button"
                                  onClick={() => handleSelectMatching(leftItem.id, rightChoice.letter)}
                                  className={`w-full py-2 rounded text-xs font-mono font-bold transition-all ${
                                    isChosen
                                      ? 'bg-zinc-950 text-white shadow-xs'
                                      : 'hover:bg-zinc-200 text-zinc-500'
                                  }`}
                                >
                                  {isChosen ? '✕' : '·'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. NUMERIC INPUT FORMAT */}
        {currentQ.type === 'numeric' && (
          <div className="pt-2 max-w-sm space-y-3">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Введіть відповідь (ціле число або десятковий дріб через кому чи крапку):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={session.userAnswers[currentQ.id] || ''}
                onChange={(e) => handleNumericInput(e.target.value)}
                placeholder="Наприклад: 96 або 4.5"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg font-mono text-base text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>
        )}

        {/* Pedagogical Explanation View */}
        {(!isExamMode || showExplanation) && (
          <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Пояснення та офіційне обґрунтування:</span>
            </div>
            <p className="text-zinc-700 leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
                setShowExplanation(false);
              }
            }}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>

          {isExamMode && (
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium underline"
            >
              {showExplanation ? 'Приховати пояснення' : 'Показати пояснення'}
            </button>
          )}

          {currentIndex < totalStageQuestions - 1 ? (
            <button
              type="button"
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setShowExplanation(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Далі</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmFinish(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <span>{simStage === 'stage1' ? 'Завершити Етап 1' : 'Завершити тест'}</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Finish Stage 1 or Full Test */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-zinc-950">
              {simStage === 'stage1'
                ? 'Завершити Етап 1 (Укр. мова + Математика)?'
                : 'Завершити тестування?'}
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Ви відповіли на <span className="font-bold text-zinc-900">{answeredStageCount}</span> з{' '}
              <span className="font-bold text-zinc-900">{totalStageQuestions}</span> завдань{' '}
              {simStage === 'stage1' ? 'першого етапу.' : 'тесту.'}
              {answeredStageCount < totalStageQuestions && (
                <span className="block mt-1.5 text-amber-700 font-medium">
                  Увага: залишились нерозв’язані завдання. Невиконані завдання буде оцінено в 0 балів.
                </span>
              )}
              {simStage === 'stage1' && (
                <span className="block mt-1.5 text-zinc-500">
                  Після переходу до перерви та другого етапу повернутися до завдань першого етапу буде неможливо (як на реальному НМТ).
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmFinish(false)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Повернутись до завдань
              </button>
              {simStage === 'stage1' ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmFinish(false);
                    setSimStage('break');
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs"
                >
                  Перейти до перерви / Етапу 2
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmFinish(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs"
                >
                  Підтвердити завершення
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
