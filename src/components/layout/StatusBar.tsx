import React from 'react';
import { ShieldCheck, Cpu, Clock, Layers, Sparkles, Pin } from 'lucide-react';
import { AnalysisResult } from '../../types/basket';

interface StatusBarProps {
  result: AnalysisResult | null;
  pinnedCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ result, pinnedCount }) => {
  if (!result) {
    return (
      <footer className="bg-zinc-900 dark:bg-black text-zinc-400 border-t border-zinc-800 text-[11px] py-2 px-3 sm:px-4 sticky bottom-0 z-30 select-none transition-colors">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>背景 Web Worker 就緒中...</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-medium text-[10px] sm:text-[11px]">
              本地 Sandbox 零傳輸
            </span>
          </div>
        </div>
      </footer>
    );
  }

  const { stats, frequentItemsets, rules, algorithm, executionTimeMs } = result;

  return (
    <footer className="bg-zinc-900 dark:bg-black text-zinc-400 border-t border-zinc-800 text-[11px] py-2 px-3 sm:px-4 sticky bottom-0 z-30 select-none transition-colors">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Left Stats: Transactions, Items, Rules, Execution */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <span className="text-zinc-400">交易總數:</span>
            <span className="font-mono font-semibold text-zinc-100">
              {stats.totalTransactions.toLocaleString()}
            </span>
            <span className="text-zinc-500 font-normal">筆</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <span className="text-zinc-400">相異商品:</span>
            <span className="font-mono text-zinc-300 font-semibold">{stats.distinctItemsCount}</span>
            <span className="text-[10px] text-zinc-500">
              (均量 {stats.avgBasketSize} · 最大 {stats.maxBasketSize} 件)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Layers className="w-3 h-3 text-zinc-500" />
            <span className="text-zinc-400">頻繁項集:</span>
            <span className="font-mono text-zinc-300 font-semibold">
              {frequentItemsets.length.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Sparkles className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-400">共購規則:</span>
            <span className="font-mono font-bold text-emerald-400">
              {rules.length.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500">條</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span className="text-zinc-400">耗時:</span>
            <span className="font-mono text-zinc-300">{executionTimeMs} ms</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Cpu className="w-3 h-3 text-zinc-500" />
            <span className="text-zinc-400">核心:</span>
            <span className="font-mono uppercase text-zinc-300 font-semibold">{algorithm}</span>
            <span className="text-[10px] text-zinc-500">Web Worker (獨立執行緒)</span>
          </div>
        </div>

        {/* Right Status: Pinned Rules & Local Sandbox Badge */}
        <div className="flex items-center gap-3 shrink-0">
          {pinnedCount > 0 && (
            <div className="flex items-center gap-1 text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
              <Pin className="w-3 h-3 text-amber-400" />
              <span>{pinnedCount} 條釘選規則</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-medium text-[10px] sm:text-[11px] hidden sm:inline">
              本地 Sandbox 零傳輸 · 隱私無洩漏
            </span>
            <span className="font-mono font-medium text-[10px] sm:hidden">
              本地沙盒
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
