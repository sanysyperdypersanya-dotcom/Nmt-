import React, { useEffect, useState } from 'react';
import { TestSession, SubjectId } from '../types/nmt';
import { SUBJECT_METADATA, formatTime, getScoreDescriptor, getCurrentNmtYear } from '../utils/scoring';
import { GeometryDiagram } from './GeometryDiagram';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface TestResultsModalProps {
  session: TestSession;
  onRetry: () => void;
  onGoToStats: () => void;
  onClose: () => void;
}

export const TestResultsModal: React.FC<TestResultsModalProps> = ({
  session,
  onRetry,
  onGoToStats,
  onClose,
}) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<SubjectId | 'all'>('all');

  const meta = SUBJECT_METADATA[session.subjectId];
  const { nmtScore, rawPoints, maxRawPoints, percentage } = session.score;
  const scoreDesc = getScoreDescriptor(nmtScore);

  const isSimulation = session.mode === 'simulation' && !!session.subjectScores;
  const subjects: SubjectId[] = ['ukr', 'math', 'history', 'eng'];

  useEffect(() => {
    if (nmtScore >= 160) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [nmtScore]);

  const filteredQuestions = session.questions.filter((q) =>
    filterSubject === 'all' ? true : q.subjectId === filterSubject
  );

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-zinc-100 pb-5">
          <div className="inline-flex p-3 rounded-full bg-zinc-100 text-zinc-900 mb-1">
            {isSimulation ? (
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            ) : (
              <Award className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
            {isSimulation
              ? `Сертифікат симуляції НМТ ${getCurrentNmtYear()}`
              : 'Результати тестування'}
          </h2>
          <div className="text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-2">
            <span>{isSimulation ? 'Усі 4 обов’язкові блоки' : meta.name}</span>
            <span>·</span>
            <span>{session.title}</span>
            <span>·</span>
            <span>{session.isTimed ? 'Тест на час' : 'Без обмеження часу'}</span>
            <span>·</span>
            <span className="flex items-center gap-1 font-mono text-zinc-700">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(session.timeSpentSeconds)}
            </span>
          </div>

          {session.timeExpired && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Час вичерпано — тестування завершено автоматично</span>
            </div>
          )}
        </div>

        {/* Big Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Official 100-200 Scale */}
          <div className="p-4 bg-zinc-950 text-white rounded-xl text-center flex flex-col justify-center">
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
              {isSimulation ? 'Середній бал НМТ' : 'Шкала НМТ (100–200)'}
            </div>
            <div className="text-4xl font-extrabold font-mono text-emerald-400 my-1">
              {nmtScore}
            </div>
            <div className="text-xs font-medium text-zinc-200">{scoreDesc.label}</div>
          </div>

          {/* Raw Points */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center flex flex-col justify-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Тестовий бал
            </div>
            <div className="text-3xl font-bold font-mono text-zinc-900 my-1">
              {rawPoints} / {maxRawPoints}
            </div>
            <div className="text-xs text-zinc-500">{percentage}% правильних відповідей</div>
          </div>

          {/* Verdict / Recommendations */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center flex flex-col justify-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Оцінка готовності
            </div>
            <p className="text-xs text-zinc-700 leading-snug mt-2">
              {scoreDesc.desc}
            </p>
          </div>
        </div>

        {/* 4-Subject Breakdown for Full NMT Simulation */}
        {isSimulation && session.subjectScores && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-900">
              Результати за кожним із 4 предметних блоків:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {subjects.map((sId) => {
                const sMeta = SUBJECT_METADATA[sId];
                const sBreak = session.subjectScores?.[sId];
                if (!sBreak) return null;

                return (
                  <div
                    key={sId}
                    className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1"
                  >
                    <div className="text-xs font-bold text-zinc-900 truncate">
                      {sMeta.name}
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-zinc-950">
                      {sBreak.nmtScore}{' '}
                      <span className="text-xs font-normal text-zinc-500">/ 200</span>
                    </div>
                    <div className="text-[11px] text-zinc-600 font-mono">
                      Тестовий: {sBreak.rawPoints}/{sBreak.maxRawPoints} ({sBreak.percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Question Review */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-zinc-900">
              Детальний розбір завдань ({filteredQuestions.length}):
            </h3>

            {isSimulation && (
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setFilterSubject('all')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    filterSubject === 'all'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  Усі
                </button>
                {subjects.map((sId) => (
                  <button
                    key={sId}
                    type="button"
                    onClick={() => setFilterSubject(sId)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      filterSubject === sId
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {SUBJECT_METADATA[sId].shortName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {filteredQuestions.map((q, idx) => {
              const userAns = session.userAnswers[q.id];
              let isCorrect = false;

              if (q.type === 'single') {
                isCorrect = userAns === q.correctOptionId;
              } else if (q.type === 'numeric') {
                if (userAns !== undefined && userAns !== '') {
                  const numVal = parseFloat(String(userAns).replace(',', '.'));
                  const targetVal = parseFloat(String(q.correctNumeric).replace(',', '.'));
                  isCorrect = Math.abs(numVal - targetVal) < 0.001;
                }
              } else if (q.type === 'matching' && q.correctMatching) {
                let matches = 0;
                Object.entries(q.correctMatching).forEach(([numK, letV]) => {
                  if (userAns && userAns[numK] === letV) matches++;
                });
                isCorrect = matches === Object.keys(q.correctMatching).length;
              }

              const isExpanded = expandedQuestionId === q.id;
              const qSubMeta = SUBJECT_METADATA[q.subjectId];

              return (
                <div
                  key={q.id}
                  className="border border-zinc-200 rounded-lg overflow-hidden bg-white text-xs"
                >
                  <div
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-mono font-bold text-zinc-900 mr-2">
                          №{idx + 1}
                        </span>
                        {isSimulation && (
                          <span className="font-semibold text-zinc-800 mr-2">
                            [{qSubMeta.shortName}]
                          </span>
                        )}
                        <span className="text-zinc-600">{q.topic}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-semibold font-mono ${
                          isCorrect ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isCorrect ? `+${q.maxPoints}` : '0'} б.
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-zinc-50/70 border-t border-zinc-100 space-y-3">
                      {q.context && (
                        <div className="p-3 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                          {q.title && (
                            <div className="font-bold text-zinc-950 mb-1">{q.title}</div>
                          )}
                          {q.context}
                        </div>
                      )}
                      {q.diagramId && <GeometryDiagram diagramId={q.diagramId} compact />}
                      <div className="text-zinc-900 font-medium whitespace-pre-line">
                        {q.text}
                      </div>

                      {q.type === 'single' && (
                        <div className="grid grid-cols-2 gap-2 text-zinc-700">
                          <div>
                            <span className="text-zinc-500">Ваша відповідь: </span>
                            <span
                              className={`font-bold font-mono ${
                                isCorrect ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {userAns || 'Немає'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Правильна відповідь: </span>
                            <span className="font-bold font-mono text-emerald-700">
                              {q.correctOptionId}
                            </span>
                          </div>
                        </div>
                      )}

                      {q.type === 'numeric' && (
                        <div className="grid grid-cols-2 gap-2 text-zinc-700">
                          <div>
                            <span className="text-zinc-500">Ваша відповідь: </span>
                            <span
                              className={`font-bold font-mono ${
                                isCorrect ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {userAns || 'Немає'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Правильна відповідь: </span>
                            <span className="font-bold font-mono text-emerald-700">
                              {q.correctNumeric}
                            </span>
                          </div>
                        </div>
                      )}

                      {q.type === 'matching' && q.correctMatching && (
                        <div className="space-y-1">
                          <div className="text-zinc-500">Правильні відповідності:</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(q.correctMatching).map(([numK, letV]) => {
                              const userL = userAns?.[numK];
                              const matchCorrect = userL === letV;
                              return (
                                <span
                                  key={numK}
                                  className={`px-2 py-0.5 rounded font-mono border ${
                                    matchCorrect
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                >
                                  {numK} ➔ {letV} (Ви: {userL || '—'})
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-white border border-zinc-200 rounded-lg text-zinc-700 leading-relaxed">
                        <span className="font-bold text-zinc-900 block mb-1">
                          Пояснення:
                        </span>
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Пройти ще раз</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg text-xs font-medium transition-colors"
            >
              До вибору предметів
            </button>
            <button
              type="button"
              onClick={onGoToStats}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Переглянути статистику</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
