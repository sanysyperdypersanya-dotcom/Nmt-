import React, { useState, useRef } from 'react';
import { SubjectId, UserStats, Question } from '../types/nmt';
import { NMT_QUESTIONS } from '../data/questions';
import { SUBJECT_METADATA, getScoreDescriptor } from '../utils/scoring';
import { TopicTestBuilder } from './TopicTestBuilder';
import {
  BookOpen,
  Calculator,
  Landmark,
  Globe,
  Play,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  Infinity as InfinityIcon,
  ShieldCheck,
  Timer,
  Coffee,
  ListChecks,
  Wrench,
} from 'lucide-react';

interface SubjectSelectorProps {
  userStats: UserStats;
  isTimedDefault: boolean;
  onToggleTimedDefault: (isTimed: boolean) => void;
  customSingleMinutes: number;
  onChangeCustomSingleMinutes: (mins: number) => void;
  onStartTest: (
    subjectId: SubjectId,
    mode: 'full' | 'blitz' | 'topic',
    topicFilter?: string,
    overrideTimed?: boolean,
    overrideMinutes?: number
  ) => void;
  onStartSimulation: (options: {
    isTimed: boolean;
    durationMinutes: number;
    structure: 'two-stage' | 'all-at-once';
    questionsPerSubject: number;
  }) => void;
  onStartCustomTopicTest: (options: {
    subjectId: SubjectId;
    selectedTopics: string[];
    questions: Question[];
    isTimed: boolean;
    durationMinutes: number;
    enterZenMode: boolean;
  }) => void;
  onOpenReference: (subjectId: SubjectId) => void;
  onOpenMistakes: () => void;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  userStats,
  isTimedDefault,
  onToggleTimedDefault,
  customSingleMinutes,
  onChangeCustomSingleMinutes,
  onStartTest,
  onStartSimulation,
  onStartCustomTopicTest,
  onOpenReference,
  onOpenMistakes,
}) => {
  const [selectedTopicSubject, setSelectedTopicSubject] = useState<SubjectId | null>(null);
  const [topicCatalogSubject, setTopicCatalogSubject] = useState<SubjectId>('ukr');
  const [builderSubject, setBuilderSubject] = useState<SubjectId>('ukr');
  const builderRef = useRef<HTMLDivElement | null>(null);

  // Simulation local config state
  const [simStructure, setSimStructure] = useState<'two-stage' | 'all-at-once'>('two-stage');
  const [simDurationPreset, setSimDurationPreset] = useState<number>(240);
  const [simQuestionsPerSub, setSimQuestionsPerSub] = useState<number>(25); // 25*4 = 100 or 32*4 = 128

  const handleJumpToBuilder = (subId: SubjectId) => {
    setBuilderSubject(subId);
    builderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const subjectIcons: Record<SubjectId, React.ReactNode> = {
    ukr: <BookOpen className="w-6 h-6 text-blue-600" />,
    math: <Calculator className="w-6 h-6 text-emerald-600" />,
    history: <Landmark className="w-6 h-6 text-amber-600" />,
    eng: <Globe className="w-6 h-6 text-violet-600" />,
  };

  const subjectAccents: Record<SubjectId, { border: string }> = {
    ukr: { border: 'hover:border-blue-300' },
    math: { border: 'hover:border-emerald-300' },
    history: { border: 'hover:border-amber-300' },
    eng: { border: 'hover:border-violet-300' },
  };

  const subjects: SubjectId[] = ['ukr', 'math', 'history', 'eng'];
  const mistakeCount = userStats.mistakeQuestionIds.length;

  // Find best full simulation in history if any
  const simulationHistory = userStats.history.filter((h) => h.mode === 'simulation');
  const bestSimulationScore =
    simulationHistory.length > 0
      ? Math.max(...simulationHistory.map((h) => h.score.nmtScore))
      : 0;

  return (
    <div className="space-y-8">
      {/* 1. GLOBAL TIME MODE SELECTOR: Вибір чи хоче користувач тест на час */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-zinc-900" />
              <h2 className="text-sm font-bold text-zinc-950">
                Режим проходження тестів: На час чи Без обмежень
              </h2>
            </div>
            <p className="text-xs text-zinc-600">
              Оберіть, чи бажаєте складати тести з таймером зворотного відліку, чи у спокійному вільному темпі без ліміту часу.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Control: На час vs Без часу */}
            <div className="inline-flex p-1 bg-zinc-100 border border-zinc-200 rounded-lg">
              <button
                type="button"
                onClick={() => onToggleTimedDefault(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
                  isTimedDefault
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Тест на час (З таймером)</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleTimedDefault(false)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
                  !isTimedDefault
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Без обмеження часу</span>
              </button>
            </div>

            {/* Duration selector when Timed is enabled */}
            {isTimedDefault && (
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-zinc-500 font-medium">Ліміт блоку:</span>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onChangeCustomSingleMinutes(mins)}
                    className={`px-2 py-1 rounded font-mono font-semibold transition-colors ${
                      customSingleMinutes === mins
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {mins} хв
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. FULL NMT SIMULATION CARD: Повна симуляція НМТ (Збільшена кількість завдань) */}
      <div className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
              <span className="font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Повна симуляція НМТ 2027
              </span>
              <span>·</span>
              <span>Усі 4 обов’язкові предмети ({simQuestionsPerSub * 4} завдань)</span>
              <span>·</span>
              <span>Формат тестувального центру УЦОЯО</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
              Комплексна симуляція реального іспиту НМТ
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Масштабне тестування з усіх чотирьох дисциплін: Українська мова, Математика, Історія України та Англійська мова.
              Включає розширений банк завдань ({simQuestionsPerSub * 4} тестових питань: з вибором однієї відповіді, на відповідність 1–4 та з короткою числовою відповіддю).
            </p>

            {/* 2-Stage visual breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white border border-zinc-200 rounded-xl p-3">
                <div className="text-[11px] font-bold text-zinc-500 uppercase">
                  Етап 1 · {simQuestionsPerSub * 2} завдань
                </div>
                <div className="text-xs font-bold text-zinc-900 mt-1">
                  Українська мова + Математика
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  По {simQuestionsPerSub} завдань у кожному блоці
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Перерва · 20 хв</span>
                </div>
                <div className="text-xs font-bold text-zinc-900 mt-1">
                  Відпочинок між етапами
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Можна пропустити в один клік
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-3">
                <div className="text-[11px] font-bold text-zinc-500 uppercase">
                  Етап 2 · {simQuestionsPerSub * 2} завдань
                </div>
                <div className="text-xs font-bold text-zinc-900 mt-1">
                  Історія України + Англійська
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  По {simQuestionsPerSub} завдань у кожному блоці
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Simulation Configuration & Start */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 w-full lg:w-96 shrink-0 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-bold text-zinc-900">Налаштування симуляції</span>
              {bestSimulationScore > 0 && (
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  Рекорд: {bestSimulationScore} б.
                </span>
              )}
            </div>

            {/* Question Volume Selector (Збільшена кількість завдань) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-600 uppercase">
                Кількість завдань у симуляції:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { perSub: 45, total: 180, label: '180 питань', sub: 'Мега-база (4×45)' },
                  { perSub: 32, total: 128, label: '128 питань', sub: 'Макс НМТ (4×32)' },
                  { perSub: 25, total: 100, label: '100 питань', sub: 'Стандарт (4×25)' },
                ].map((opt) => (
                  <button
                    key={opt.perSub}
                    type="button"
                    onClick={() => setSimQuestionsPerSub(opt.perSub)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      simQuestionsPerSub === opt.perSub
                        ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{opt.label}</div>
                    <div
                      className={`text-[10px] ${
                        simQuestionsPerSub === opt.perSub ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {opt.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Structure choice */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-600 uppercase">
                Структура іспиту:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSimStructure('two-stage')}
                  className={`p-2 rounded-lg border text-left text-xs transition-all ${
                    simStructure === 'two-stage'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <div>2 етапи + перерва</div>
                  <div className={`text-[10px] ${simStructure === 'two-stage' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    Стандарт УЦОЯО
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSimStructure('all-at-once')}
                  className={`p-2 rounded-lg border text-left text-xs transition-all ${
                    simStructure === 'all-at-once'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <div>Усі 4 блоки разом</div>
                  <div className={`text-[10px] ${simStructure === 'all-at-once' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    Без перерви
                  </div>
                </button>
              </div>
            </div>

            {/* Time choice inside simulation */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-600 uppercase">
                Контроль часу симуляції:
              </label>
              {isTimedDefault ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSimDurationPreset(240)}
                    className={`p-2 rounded-lg border text-center text-xs font-mono transition-all ${
                      simDurationPreset === 240
                        ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    240 хв (Повний)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimDurationPreset(90)}
                    className={`p-2 rounded-lg border text-center text-xs font-mono transition-all ${
                      simDurationPreset === 90
                        ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    90 хв (Прискорений)
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 flex items-center justify-between">
                  <span>Обрано режим без ліміту часу</span>
                  <button
                    type="button"
                    onClick={() => onToggleTimedDefault(true)}
                    className="text-zinc-900 font-semibold underline"
                  >
                    Увімкнути час
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onStartSimulation({
                  isTimed: isTimedDefault,
                  durationMinutes: simDurationPreset,
                  structure: simStructure,
                  questionsPerSubject: simQuestionsPerSub,
                })
              }
              className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                Почати симуляцію ({simQuestionsPerSub * 4} питань ·{' '}
                {isTimedDefault ? `${simDurationPreset} хв` : 'Без часу'})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MISTAKES CALLOUT BAR */}
      {mistakeCount > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-600 shrink-0"></span>
            <div className="text-xs text-zinc-700">
              <span className="font-bold text-zinc-950">Робота над помилками:</span> у вас є{' '}
              <span className="font-mono font-bold text-rose-700">{mistakeCount}</span> завдань, у яких ви помилялися раніше.
            </div>
          </div>
          <button
            onClick={onOpenMistakes}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold transition-colors shrink-0"
          >
            <span>Відпрацювати помилки</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. GRID OF THE 4 INDIVIDUAL SUBJECT BLOCKS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-bold text-zinc-950">
            4 Предметні блоки НМТ (Повні тести, Бліц на 5 питань та Теми)
          </h3>
          <span className="text-xs text-zinc-500">
            Режим: {isTimedDefault ? `На час (${customSingleMinutes} хв блок / 5 хв бліц)` : 'Без обмеження часу'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((subId) => {
            const meta = SUBJECT_METADATA[subId];
            const stats = userStats.subjectStats[subId];
            const bestScore = stats.bestNmtScore;
            const scoreDesc = bestScore > 0 ? getScoreDescriptor(bestScore) : null;
            const accent = subjectAccents[subId];
            const subjectQuestionCount = NMT_QUESTIONS.filter((q) => q.subjectId === subId).length;

            return (
              <div
                key={subId}
                className={`bg-white border border-zinc-200 rounded-xl p-6 transition-all duration-200 shadow-xs ${accent.border} flex flex-col justify-between`}
              >
                <div>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                        {subjectIcons[subId]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-950">{meta.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          <span>{subjectQuestionCount} завдань у базі</span>
                          <span>·</span>
                          <span>{isTimedDefault ? `${customSingleMinutes} хв` : 'Без ліміту'}</span>
                          <span>·</span>
                          <span className="font-mono text-zinc-700">{meta.topics.length} тем</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-zinc-500">
                      Блок НМТ
                    </span>
                  </div>

                  {/* Subject User Stats Card */}
                  <div className="bg-zinc-50/80 border border-zinc-100 rounded-lg p-3.5 mb-5 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[11px] text-zinc-500">Кращий бал</div>
                      <div className="text-base font-bold text-zinc-900 font-mono">
                        {bestScore > 0 ? bestScore : '—'}
                      </div>
                      {scoreDesc && (
                        <div className={`text-[10px] ${scoreDesc.textClass} truncate`}>
                          {scoreDesc.label}
                        </div>
                      )}
                    </div>
                    <div className="border-x border-zinc-200">
                      <div className="text-[11px] text-zinc-500">Пройдено тестів</div>
                      <div className="text-base font-bold text-zinc-900 font-mono">
                        {stats.testsCompleted}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {stats.questionsAnswered} питань
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500">Точність</div>
                      <div className="text-base font-bold text-zinc-900 font-mono">
                        {stats.questionsAnswered > 0
                          ? `${Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)}%`
                          : '—'}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        {stats.correctAnswers} правильних
                      </div>
                    </div>
                  </div>

                  {/* Topics preview & expandable Topic Tests selector */}
                  <div className="mb-5">
                    <div className="text-xs font-semibold text-zinc-700 mb-2 flex items-center justify-between">
                      <span>Тести за темами ({meta.topics.length}):</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTopicSubject(selectedTopicSubject === subId ? null : subId)
                        }
                        className="text-xs text-zinc-900 font-semibold hover:underline"
                      >
                        {selectedTopicSubject === subId ? 'Згорнути теми' : 'Усі теми блоку →'}
                      </button>
                    </div>

                    {selectedTopicSubject === subId ? (
                      <div className="grid grid-cols-1 gap-1.5 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl max-h-60 overflow-y-auto">
                        {meta.topics.map((topic) => {
                          const mastery = stats.topicMastery[topic];
                          const qCount = NMT_QUESTIONS.filter(
                            (q) => q.subjectId === subId && q.topic === topic
                          ).length;
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => onStartTest(subId, 'topic', topic)}
                              className="flex items-center justify-between text-left p-2.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-xs text-zinc-900 transition-colors"
                            >
                              <div className="pr-2">
                                <div className="font-semibold">{topic}</div>
                                <div className="text-[11px] text-zinc-500">
                                  {qCount} завдань · Засвоєно:{' '}
                                  {mastery ? `${mastery.correct}/${mastery.total}` : '0/0'}
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded bg-zinc-900 text-white font-semibold text-[11px] shrink-0">
                                Почати →
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {meta.topics.slice(0, 4).map((topic) => {
                          const qCount = NMT_QUESTIONS.filter(
                            (q) => q.subjectId === subId && q.topic === topic
                          ).length;
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => onStartTest(subId, 'topic', topic)}
                              className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 transition-colors"
                            >
                              <span className="truncate pr-1.5 font-medium">{topic}</span>
                              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                {qCount} пит.
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-zinc-100 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onStartTest(subId, 'full')}
                    className="flex-1 min-w-[135px] flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>
                      Повний тест ({subjectQuestionCount} пит.)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartTest(subId, 'blitz')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Бліц (5 питань)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJumpToBuilder(subId)}
                    className="flex items-center justify-center gap-1 px-2.5 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold transition-colors"
                    title="Конструктор тестів за обраними темами (1–32 питання)"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Конструктор</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenReference(subId)}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 rounded-lg text-xs font-semibold transition-colors"
                    title="Повноекранна теорія, довідкові матеріали та формули"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Теорія</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. CUSTOM TOPIC TEST BUILDER (КОНСТРУКТОР ТЕСТІВ 1–32 ПИТАНЬ) */}
      <div ref={builderRef} className="scroll-mt-16">
        <TopicTestBuilder
          key={builderSubject}
          userStats={userStats}
          initialSubjectId={builderSubject}
          isTimedDefault={isTimedDefault}
          onStartCustomTopicTest={onStartCustomTopicTest}
        />
      </div>

      {/* 6. DEDICATED TOPIC TESTS CATALOG: Каталог тестів за всіма темами НМТ */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-zinc-900" />
              <h3 className="text-lg font-bold text-zinc-950">
                Тренувальні тести за всіма 44 темами (УЦОЯО · ЗНО UA · Просте ЗНО)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Оберіть предмет і конкретну тему програми, щоб прицільно відпрацювати завдання з офіційних баз НМТ, ЗНО UA та Просте ЗНО
            </p>
          </div>

          {/* Subject switcher tabs */}
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((sId) => {
              const m = SUBJECT_METADATA[sId];
              const isSelected = topicCatalogSubject === sId;
              return (
                <button
                  key={sId}
                  type="button"
                  onClick={() => setTopicCatalogSubject(sId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of Topics for the selected subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SUBJECT_METADATA[topicCatalogSubject].topics.map((topic, index) => {
            const topicQuestions = NMT_QUESTIONS.filter(
              (q) => q.subjectId === topicCatalogSubject && q.topic === topic
            );
            const mastery =
              userStats.subjectStats[topicCatalogSubject].topicMastery[topic];
            const totalSolved = mastery ? mastery.total : 0;
            const correctSolved = mastery ? mastery.correct : 0;
            const pct = totalSolved > 0 ? Math.round((correctSolved / totalSolved) * 100) : 0;

            return (
              <div
                key={topic}
                className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col justify-between gap-4 hover:border-zinc-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Тема {String(index + 1).padStart(2, '0')}</span>
                    <span>{topicQuestions.length} завдань</span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-950 leading-snug">
                    {topic}
                  </h4>

                  {/* Topic Mastery Progress */}
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Рівень засвоєння</span>
                      <span className="font-mono font-semibold text-zinc-800">
                        {totalSolved > 0 ? `${pct}% (${correctSolved}/${totalSolved})` : 'Ще не пройдено'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80
                            ? 'bg-emerald-500'
                            : pct >= 50
                            ? 'bg-amber-500'
                            : 'bg-zinc-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartTest(topicCatalogSubject, 'topic', topic)}
                  className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Пройти тест за темою</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
