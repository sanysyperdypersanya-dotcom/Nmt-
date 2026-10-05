import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Flame,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Monitor,
  Sliders,
  UserPlus,
  ArrowRightLeft,
  Check,
  Lock,
} from 'lucide-react';
import { formatTime, getDynamicNmtSchedule, getCurrentNmtYear } from '../utils/scoring';
import { UISettings, ThemeMode, SiteRegistration } from '../types/nmt';

interface HeaderTimerProps {
  streakDays: number;
  totalAnswered: number;
  userName: string;
  uiSettings: UISettings;
  onUpdateUISettings: (settings: UISettings) => void;
  onOpenSettingsModal: () => void;
  onOpenRegistrationTab?: () => void;
  registrations?: SiteRegistration[];
  activeAccountId?: string;
  onQuickSwitchAccount?: (account: SiteRegistration) => void;
}

export const HeaderTimer: React.FC<HeaderTimerProps> = ({
  streakDays,
  totalAnswered,
  userName,
  uiSettings,
  onUpdateUISettings,
  onOpenSettingsModal,
  onOpenRegistrationTab,
  registrations = [],
  activeAccountId,
  onQuickSwitchAccount,
}) => {
  // 1. Live Countdown to official NMT session (Automatically rolls over every year: 2027 -> 2028 -> 2029...)
  const [nmtYear, setNmtYear] = useState<number>(() => getCurrentNmtYear());

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  // 2. Interactive Study Stopwatch / Exam Timer
  const [timerPreset, setTimerPreset] = useState<number>(60 * 60);
  const [timerRemaining, setTimerRemaining] = useState<number>(60 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isStudyTimerOpen, setIsStudyTimerOpen] = useState<boolean>(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const schedule = getDynamicNmtSchedule(now);
      setNmtYear(schedule.nmtYear);
      const diff = Math.max(0, schedule.targetDateMs - now.getTime());

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });

      // Kyiv date and time
      const dateFormatted = now.toLocaleDateString('uk-UA', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const timeFormatted = now.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentDateTime(`${dateFormatted}, ${timeFormatted}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Study timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerRemaining]);

  const handleSelectPreset = (seconds: number) => {
    setIsTimerRunning(false);
    setTimerPreset(seconds);
    setTimerRemaining(seconds);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerRemaining(timerPreset);
  };

  const handleQuickFontScale = (delta: number) => {
    const next = Math.min(145, Math.max(85, uiSettings.fontSizeScale + delta));
    onUpdateUISettings({ ...uiSettings, fontSizeScale: next });
  };

  const handleQuickTheme = (theme: ThemeMode) => {
    onUpdateUISettings({ ...uiSettings, theme });
  };

  return (
    <header className="border-b border-zinc-200 bg-white">
      {/* Top Banner: Official NMT Countdown */}
      {uiSettings.showTopCountdown && (
        <div className="bg-zinc-950 text-white px-4 py-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            {/* Left: Event label & live Kyiv time */}
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-100">До старту основної сесії НМТ {nmtYear}:</span>
                <span className="text-zinc-400 hidden sm:inline">·</span>
                <span className="text-xs text-zinc-400 font-mono hidden sm:inline">{currentDateTime}</span>
              </div>
            </div>

            {/* Center: Live countdown counter */}
            <div className="flex items-center gap-2 font-mono">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                <span className="text-base font-bold text-zinc-100">{timeLeft.days}</span>
                <span className="text-xs text-zinc-400">дн</span>
              </div>
              <span className="text-zinc-600">:</span>
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                <span className="text-base font-bold text-zinc-100">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-xs text-zinc-400">год</span>
              </div>
              <span className="text-zinc-600">:</span>
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                <span className="text-base font-bold text-zinc-100">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-xs text-zinc-400">хв</span>
              </div>
              <span className="text-zinc-600">:</span>
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                <span className="text-base font-bold text-emerald-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-xs text-zinc-400">сек</span>
              </div>
            </div>

            {/* Right: Quick Study Timer Trigger */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsStudyTimerOpen(!isStudyTimerOpen)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Таймер тренування: {formatTime(timerRemaining)}</span>
                {isStudyTimerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Collapsible Study Timer Controls */}
          {isStudyTimerOpen && (
            <div className="mt-3 pt-3 border-t border-zinc-800 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Режим тренування:</span>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(120 * 60)}
                  className={`px-2.5 py-1 rounded ${timerPreset === 120 * 60 ? 'bg-zinc-100 text-zinc-950 font-medium' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}
                >
                  120 хв (2 блоки)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(60 * 60)}
                  className={`px-2.5 py-1 rounded ${timerPreset === 60 * 60 ? 'bg-zinc-100 text-zinc-950 font-medium' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}
                >
                  60 хв (1 блок)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(10 * 60)}
                  className={`px-2.5 py-1 rounded ${timerPreset === 10 * 60 ? 'bg-zinc-100 text-zinc-950 font-medium' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}
                >
                  10 хв (Бліц)
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="font-mono text-lg font-bold text-zinc-100">{formatTime(timerRemaining)}</div>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded font-medium ${isTimerRunning ? 'bg-amber-500 text-zinc-950' : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'}`}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isTimerRunning ? 'Пауза' : 'Старт'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  title="Скинути таймер"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Bar: Brand, Quick Theme & Font Size Controls, Streak & User Status */}
      {isHeaderCollapsed ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-extrabold text-xs">
              НМТ
            </div>
            <span className="text-sm font-bold text-zinc-950">Тренажер НМТ {nmtYear}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHeaderCollapsed(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer"
            title="Показати верхнє меню"
          >
            <span>Показати верхнє меню</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="w-full lg:w-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              title="Оновити сторінку"
              className="flex items-center gap-3 text-left cursor-pointer group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 group-hover:bg-zinc-800 text-white flex items-center justify-center font-extrabold text-xl shadow-sm tracking-wider transition-colors">
                НМТ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-zinc-950 group-hover:text-zinc-700 transition-colors">
                    Тренажер НМТ {nmtYear}
                  </h1>
                  <span className="text-xs text-zinc-500 hidden sm:inline">·</span>
                  <span className="text-xs font-medium text-emerald-700 hidden sm:inline">
                    Офіційний формат УЦОЯО
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  4 обов'язкові блоки · Симуляції НМТ · Тести за темами · Персональна статистика
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(true)}
              className="lg:hidden p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer shrink-0"
              title="Сховати верхнє меню"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Interface Quick Controls (Theme, Font Size, Settings) + User Status */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {/* Quick Theme Switcher: Світла / Темна / Системна */}
            <div
              className="inline-flex items-center p-1 bg-zinc-100 border border-zinc-200 rounded-lg"
              title="Вибір теми: Світла, Темна, Системна"
            >
              <button
                type="button"
                onClick={() => handleQuickTheme('light')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  uiSettings.theme === 'light'
                    ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
                title="Світла тема"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Світла</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTheme('dark')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  uiSettings.theme === 'dark'
                    ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
                title="Темна тема"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Темна</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTheme('system')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  uiSettings.theme === 'system'
                    ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
                title="Системна тема"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Системна</span>
              </button>
            </div>

            {/* Quick Font Scaling: A- / % / A+ */}
            <div
              className="inline-flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-1 gap-1"
              title="Збільшення та зменшення шрифту"
            >
              <button
                type="button"
                onClick={() => handleQuickFontScale(-5)}
                disabled={uiSettings.fontSizeScale <= 85}
                className="px-2 py-1 rounded text-xs font-bold text-zinc-700 hover:bg-white hover:text-zinc-950 disabled:opacity-40 transition-colors"
                title="Зменшити шрифт"
              >
                A-
              </button>
              <span className="text-[11px] font-mono font-semibold text-zinc-700 px-1">
                {uiSettings.fontSizeScale}%
              </span>
              <button
                type="button"
                onClick={() => handleQuickFontScale(5)}
                disabled={uiSettings.fontSizeScale >= 145}
                className="px-2 py-1 rounded text-xs font-bold text-zinc-700 hover:bg-white hover:text-zinc-950 disabled:opacity-40 transition-colors"
                title="Збільшити шрифт"
              >
                A+
              </button>
            </div>

            {/* Detailed Interface Settings Button */}
            <button
              type="button"
              onClick={onOpenSettingsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-semibold text-zinc-800 transition-colors"
              title="Детальні налаштування інтерфейсу"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Інтерфейс</span>
            </button>

            {/* Streak */}
            <div className="flex items-center gap-1.5 bg-orange-50/70 border border-orange-200 px-3 py-1.5 rounded-lg text-orange-950">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="font-semibold text-xs">
                {streakDays} {streakDays === 1 ? 'день' : streakDays < 5 ? 'дні' : 'днів'}
              </span>
            </div>

            {/* User Avatar & Multi-Account Switcher Dropdown */}
            <div className="relative flex items-center gap-2 pl-3 border-l border-zinc-200">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer"
                title="Переключити акаунт на пристрої"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {userName.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 max-w-[130px] truncate">
                      {userName}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <span>{totalAnswered} завд.</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-medium">
                      {registrations.length} акаунт{registrations.length === 1 ? '' : 'и'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 p-3 space-y-2.5">
                  <div className="flex items-center justify-between px-1 pb-1.5 border-b border-zinc-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Акаунти на пристрої ({registrations.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {registrations.map((acc) => {
                      const isCurr = acc.id === activeAccountId;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            if (acc.pinCode && acc.pinCode.trim().length > 0 && !isCurr) {
                              if (onOpenRegistrationTab) onOpenRegistrationTab();
                            } else if (onQuickSwitchAccount) {
                              onQuickSwitchAccount(acc);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isCurr
                              ? 'bg-zinc-900 text-white'
                              : 'hover:bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCurr
                                  ? 'bg-zinc-800 text-emerald-400'
                                  : 'bg-zinc-200 text-zinc-800'
                              }`}
                            >
                              {acc.fullName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate flex items-center gap-1">
                                <span>{acc.fullName}</span>
                                {acc.pinCode && <Lock className="w-3 h-3 text-amber-500" />}
                              </div>
                              <div
                                className={`text-[10px] truncate ${
                                  isCurr ? 'text-zinc-300' : 'text-zinc-500'
                                }`}
                              >
                                {acc.stats.totalCompletedTests} тестів ·{' '}
                                {acc.stats.totalQuestionsAnswered} пит.
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCurr && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        if (onOpenRegistrationTab) onOpenRegistrationTab();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Керування акаунтами / Додати</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsHeaderCollapsed(true)}
                className="hidden lg:inline-flex p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                title="Сховати верхнє меню"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
