import React, { useState, useEffect } from 'react';
import { SubjectId, Question, UserStats } from '../types/nmt';
import { NMT_QUESTIONS } from '../data/questions';
import { SUBJECT_METADATA } from '../utils/scoring';
import { pickBalancedSmartTopicQuestions } from '../utils/questionRandomizer';
import {
  Wrench,
  CheckSquare,
  Square,
  Play,
  Shuffle,
  ListOrdered,
  Clock,
  Infinity as InfinityIcon,
  Sparkles,
  BookOpen,
  Calculator,
  Landmark,
  Globe,
  Minus,
  Plus,
  Database,
} from 'lucide-react';

type SourceFilter = 'all' | 'znoua' | 'proste' | 'nmt';

interface TopicTestBuilderProps {
  userStats: UserStats;
  initialSubjectId?: SubjectId;
  isTimedDefault: boolean;
  onStartCustomTopicTest: (options: {
    subjectId: SubjectId;
    selectedTopics: string[];
    questions: Question[];
    isTimed: boolean;
    durationMinutes: number;
    enterZenMode: boolean;
  }) => void;
}

export const TopicTestBuilder: React.FC<TopicTestBuilderProps> = ({
  userStats,
  initialSubjectId = 'ukr',
  isTimedDefault,
  onStartCustomTopicTest,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(initialSubjectId);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    SUBJECT_METADATA[initialSubjectId].topics
  );
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [questionCount, setQuestionCount] = useState<number>(16);
  const [shuffleOrder, setShuffleOrder] = useState<boolean>(true);
  const [isTimed, setIsTimed] = useState<boolean>(isTimedDefault);
  const [enterZenMode, setEnterZenMode] = useState<boolean>(false);

  const matchesSource = (q: Question, filter: SourceFilter): boolean => {
    if (filter === 'all') return true;
    const src = q.yearOrSource.toLowerCase();
    if (filter === 'znoua') return src.includes('зно ua');
    if (filter === 'proste') return src.includes('просте зно');
    if (filter === 'nmt') return src.includes('нмт');
    return true;
  };

  // Sync when subject changes
  const handleSelectSubject = (subId: SubjectId) => {
    setSelectedSubject(subId);
    const allTopics = SUBJECT_METADATA[subId].topics;
    setSelectedTopics(allTopics);
    setSourceFilter('all');
    const totalForSub = Math.min(
      32,
      NMT_QUESTIONS.filter((q) => q.subjectId === subId).length
    );
    setQuestionCount(Math.min(16, totalForSub));
  };

  // Update when external isTimedDefault changes
  useEffect(() => {
    setIsTimed(isTimedDefault);
  }, [isTimedDefault]);

  // Pool of available questions from currently checked topics and source filter
  const availablePool = NMT_QUESTIONS.filter(
    (q) =>
      q.subjectId === selectedSubject &&
      selectedTopics.includes(q.topic) &&
      matchesSource(q, sourceFilter)
  );

  const maxQuestions = Math.min(32, availablePool.length);

  // Clamp questionCount whenever availablePool changes
  useEffect(() => {
    if (maxQuestions === 0) {
      setQuestionCount(0);
    } else if (questionCount > maxQuestions) {
      setQuestionCount(maxQuestions);
    } else if (questionCount < 1 && maxQuestions >= 1) {
      setQuestionCount(Math.min(5, maxQuestions));
    }
  }, [maxQuestions, questionCount]);

  const handleToggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      const exists = prev.includes(topic);
      const next = exists ? prev.filter((t) => t !== topic) : [...prev, topic];
      const nextPoolLen = Math.min(
        32,
        NMT_QUESTIONS.filter(
          (q) =>
            q.subjectId === selectedSubject &&
            next.includes(q.topic) &&
            matchesSource(q, sourceFilter)
        ).length
      );
      if (nextPoolLen > 0) {
        setQuestionCount((curr) => Math.min(Math.max(1, curr), nextPoolLen));
      } else {
        setQuestionCount(0);
      }
      return next;
    });
  };

  const handleSelectAllTopics = () => {
    const all = SUBJECT_METADATA[selectedSubject].topics;
    setSelectedTopics(all);
    const maxLen = Math.min(
      32,
      NMT_QUESTIONS.filter(
        (q) => q.subjectId === selectedSubject && matchesSource(q, sourceFilter)
      ).length
    );
    setQuestionCount(maxLen);
  };

  const handleClearTopics = () => {
    const firstTopic = SUBJECT_METADATA[selectedSubject].topics[0];
    setSelectedTopics([firstTopic]);
  };

  // Balanced selection across chosen topics with smart anti-repetition shuffling
  const handleGenerateAndStart = () => {
    if (selectedTopics.length === 0 || questionCount < 1) return;

    const finalQuestions = pickBalancedSmartTopicQuestions(
      availablePool,
      selectedTopics,
      questionCount,
      shuffleOrder,
      userStats
    );

    const autoMinutes = Math.max(5, Math.min(60, Math.ceil(finalQuestions.length * 1.8)));

    onStartCustomTopicTest({
      subjectId: selectedSubject,
      selectedTopics,
      questions: finalQuestions,
      isTimed,
      durationMinutes: autoMinutes,
      enterZenMode,
    });
  };

  const subjectIcons: Record<SubjectId, React.ReactNode> = {
    ukr: <BookOpen className="w-4 h-4 text-blue-600" />,
    math: <Calculator className="w-4 h-4 text-emerald-600" />,
    history: <Landmark className="w-4 h-4 text-amber-600" />,
    eng: <Globe className="w-4 h-4 text-violet-600" />,
  };

  const subjects: SubjectId[] = ['ukr', 'math', 'history', 'eng'];
  const currentMeta = SUBJECT_METADATA[selectedSubject];

  return (
    <div className="bg-white border-2 border-zinc-900 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <Wrench className="w-3.5 h-3.5 text-zinc-900" />
            <span>Персональний конструктор тестів НМТ · ЗНО UA · Просте ЗНО</span>
          </div>
          <h3 className="text-xl font-extrabold text-zinc-950">
            Зберіть власний тест за обраними темами та базою завдань (від 1 до 32 питань)
          </h3>
          <p className="text-xs text-zinc-600">
            Оберіть дисципліну, джерело питань (УЦОЯО, ЗНО UA, Просте ЗНО), позначте потрібні теми та згенеруйте об’єднаний тест.
          </p>
        </div>

        {/* Step 1: Subject Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((sId) => {
            const m = SUBJECT_METADATA[sId];
            const isSelected = selectedSubject === sId;
            return (
              <button
                key={sId}
                type="button"
                onClick={() => handleSelectSubject(sId)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {subjectIcons[sId]}
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Source Bank Selector: УЦОЯО / ЗНО UA / Просте ЗНО */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
          <Database className="w-4 h-4 text-zinc-900" />
          <span>База тестових завдань:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all' as SourceFilter, label: 'Усі джерела разом' },
            { id: 'znoua' as SourceFilter, label: 'ЗНО UA (zno.osvita.ua)' },
            { id: 'proste' as SourceFilter, label: 'Просте ЗНО' },
            { id: 'nmt' as SourceFilter, label: 'Сесії НМТ УЦОЯО' },
          ].map((src) => {
            const count = NMT_QUESTIONS.filter(
              (q) =>
                q.subjectId === selectedSubject &&
                selectedTopics.includes(q.topic) &&
                matchesSource(q, src.id)
            ).length;
            const isSelected = sourceFilter === src.id;
            return (
              <button
                key={src.id}
                type="button"
                onClick={() => setSourceFilter(src.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <span>{src.label}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Topics for the chosen discipline */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            1. Оберіть теми з дисципліни «{currentMeta.name}» ({selectedTopics.length} з{' '}
            {currentMeta.topics.length} обрано):
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={handleSelectAllTopics}
              className="font-semibold text-zinc-900 hover:underline"
            >
              Обрати всі {currentMeta.topics.length} тем
            </button>
            <span className="text-zinc-300">·</span>
            <button
              type="button"
              onClick={handleClearTopics}
              className="text-zinc-500 hover:text-zinc-900 hover:underline"
            >
              Залишити лише першу
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {currentMeta.topics.map((topic) => {
            const isChecked = selectedTopics.includes(topic);
            const topicQsCount = NMT_QUESTIONS.filter(
              (q) =>
                q.subjectId === selectedSubject &&
                q.topic === topic &&
                matchesSource(q, sourceFilter)
            ).length;
            const mastery = userStats.subjectStats[selectedSubject].topicMastery[topic];
            const pct =
              mastery && mastery.total > 0
                ? Math.round((mastery.correct / mastery.total) * 100)
                : null;

            return (
              <button
                key={topic}
                type="button"
                onClick={() => handleToggleTopic(topic)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isChecked
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-snug truncate">{topic}</div>
                  <div
                    className={`text-[11px] font-mono mt-1 flex items-center gap-2 ${
                      isChecked ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                  >
                    <span>{topicQsCount} питань</span>
                    {pct !== null && (
                      <>
                        <span>·</span>
                        <span>Засвоєно {pct}%</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Question Count Slider (1 to maxQuestions, up to 32) & Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3 border-t border-zinc-100">
        {/* Left 7 cols: Question Count Selector (1 - 32) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              2. Кількість питань у тесті (залежно від обраних тем):
            </label>
            <span className="font-mono text-sm font-extrabold text-zinc-950 bg-zinc-100 px-3 py-1 rounded-lg">
              {questionCount} з {availablePool.length} доступних (ліміт тесту: 32)
            </span>
          </div>

          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl">
            <button
              type="button"
              onClick={() => setQuestionCount((c) => Math.max(1, c - 1))}
              disabled={questionCount <= 1}
              className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-900 disabled:opacity-40 transition-colors"
              title="Зменшити на 1 питання"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="range"
              min={1}
              max={Math.max(1, maxQuestions)}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="flex-1 accent-zinc-900 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setQuestionCount((c) => Math.min(maxQuestions, c + 1))}
              disabled={questionCount >= maxQuestions}
              className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-900 disabled:opacity-40 transition-colors"
              title="Збільшити на 1 питання"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick count presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 mr-1">Швидкий вибір:</span>
            {[1, 5, 10, 16, 24, maxQuestions]
              .filter((v, i, arr) => v >= 1 && v <= maxQuestions && arr.indexOf(v) === i)
              .map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuestionCount(val)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold border transition-colors ${
                    questionCount === val
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {val === maxQuestions ? `Макс (${val})` : `${val} пит.`}
                </button>
              ))}
          </div>
        </div>

        {/* Right 5 cols: Mixing, Time & Zen Mode Options + Launch Button */}
        <div className="lg:col-span-5 bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              3. Параметри об’єднаного тесту:
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setShuffleOrder(true)}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  shuffleOrder
                    ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                    : 'bg-white text-zinc-700 border-zinc-200'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Перемішати</span>
              </button>

              <button
                type="button"
                onClick={() => setShuffleOrder(false)}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  !shuffleOrder
                    ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                    : 'bg-white text-zinc-700 border-zinc-200'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>За темами</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setIsTimed(true)}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  isTimed
                    ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                    : 'bg-white text-zinc-700 border-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>На час ({Math.max(5, Math.min(60, Math.ceil(questionCount * 1.8)))} хв)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTimed(false)}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  !isTimed
                    ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                    : 'bg-white text-zinc-700 border-zinc-200'
                }`}
              >
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Без часу</span>
              </button>
            </div>

            <label className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg cursor-pointer text-xs">
              <span className="font-medium text-zinc-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Запустити в Режимі Дзен (без відволікань)</span>
              </span>
              <input
                type="checkbox"
                checked={enterZenMode}
                onChange={(e) => setEnterZenMode(e.target.checked)}
                className="accent-zinc-900 w-4 h-4"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleGenerateAndStart}
            disabled={questionCount < 1 || selectedTopics.length === 0}
            className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              Згенерувати та почати тест ({questionCount} пит. · {selectedTopics.length} тем)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
