import React, { useState } from 'react';
import { SiteRegistration, UserStats } from '../types/nmt';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Award,
  Trash2,
  GraduationCap,
} from 'lucide-react';

interface ParticipantRegistrationViewProps {
  registrations: SiteRegistration[];
  onAddRegistration: (reg: SiteRegistration) => void;
  onDeleteRegistration: (id: string) => void;
  userStats: UserStats;
  onUpdateUserStats: (stats: UserStats) => void;
}

export const ParticipantRegistrationView: React.FC<ParticipantRegistrationViewProps> = ({
  registrations,
  onAddRegistration,
  onDeleteRegistration,
  userStats,
  onUpdateUserStats,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolOrCity, setSchoolOrCity] = useState('');
  const [targetScore, setTargetScore] = useState<number>(185);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const handleRegisterParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setStatusBanner(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) {
      setErrorBanner("Будь ласка, вкажіть Ім'я та Email для реєстрації учасника.");
      return;
    }

    const nowFormatted = new Date().toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newReg: SiteRegistration = {
      id: `NMT-${Date.now().toString().slice(-6)}`,
      registeredAt: nowFormatted,
      fullName: cleanName,
      email: cleanEmail,
      schoolOrCity: schoolOrCity.trim() || 'Не вказано',
      targetScore: Math.min(200, Math.max(100, Number(targetScore) || 185)),
      questionsAnswered: userStats.totalQuestionsAnswered,
    };

    onAddRegistration(newReg);
    onUpdateUserStats({
      ...userStats,
      userName: cleanName,
    });

    setFullName('');
    setEmail('');
    setSchoolOrCity('');
    setStatusBanner(`Учасника «${cleanName}» успішно зареєстровано!`);
  };

  const handleSelectActiveParticipant = (reg: SiteRegistration) => {
    onUpdateUserStats({
      ...userStats,
      userName: reg.fullName,
    });
    setStatusBanner(`Активний профіль змінено на «${reg.fullName}».`);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Кабінет реєстрації учасника · НМТ 2027</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Реєстрація учасника на тренажері НМТ 2027
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Зареєструйте свій профіль учасника для іменних сертифікатів симуляції НМТ 2027,
              відстеження цільового бала та збереження персонального прогресу.
            </p>
          </div>

          {/* Active Participant Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shrink-0 min-w-[270px] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Поточний учасник
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <UserCheck className="w-3.5 h-3.5" />
                Активний
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                {userStats.userName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-950">{userStats.userName}</div>
                <div className="text-xs text-zinc-500">
                  Пройдено тестів: {userStats.totalCompletedTests} · Завдань:{' '}
                  {userStats.totalQuestionsAnswered}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorBanner && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start justify-between gap-3 text-xs text-red-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-red-600 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {statusBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Form + Registered Participants List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">Анкета учасника НМТ 2027</h3>
              <p className="text-xs text-zinc-500">
                Вкажіть ваші дані для реєстрації на платформі
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterParticipant} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Ім’я та Прізвище учасника *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Наприклад: Олександр Коваленко"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Електронна пошта (Email) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@ukr.net"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Місто / Заклад освіти
                </label>
                <input
                  type="text"
                  value={schoolOrCity}
                  onChange={(e) => setSchoolOrCity(e.target.value)}
                  placeholder="м. Київ, Ліцей №142"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Цільовий бал НМТ (100–200)
                </label>
                <input
                  type="number"
                  min={100}
                  max={200}
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Зареєструватися як учасник</span>
            </button>
          </form>
        </div>

        {/* Registered Participants Table */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  Зареєстровані учасники ({registrations.length})
                </h3>
                <p className="text-xs text-zinc-500">
                  Список учасників, зареєстрованих на цьому пристрої
                </p>
              </div>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl text-xs text-zinc-500">
              Поки що немає зареєстрованих учасників. Заповніть анкету ліворуч, щоб створити
              картку учасника НМТ 2027.
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Дата реєстрації</th>
                    <th className="py-2.5 px-3">Ім’я та Прізвище</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Місто / Заклад</th>
                    <th className="py-2.5 px-3">Ціль</th>
                    <th className="py-2.5 px-3 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {registrations.map((reg) => {
                    const isActive = userStats.userName === reg.fullName;
                    return (
                      <tr key={reg.id} className="hover:bg-zinc-50/80">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                          {reg.id}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                          {reg.registeredAt}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">{reg.fullName}</td>
                        <td className="py-2.5 px-3 text-zinc-600">{reg.email}</td>
                        <td className="py-2.5 px-3 text-zinc-600">{reg.schoolOrCity}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                          {reg.targetScore}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                                Активний
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectActiveParticipant(reg)}
                                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[11px] cursor-pointer"
                              >
                                Обрати
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteRegistration(reg.id)}
                              className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Видалити запис"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
    </div>
  );
};
