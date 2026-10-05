import React, { useState } from 'react';
import {
  SiteRegistration,
  UserStats,
  SubjectId,
} from '../types/nmt';
import { createBlankUserStats } from '../utils/storage';
import { getCurrentNmtYear } from '../utils/scoring';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Trash2,
  Building2,
  Lock,
  ArrowRightLeft,
  Download,
  BarChart2,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface ParticipantRegistrationViewProps {
  registrations: SiteRegistration[];
  activeAccountId: string;
  onSwitchAccount: (account: SiteRegistration) => void;
  onAddRegistration: (reg: SiteRegistration, switchImmediately: boolean) => void;
  onDeleteRegistration: (id: string) => void;
  userStats: UserStats;
  onGoToStats: () => void;
}

function computeAverageNmtAcrossSubjects(stats: UserStats): number {
  const subs: SubjectId[] = ['ukr', 'math', 'history', 'eng'];
  const activeScores = subs
    .map((s) => stats.subjectStats[s]?.avgNmtScore || 0)
    .filter((v) => v > 0);
  if (activeScores.length === 0) return 0;
  return Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length);
}

export const ParticipantRegistrationView: React.FC<ParticipantRegistrationViewProps> = ({
  registrations,
  activeAccountId,
  onSwitchAccount,
  onAddRegistration,
  onDeleteRegistration,
  userStats,
  onGoToStats,
}) => {
  // New Account Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolOrCity, setSchoolOrCity] = useState('');
  const [targetScore, setTargetScore] = useState<number>(190);
  const [pinCode, setPinCode] = useState<string>('');
  const [switchAfterCreate, setSwitchAfterCreate] = useState<boolean>(true);

  // PIN Verification Modal State when switching to a PIN-protected account
  const [pinPromptAccount, setPinPromptAccount] = useState<SiteRegistration | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Alerts
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const activeAccount =
    registrations.find((r) => r.id === activeAccountId) || registrations[0];
  const nmtYear = getCurrentNmtYear();

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setStatusBanner(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) {
      setErrorBanner("Будь ласка, заповніть Ім'я та Email для реєстрації нового акаунту.");
      return;
    }

    if (pinCode.trim() && !/^\d{4}$/.test(pinCode.trim())) {
      setErrorBanner('PIN-код має складатися рівно з 4 цифр (або залиште поле порожнім).');
      return;
    }

    const nowFormatted = new Date().toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const freshStats = createBlankUserStats(cleanName);

    const newAccount: SiteRegistration = {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      registeredAt: nowFormatted,
      fullName: cleanName,
      email: cleanEmail,
      phone: phone.trim() || '+380 (--) --- -- --',
      schoolOrCity: schoolOrCity.trim() || 'Не вказано',
      targetScore: Math.min(200, Math.max(100, Number(targetScore) || 190)),
      pinCode: pinCode.trim(),
      questionsAnswered: 0,
      stats: freshStats,
    };

    onAddRegistration(newAccount, switchAfterCreate);

    setFullName('');
    setEmail('');
    setPhone('');
    setSchoolOrCity('');
    setPinCode('');
    setStatusBanner(
      switchAfterCreate
        ? `Створено новий акаунт «${cleanName}» та виконано перехід у його профіль!`
        : `Акаунт «${cleanName}» додано до списку профілів на цьому пристрої.`
    );
  };

  const handleRequestSwitchAccount = (account: SiteRegistration) => {
    setErrorBanner(null);
    if (account.id === activeAccountId) return;

    if (account.pinCode && account.pinCode.trim().length > 0) {
      setPinPromptAccount(account);
      setEnteredPin('');
      setPinError(null);
    } else {
      onSwitchAccount(account);
      setStatusBanner(
        `Ви переключилися на акаунт «${account.fullName}». Усі бали, історія тестів та помилки оновлені!`
      );
    }
  };

  const handleConfirmPinSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptAccount) return;
    if (enteredPin.trim() === pinPromptAccount.pinCode) {
      onSwitchAccount(pinPromptAccount);
      setStatusBanner(
        `Вхід виконано: активний акаунт «${pinPromptAccount.fullName}».`
      );
      setPinPromptAccount(null);
      setEnteredPin('');
    } else {
      setPinError('Невірний PIN-код акаунту. Спробуйте ще раз.');
    }
  };

  const handleExportAccountsCSV = () => {
    const headers = [
      'ID Акаунту',
      'Дата реєстрації',
      'ПІБ Учасника',
      'Email',
      'Телефон',
      'Заклад / Місто',
      'Цільовий бал НМТ',
      'Пройдено тестів',
      "Розв'язано завдань",
      'Середній бал НМТ',
      'Помилок на опрацюванні',
    ];

    const rows = registrations.map((r) => [
      r.id,
      `"${r.registeredAt}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${r.email}"`,
      `"${r.phone || ''}"`,
      `"${r.schoolOrCity.replace(/"/g, '""')}"`,
      r.targetScore,
      r.stats.totalCompletedTests,
      r.stats.totalQuestionsAnswered,
      computeAverageNmtAcrossSubjects(r.stats) || '—',
      r.stats.mistakeQuestionIds.length,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nmt_${nmtYear}_accounts_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* 1. HERO BANNER: MULTI-ACCOUNT SYSTEM ON ONE DEVICE */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Мультиакаунт-Система · НМТ {nmtYear}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Керування акаунтами учасників на одному пристрої
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              На одному комп’ютері, планшеті чи в навчальному класі може бути зареєстровано
              декілька незалежних акаунтів. Кожен користувач має <strong>власну ізольовану статистику</strong>,
              історію пройдених симуляцій та індивідуальний список помилок.
            </p>
          </div>

          {/* Active Account Status Box */}
          {activeAccount && (
            <div className="bg-white border-2 border-zinc-900 rounded-2xl p-5 shrink-0 min-w-[300px] space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Зараз активний профіль
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {activeAccount.id}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-extrabold text-base">
                  {activeAccount.fullName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold text-zinc-950 truncate">
                    {activeAccount.fullName}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {activeAccount.schoolOrCity} · Ціль: {activeAccount.targetScore} б.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center">
                <div className="bg-zinc-50 rounded-lg p-2">
                  <div className="font-mono text-sm font-bold text-zinc-950">
                    {userStats.totalCompletedTests}
                  </div>
                  <div className="text-[10px] text-zinc-500">Тестів</div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-2">
                  <div className="font-mono text-sm font-bold text-zinc-950">
                    {userStats.totalQuestionsAnswered}
                  </div>
                  <div className="text-[10px] text-zinc-500">Завдань</div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-2">
                  <div className="font-mono text-sm font-bold text-emerald-700">
                    {computeAverageNmtAcrossSubjects(userStats) || '—'}
                  </div>
                  <div className="text-[10px] text-zinc-500">Сер. НМТ</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoToStats}
                className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Переглянути детальну статистику цього акаунту</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ALERTS */}
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

      {/* 2. FAST ACCOUNT SWITCHER CARDS (Усі акаунти на цьому пристрої) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
              <span>Швидке перемикання між акаунтами на пристрої ({registrations.length})</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Натисніть «Переключитися», щоб завантажити особисту статистику, помилки та історію
              тестів обраного користувача
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportAccountsCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Експорт звіту всіх акаунтів (CSV)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registrations.map((acc) => {
            const isCurrent = acc.id === activeAccountId;
            const avgScore = computeAverageNmtAcrossSubjects(acc.stats);

            return (
              <div
                key={acc.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                  isCurrent
                    ? 'border-2 border-zinc-950 bg-white shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Avatar, Name, ID */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isCurrent
                            ? 'bg-zinc-950 text-white'
                            : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                        }`}
                      >
                        {acc.fullName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-zinc-950 truncate">
                            {acc.fullName}
                          </h4>
                          {acc.pinCode && (
                            <span
                              title="Захищено PIN-кодом"
                              className="inline-flex items-center text-amber-600"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">{acc.email}</div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-600 shrink-0">
                      {acc.id}
                    </span>
                  </div>

                  {/* School / Phone / Target Info */}
                  <div className="text-xs text-zinc-600 space-y-1 bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Заклад / Місто:</span>
                      <span className="font-medium text-zinc-800 truncate max-w-[170px]">
                        {acc.schoolOrCity}
                      </span>
                    </div>
                    {acc.phone && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Телефон:</span>
                        <span className="font-mono text-zinc-700">{acc.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Цільовий бал НМТ:</span>
                      <span className="font-mono font-bold text-zinc-900">{acc.targetScore} б.</span>
                    </div>
                  </div>

                  {/* Isolated Account Stats Summary */}
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <div className="font-mono text-xs font-bold text-zinc-900">
                        {acc.stats.totalCompletedTests}
                      </div>
                      <div className="text-[10px] text-zinc-500">Тестів</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <div className="font-mono text-xs font-bold text-zinc-900">
                        {acc.stats.totalQuestionsAnswered}
                      </div>
                      <div className="text-[10px] text-zinc-500">Питань</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <div className="font-mono text-xs font-bold text-emerald-700">
                        {avgScore || '—'}
                      </div>
                      <div className="text-[10px] text-zinc-500">Бал НМТ</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <div className="font-mono text-xs font-bold text-amber-700">
                        {acc.stats.mistakeQuestionIds.length}
                      </div>
                      <div className="text-[10px] text-zinc-500">Помилок</div>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                  {isCurrent ? (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      <span>Активний акаунт на пристрої</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestSwitchAccount(acc)}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Переключитися на цей акаунт</span>
                    </button>
                  )}

                  {registrations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteRegistration(acc.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Видалити акаунт з пристрою"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. REGISTRATION FORM + SUMMARY TABLE OF ALL ACCOUNTS ON DEVICE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Register New Account on Device */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">
                Додати новий акаунт на пристрій
              </h3>
              <p className="text-xs text-zinc-500">
                Створює окремий ізольований профіль із власною статистикою
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Ім’я та Прізвище учасника / учня *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Наприклад: Ірина Мельник"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@ukr.net"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380 (67) 123-45-67"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Заклад освіти / Група / Місто
                </label>
                <input
                  type="text"
                  value={schoolOrCity}
                  onChange={(e) => setSchoolOrCity(e.target.value)}
                  placeholder="Група А-1 · м. Київ"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1">
                  Цільовий бал НМТ (100–200)
                </label>
                <input
                  type="number"
                  min={100}
                  max={200}
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                PIN-код входу (4 цифри, опційно — для захисту профілю на спільному пристрої)
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Напр.: 1234 (залиште порожнім для входу без пароля)"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-700 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={switchAfterCreate}
                onChange={(e) => setSwitchAfterCreate(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span>Одразу переключитися на цей новий акаунт після реєстрації</span>
            </label>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Зареєструвати новий акаунт на пристрої</span>
            </button>
          </form>
        </div>

        {/* Right 7 Cols: Multi-Account Comparison Table & Overview */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">
                    Зведена відомість акаунтів на цьому пристрої
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Порівняння прогресу всіх зареєстрованих користувачів
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                    <th className="py-2.5 px-3 font-bold">Учасник</th>
                    <th className="py-2.5 px-3 font-bold">Заклад / Місто</th>
                    <th className="py-2.5 px-3 font-bold text-center">Ціль</th>
                    <th className="py-2.5 px-3 font-bold text-center">Тестів</th>
                    <th className="py-2.5 px-3 font-bold text-center">Сер. НМТ</th>
                    <th className="py-2.5 px-3 font-bold text-right">Дія</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {registrations.map((acc) => {
                    const isCurr = acc.id === activeAccountId;
                    const avg = computeAverageNmtAcrossSubjects(acc.stats);
                    return (
                      <tr
                        key={acc.id}
                        className={isCurr ? 'bg-emerald-50/40 font-medium' : 'hover:bg-zinc-50'}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                            <span>{acc.fullName}</span>
                            {acc.pinCode && <Lock className="w-3 h-3 text-amber-500" />}
                          </div>
                          <div className="text-[11px] text-zinc-500">{acc.email}</div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600">{acc.schoolOrCity}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-800">
                          {acc.targetScore}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-zinc-800">
                          {acc.stats.totalCompletedTests}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {avg || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isCurr ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Активний
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRequestSwitchAccount(acc)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Увійти
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 flex items-start gap-3 text-xs text-zinc-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900">
                Як працює перемикання акаунтів на одному пристрої:
              </strong>{' '}
              Кожен учень чи користувач має власний профіль (за бажанням захищений 4-значним
              PIN-кодом). Під час перемикання акаунту у верхній шапці сайту або на цій сторінці
              миттєво завантажуються лише його власні результати тестів, серія днів (streak),
              помилки та статистика за предметами.
            </div>
          </div>
        </div>
      </div>

      {/* PIN VERIFICATION MODAL WHEN SWITCHING TO A PROTECTED ACCOUNT */}
      {pinPromptAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-zinc-950">Вхід у захищений акаунт</h4>
              </div>
              <button
                type="button"
                onClick={() => setPinPromptAccount(null)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Введіть 4-значний PIN-код для переключення на акаунт{' '}
              <strong>«{pinPromptAccount.fullName}»</strong>:
            </p>

            <form onSubmit={handleConfirmPinSwitch} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-mono font-bold px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              />
              {pinError && <div className="text-xs text-red-600 font-medium">{pinError}</div>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPinPromptAccount(null)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-semibold cursor-pointer"
                >
                  Підтвердити та увійти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
