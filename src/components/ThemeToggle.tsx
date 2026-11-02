import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { themeMode, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'system', label: '系統', icon: Monitor },
    { mode: 'light', label: '淺色', icon: Sun },
    { mode: 'dark', label: '深色', icon: Moon }
  ];

  return (
    <div
      role="radiogroup"
      aria-label="主題切換"
      className="inline-flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 select-none"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = themeMode === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${opt.label}模式`}
            title={`切換為${opt.label}模式`}
            onClick={() => setThemeMode(opt.mode)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
              isActive
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80 font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {!compact && <span className="hidden sm:inline text-[11px]">{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
