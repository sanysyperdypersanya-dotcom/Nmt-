import React from 'react';
import {
  UISettings,
  ThemeMode,
  FontFamilyMode,
  LineSpacingMode,
  LayoutDensityMode,
} from '../types/nmt';
import { DEFAULT_UI_SETTINGS } from '../utils/storage';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Type,
  Minus,
  Plus,
  RotateCcw,
  Sliders,
  Eye,
  AlignLeft,
  Zap,
} from 'lucide-react';

interface InterfaceSettingsModalProps {
  settings: UISettings;
  onUpdateSettings: (newSettings: UISettings) => void;
  onClose: () => void;
}

export const InterfaceSettingsModal: React.FC<InterfaceSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleThemeChange = (theme: ThemeMode) => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleScaleChange = (newScale: number) => {
    const clamped = Math.min(145, Math.max(85, newScale));
    onUpdateSettings({ ...settings, fontSizeScale: clamped });
  };

  const handleFontFamilyChange = (fontFamily: FontFamilyMode) => {
    onUpdateSettings({ ...settings, fontFamily });
  };

  const handleLineSpacingChange = (lineSpacing: LineSpacingMode) => {
    onUpdateSettings({ ...settings, lineSpacing });
  };

  const handleDensityChange = (layoutDensity: LayoutDensityMode) => {
    onUpdateSettings({ ...settings, layoutDensity });
  };

  const scalePresets = [
    { value: 85, label: '85% (Дрібний)' },
    { value: 100, label: '100% (Стандарт)' },
    { value: 115, label: '115% (Збільшений)' },
    { value: 130, label: '130% (Великий)' },
    { value: 145, label: '145% (Макс.)' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-950">
                Детальні налаштування інтерфейсу
              </h2>
              <p className="text-xs text-zinc-500">
                Налаштуйте тему оформлення, розмір шрифту та комфорт читання тестів
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. THEME SELECTION: Світла, Темна, Системна */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            <span>Тема оформлення (Кольорова схема)</span>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                settings.theme === 'light'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Світла</span>
              </div>
              <span className="text-[11px] opacity-80">
                Чистий білий фон і контрастний темний шрифт
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                settings.theme === 'dark'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Moon className="w-4 h-4 text-blue-400" />
                <span>Темна</span>
              </div>
              <span className="text-[11px] opacity-80">
                Знижує втому очей під час вечірньої підготовки
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                settings.theme === 'system'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Monitor className="w-4 h-4 text-emerald-500" />
                <span>Системна</span>
              </div>
              <span className="text-[11px] opacity-80">
                Автоматично за налаштуваннями вашого пристрою
              </span>
            </button>
          </div>
        </div>

        {/* 2. FONT SIZE SCALING: Збільшення / зменшення шрифту */}
        <div className="space-y-3 pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              <span>Масштаб та розмір шрифту</span>
            </label>
            <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded">
              {settings.fontSizeScale}%
            </span>
          </div>

          {/* Stepper controls (-A / Slider / +A) */}
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-3 rounded-xl">
            <button
              type="button"
              onClick={() => handleScaleChange(settings.fontSizeScale - 5)}
              disabled={settings.fontSizeScale <= 85}
              className="px-3 py-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-900 font-bold text-xs flex items-center gap-1 disabled:opacity-40 transition-colors"
              title="Зменшити шрифт (-5%)"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>A-</span>
            </button>

            <input
              type="range"
              min={85}
              max={145}
              step={5}
              value={settings.fontSizeScale}
              onChange={(e) => handleScaleChange(Number(e.target.value))}
              className="flex-1 accent-zinc-900 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => handleScaleChange(settings.fontSizeScale + 5)}
              disabled={settings.fontSizeScale >= 145}
              className="px-3 py-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-900 font-bold text-xs flex items-center gap-1 disabled:opacity-40 transition-colors"
              title="Збільшити шрифт (+5%)"
            >
              <span>A+</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5">
            {scalePresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleScaleChange(preset.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  settings.fontSizeScale === preset.value
                    ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. FONT FAMILY & LINE SPACING */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
          {/* Font family */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Стиль шрифту</span>
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'sans' as FontFamilyMode, name: 'Сучасний (Plus Jakarta Sans)', desc: 'Стандартний чіткий шрифт без зарубок' },
                { id: 'serif' as FontFamilyMode, name: 'Книжковий (Georgia Serif)', desc: 'Класичний шрифт для тривалого читання' },
                { id: 'mono' as FontFamilyMode, name: 'Технічний (JetBrains Mono)', desc: 'Моноширинний шрифт для формул і коду' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFontFamilyChange(f.id)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                    settings.fontFamily === f.id
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <div className="text-xs font-bold">{f.name}</div>
                  <div className="text-[11px] opacity-75">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Line spacing & Density */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Міжрядковий інтервал</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'normal' as LineSpacingMode, label: 'Звичайний' },
                  { id: 'relaxed' as LineSpacingMode, label: 'Комфортний' },
                  { id: 'loose' as LineSpacingMode, label: 'Широкий' },
                ].map((ls) => (
                  <button
                    key={ls.id}
                    type="button"
                    onClick={() => handleLineSpacingChange(ls.id)}
                    className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                      settings.lineSpacing === ls.id
                        ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                        : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {ls.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Додаткові опції екрана</span>
              </label>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer text-xs">
                  <span className="text-zinc-800 font-medium">Показувати верхній таймер до НМТ</span>
                  <input
                    type="checkbox"
                    checked={settings.showTopCountdown}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, showTopCountdown: e.target.checked })
                    }
                    className="accent-zinc-900 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer text-xs">
                  <span className="text-zinc-800 font-medium">Автоперехід після вибору відповіді</span>
                  <input
                    type="checkbox"
                    checked={settings.autoAdvanceOnSingleChoice}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        autoAdvanceOnSingleChoice: e.target.checked,
                      })
                    }
                    className="accent-zinc-900 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Live Typography Preview Box */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Попередній перегляд тексту завдань:
          </div>
          <p className="text-sm font-medium text-zinc-950">
            У прямокутному трикутнику катети дорівнюють 6 см і 8 см. Знайдіть довжину медіани, проведеної до гіпотенузи.
          </p>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onUpdateSettings(DEFAULT_UI_SETTINGS)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Скинути за замовчуванням</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
