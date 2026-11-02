import React from 'react';
import { Loader2, XOctagon } from 'lucide-react';
import { WorkerProgressMessage } from '../types/basket';

interface ProgressOverlayProps {
  progress: WorkerProgressMessage | null;
  onCancel: () => void;
}

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({ progress, onCancel }) => {
  if (!progress) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate m-0">
              Web Worker 運算中
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 m-0">
              背景執行緒運算 · 主畫面零卡頓
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-300 font-medium">
            <span className="truncate pr-2">{progress.message}</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">{progress.percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, progress.percent)}%` }}
            />
          </div>
        </div>

        {/* Phase badges & Cancel */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
          <span className="flex items-center space-x-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
            <span>階段: {progress.phase}</span>
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-1 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition"
          >
            <XOctagon className="w-3.5 h-3.5" />
            <span>中斷取消運算</span>
          </button>
        </div>
      </div>
    </div>
  );
};
