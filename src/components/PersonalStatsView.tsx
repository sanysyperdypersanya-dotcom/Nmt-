import React, { useState } from 'react';
import { UserStats, SubjectId, TestSession } from '../types/nmt';
import { SUBJECT_METADATA, formatTime, getScoreDescriptor } from '../utils/scoring';
import {
  Flame,
  Award,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Edit2,
  Check,
  AlertCircle,
  Play,
  ArrowRight,
  BarChart,
  Trash2
} from 'lucide-react';

interface PersonalStatsViewProps {
  userStats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onStartMistakesTest: () => void;
  onReviewPastSession: (session: TestSession) => void;
  onBackToSubjects: () => void;
}

export const PersonalStatsView: React.FC<PersonalStatsViewProps> = ({
  userStats,
  onUpdateStats,
  onStartMistakesTest,
  onReviewPastSession,
  onBackToSubjects,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(userStats.userName);
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<SubjectId>('ukr');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  const subjects: SubjectId[] = ['ukr', 'math', 'history', 'eng'];

  // Calculate composite predicted score across subjects that have at least 1 test
  const activeSubjectScores = subjects
    .map((s) => userStats.subjectStats[s].bestNmtScore)
    .filter((score) => score > 0);

  const averageCompositeScore =
    activeSubjectScores.length > 0
      ? Math.round(activeSubjectScores.reduce((a, b) => a + b, 0) / activeSubjectScores.length)
      : 100;

  const handleSaveName = () => {
    if (tempName.trim()) {
      const updated = { ...userStats, userName: tempName.trim() };
      onUpdateStats(updated);
    }
    setIsEditingName(false);
  };

  const handleClearHistory = () => {
    const reset: UserStats = {
      ...userStats,
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
    onUpdateStats(reset);
    setConfirmClear(false);
  };

  const overallAccuracy =
    userStats.totalQuestionsAnswered > 0
      ? Math.round((userStats.totalCorrectAnswers / userStats.totalQuestionsAnswered) * 100)
      : 0;

  const currentTabMeta = SUBJECT_METADATA[selectedSubjectTab];
  const currentTabStats = userStats.subjectStats[selectedSubjectTab];

  return (
    <div className="space-y-8">
      {/* Header Profile & Big Metric Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {userStats.userName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="px-2 py-1 text-base font-bold border border-zinc-300 rounded text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 rounded bg-zinc-900 text-white"
                      title="Зберегти"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-zinc-950">{userStats.userName}</h2>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-zinc-400 hover:text-zinc-700"
                      title="Редагувати ім’я"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                Підготовка до Національного мультипредметного тесту 2027
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 text-xs font-semibold">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>{userStats.streakDays} дн. серія занять</span>
            </div>

            <button
              onClick={onBackToSubjects}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              До тестів
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Прогнозований бал
            </div>
            <div className="text-3xl font-extrabold font-mono text-zinc-950 my-1">
              {averageCompositeScore > 100 ? averageCompositeScore : '—'}
            </div>
            <div className="text-xs text-zinc-600">Шкала 100–200 балів</div>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Пройдено тестів
            </div>
            <div className="text-3xl font-extrabold font-mono text-zinc-950 my-1">
              {userStats.totalCompletedTests}
            </div>
            <div className="text-xs text-zinc-600">{userStats.history.length} збережено в історії</div>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Розв'язано завдань
            </div>
            <div className="text-3xl font-extrabold font-mono text-zinc-950 my-1">
              {userStats.totalQuestionsAnswered}
            </div>
            <div className="text-xs text-emerald-700 font-medium">
              {userStats.totalCorrectAnswers} правильних
            </div>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Загальна точність
            </div>
            <div className="text-3xl font-extrabold font-mono text-zinc-950 my-1">
              {overallAccuracy}%
            </div>
            <div className="text-xs text-zinc-600">Середній відсоток успіху</div>
          </div>
        </div>
      </div>

      {/* Mistake Review Callout */}
      {userStats.mistakeQuestionIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-100 text-rose-800">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-950">
                Банк помилок: {userStats.mistakeQuestionIds.length} завдань потребують відпрацювання
              </div>
              <div className="text-xs text-rose-700 mt-0.5">
                Повторіть завдання, в яких ви допустили помилку під час проходження тестів, щоб закріпити матеріал.
              </div>
            </div>
          </div>

          <button
            onClick={onStartMistakesTest}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Пройти роботу над помилками</span>
          </button>
        </div>
      )}

      {/* Subject Deep Dive Tabs */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-zinc-950">
            Аналітика за 4 обов'язковими предметами
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Перевірте персональні показники та прогрес засвоєння тем по кожному блоку
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          {subjects.map((sId) => {
            const m = SUBJECT_METADATA[sId];
            const isSelected = selectedSubjectTab === sId;
            const subScore = userStats.subjectStats[sId].bestNmtScore;

            return (
              <button
                key={sId}
                onClick={() => setSelectedSubjectTab(sId)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <span>{m.name}</span>
                {subScore > 0 && (
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-200 text-zinc-800'
                    }`}
                  >
                    {subScore}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Tab Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase">Кращий результат</span>
              <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">
                {currentTabStats.bestNmtScore > 0 ? `${currentTabStats.bestNmtScore} / 200` : 'Немає даних'}
              </div>
              <div className="text-xs text-zinc-500">Офіційна шкала НМТ</div>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase">Середній бал</span>
              <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">
                {currentTabStats.avgNmtScore > 0 ? `${currentTabStats.avgNmtScore} / 200` : '—'}
              </div>
              <div className="text-xs text-zinc-500">За {currentTabStats.testsCompleted} тестів</div>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase">Відсоток успіху</span>
              <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">
                {currentTabStats.questionsAnswered > 0
                  ? `${Math.round((currentTabStats.correctAnswers / currentTabStats.questionsAnswered) * 100)}%`
                  : '0%'}
              </div>
              <div className="text-xs text-zinc-500">
                {currentTabStats.correctAnswers} з {currentTabStats.questionsAnswered} відповідей
              </div>
            </div>
          </div>

          {/* Topic Mastery Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Засвоєння тем у блоці «{currentTabMeta.name}»:
            </h4>

            <div className="space-y-2.5">
              {currentTabMeta.topics.map((topic) => {
                const mastery = currentTabStats.topicMastery[topic];
                const total = mastery ? mastery.total : 0;
                const correct = mastery ? mastery.correct : 0;
                const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

                return (
                  <div
                    key={topic}
                    className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="font-medium text-zinc-900 min-w-[200px]">{topic}</div>

                    <div className="flex-1 max-w-md w-full flex items-center gap-3">
                      <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percent >= 80
                              ? 'bg-emerald-500'
                              : percent >= 50
                              ? 'bg-amber-500'
                              : 'bg-zinc-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="font-mono text-zinc-700 font-semibold shrink-0 w-12 text-right">
                        {total > 0 ? `${percent}%` : '0%'}
                      </span>
                    </div>

                    <div className="text-zinc-500 font-mono shrink-0 text-right">
                      {correct} / {total} прав.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Test History Log */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-950">Історія спроб</h3>
            <p className="text-xs text-zinc-500">
              Останні завершені тестові сесії
            </p>
          </div>

          {userStats.history.length > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-medium">Підтвердити очищення?</span>
                <button
                  onClick={handleClearHistory}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold"
                >
                  Так
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded text-xs font-medium"
                >
                  Ні
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистити історію</span>
              </button>
            )
          )}
        </div>

        {userStats.history.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-200">
            Ви ще не пройшли жодного тесту. Виберіть предмет на головній сторінці, щоб розпочати тренування!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                  <th className="py-2.5 px-3">Дата</th>
                  <th className="py-2.5 px-3">Предмет / Формат</th>
                  <th className="py-2.5 px-3">Назва тесту</th>
                  <th className="py-2.5 px-3">Режим часу</th>
                  <th className="py-2.5 px-3">Тестовий бал</th>
                  <th className="py-2.5 px-3">Шкала НМТ</th>
                  <th className="py-2.5 px-3 text-right">Дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {userStats.history.map((item) => {
                  const m = SUBJECT_METADATA[item.subjectId];
                  const isSim = item.mode === 'simulation';
                  const dateStr = item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-3 text-zinc-500 font-mono">{dateStr}</td>
                      <td className="py-3 px-3 font-semibold text-zinc-900">
                        {isSim ? 'Симуляція НМТ (4 блоки)' : m?.shortName || item.subjectId}
                      </td>
                      <td className="py-3 px-3 text-zinc-700">{item.title}</td>
                      <td className="py-3 px-3 text-zinc-500 font-mono">
                        {item.isTimed ? `На час (${formatTime(item.timeSpentSeconds)})` : `Вільний (${formatTime(item.timeSpentSeconds)})`}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-zinc-900">
                        {item.score.rawPoints} / {item.score.maxRawPoints} ({item.score.percentage}%)
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-zinc-950 bg-zinc-100 px-2 py-0.5 rounded">
                          {item.score.nmtScore} б.
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onReviewPastSession(item)}
                          className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium transition-colors"
                        >
                          Переглянути
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
