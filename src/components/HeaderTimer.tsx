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
  FileSpreadsheet,
} from 'lucide-react';
import { formatTime } from '../utils/scoring';
import { UISettings, ThemeMode } from '../types/nmt';
import { GoogleSignInButton } from './GoogleSheetsRegistrationsView';

interface HeaderTimerProps {
  streakDays: number;
  totalAnswered: number;
  userName: string;
  uiSettings: UISettings;
  onUpdateUISettings: (settings: UISettings) => void;
  onOpenSettingsModal: () => void;
  isGoogleConnected?: boolean;
  onQuickGoogleSignIn?: () => void;
  onOpenSheetsTab?: () => void;
}

export const HeaderTimer: React.FC<HeaderTimerProps> = ({
  streakDays,
  totalAnswered,
  userName,
  uiSettings,
  onUpdateUISettings,
  onOpenSettingsModal,
  isGoogleConnected,
  onQuickGoogleSignIn,
  onOpenSheetsTab,
}) => {
  // 1. Live Countdown to official NMT 2027 session (Starts approx. May 18, 2027 10:00:00 EEST)
  const targetDate = new Date('2027-05-18T10:00:00+03:00').getTime();

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

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = Math.max(0, targetDate - now.getTime());

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
  }, [targetDate]);

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
                <span className="font-semibold text-zinc-100">До старту основної сесії НМТ 2027:</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
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
                Тренажер НМТ 2027
              </h1>
              <span className="text-xs text-zinc-500">·</span>
              <span className="text-xs font-medium text-emerald-700">
                Офіційний формат УЦОЯО
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              4 обов'язкові блоки · Симуляції НМТ · Тести за темами · Персональна статистика
            </p>
          </div>
        </button>

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

          {/* User Avatar & Google Sheets Registration Trigger */}
          <div className="flex items-center gap-2 pl-3 border-l border-zinc-200">
            {!isGoogleConnected && onQuickGoogleSignIn ? (
              <GoogleSignInButton
                onClick={onQuickGoogleSignIn}
                compact
                label="Sign in with Google"
              />
            ) : (
              <button
                type="button"
                onClick={onOpenSheetsTab}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
                title="Відкрити таблицю реєстрацій Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Google Sheets</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSheetsTab}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
              title="Реєстрація учасника та Google Sheets"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs">
                {userName.slice(0, 1).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-zinc-900">{userName}</div>
                <div className="text-[11px] text-zinc-500">{totalAnswered} розв’язано</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
