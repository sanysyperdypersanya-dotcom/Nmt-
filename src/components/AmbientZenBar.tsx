import React, { useState } from 'react';
import {
  SOUNDSCAPES,
  SoundscapeId,
  ambientAudio,
} from '../utils/ambientAudio';
import { UISettings } from '../types/nmt';
import {
  Volume2,
  VolumeX,
  Headphones,
  Sparkles,
  Minimize2,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';

interface AmbientZenBarProps {
  activeSound: SoundscapeId;
  soundVolume: number;
  onChangeSound: (id: SoundscapeId) => void;
  onChangeVolume: (vol: number) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  uiSettings: UISettings;
  onUpdateUISettings: (settings: UISettings) => void;
}

export const AmbientZenBar: React.FC<AmbientZenBarProps> = ({
  activeSound,
  soundVolume,
  onChangeSound,
  onChangeVolume,
  isZenMode,
  onToggleZenMode,
  uiSettings,
  onUpdateUISettings,
}) => {
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState<boolean>(false);

  const currentSoundMeta =
    SOUNDSCAPES.find((s) => s.id === activeSound) || SOUNDSCAPES[0];

  const handleSelectSound = (id: SoundscapeId) => {
    onChangeSound(id);
    ambientAudio.play(id, soundVolume);
  };

  const handleVolumeSlider = (val: number) => {
    onChangeVolume(val);
    ambientAudio.setVolume(val);
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Background Sound Selector Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            activeSound !== 'off'
              ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
          }`}
          title="Фонові звуки для концентрації (Background Sounds)"
        >
          {activeSound !== 'off' ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <Headphones className="w-3.5 h-3.5" />
          )}
          <span>
            {activeSound === 'off' ? 'Фонові звуки' : currentSoundMeta.shortName}
          </span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        {/* Dropdown Popover for Background Sounds */}
        {isAudioMenuOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-xl shadow-xl p-4 z-50 space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950">
                <Headphones className="w-4 h-4 text-zinc-800" />
                <span>Фонові звуки (Ambient)</span>
              </div>
              {activeSound !== 'off' && (
                <button
                  type="button"
                  onClick={() => handleSelectSound('off')}
                  className="text-[11px] text-rose-600 hover:underline font-medium"
                >
                  Вимкнути
                </button>
              )}
            </div>

            {/* Soundscape options */}
            <div className="space-y-1.5">
              {SOUNDSCAPES.map((sc) => {
                const isSelected = activeSound === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectSound(sc.id)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="text-xs font-bold">{sc.name}</div>
                      <div
                        className={`text-[10px] leading-tight mt-0.5 ${
                          isSelected ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        {sc.description}
                      </div>
                    </div>
                    {isSelected && sc.id !== 'off' && (
                      <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Volume slider */}
            <div className="pt-2 border-t border-zinc-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-600">
                <span className="font-semibold">Гучність фону</span>
                <span className="font-mono">{Math.round(soundVolume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={soundVolume}
                  onChange={(e) => handleVolumeSlider(Number(e.target.value))}
                  className="flex-1 accent-zinc-900 cursor-pointer"
                />
                <Volume2 className="w-3.5 h-3.5 text-zinc-700" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zen Mode Toggle Button */}
      <button
        type="button"
        onClick={onToggleZenMode}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
          isZenMode
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
        }`}
        title="Режим Дзен — прибирає зайві елементи інтерфейсу для максимальної концентрації"
      >
        {isZenMode ? (
          <>
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Вийти з Дзен</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Режим Дзен</span>
          </>
        )}
      </button>

      {/* Extra quick controls when inside full-screen Zen Mode */}
      {isZenMode && (
        <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
          <button
            type="button"
            onClick={() =>
              onUpdateUISettings({
                ...uiSettings,
                fontSizeScale: Math.max(85, uiSettings.fontSizeScale - 5),
              })
            }
            className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-800"
            title="Зменшити шрифт"
          >
            A-
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateUISettings({
                ...uiSettings,
                fontSizeScale: Math.min(145, uiSettings.fontSizeScale + 5),
              })
            }
            className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-800"
            title="Збільшити шрифт"
          >
            A+
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateUISettings({
                ...uiSettings,
                theme: uiSettings.theme === 'dark' ? 'light' : 'dark',
              })
            }
            className="p-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
            title="Перемкнути світлу / темну тему"
          >
            {uiSettings.theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
