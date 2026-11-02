import React from 'react';
import { Sliders, ShieldAlert, Sparkles, X } from 'lucide-react';
import { MiningConfig } from '../types/basket';
import { MetricHelpTooltip } from './MetricHelpTooltip';

interface ControlsPanelProps {
  config: MiningConfig;
  onChangeConfig: (newConfig: MiningConfig) => void;
  onApply: () => void;
  isLoading: boolean;
  totalTransactionsCount?: number;
  onCloseMobile?: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  config,
  onChangeConfig,
  onApply,
  isLoading,
  totalTransactionsCount,
  onCloseMobile
}) => {
  const updateConfig = (patch: Partial<MiningConfig>) => {
    onChangeConfig({
      ...config,
      ...patch
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide m-0">
            門檻與探勘參數
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
            即時微調
          </span>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              aria-label="關閉門檻設定"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5 text-zinc-900 dark:text-zinc-100">
        {/* Min Support */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center">
              最低支持度 (Min Support)
              <MetricHelpTooltip metric="support" />
            </span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold text-xs">
              {(config.minSupport * 100).toFixed(1)}%
              {totalTransactionsCount ? (
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] ml-1 font-normal">
                  (≥ {Math.ceil(config.minSupport * totalTransactionsCount)} 筆)
                </span>
              ) : null}
            </span>
          </div>
          <input
            type="range"
            min="0.005"
            max="0.4"
            step="0.005"
            value={config.minSupport}
            aria-label="最低支持度滑桿"
            onChange={(e) => updateConfig({ minSupport: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>0.5% (寬鬆)</span>
            <div className="flex flex-wrap items-center gap-1">
              {[0.02, 0.05, 0.08, 0.15].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateConfig({ minSupport: val })}
                  className={`px-1.5 py-0.5 rounded border text-[10px] transition ${
                    Math.abs(config.minSupport - val) < 0.001
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {(val * 100).toFixed(0)}%
                </button>
              ))}
            </div>
            <span>40% (嚴格)</span>
          </div>
        </div>

        {/* Min Confidence */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center">
              最低信心度 (Min Confidence)
              <MetricHelpTooltip metric="confidence" />
            </span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold text-xs">
              {(config.minConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={config.minConfidence}
            aria-label="最低信心度滑桿"
            onChange={(e) => updateConfig({ minConfidence: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>10% (寬鬆)</span>
            <div className="flex flex-wrap items-center gap-1">
              {[0.2, 0.4, 0.6, 0.8].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateConfig({ minConfidence: val })}
                  className={`px-1.5 py-0.5 rounded border text-[10px] transition ${
                    Math.abs(config.minConfidence - val) < 0.01
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {(val * 100).toFixed(0)}%
                </button>
              ))}
            </div>
            <span>100% (極嚴)</span>
          </div>
        </div>

        {/* Min Lift */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center">
              最低提升度 (Min Lift)
              <MetricHelpTooltip metric="lift" />
            </span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold text-xs">
              {config.minLift.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={config.minLift}
            aria-label="最低提升度滑桿"
            onChange={(e) => updateConfig({ minLift: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>0.5x (無約束)</span>
            <div className="flex flex-wrap items-center gap-1">
              {[1.0, 1.2, 1.5, 2.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateConfig({ minLift: val })}
                  className={`px-1.5 py-0.5 rounded border text-[10px] transition ${
                    Math.abs(config.minLift - val) < 0.05
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {val.toFixed(1)}x
                </button>
              ))}
            </div>
            <span>4.0x (強關聯)</span>
          </div>
        </div>

        {/* Max Itemset Size */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-zinc-700 dark:text-zinc-300 font-medium">最大項集長度 (k-Itemset)</label>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold text-xs">{config.maxItemsetSize} 件組合</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[2, 3, 4, 5].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => updateConfig({ maxItemsetSize: size })}
                className={`py-1.5 rounded-lg border text-xs font-semibold transition ${
                  config.maxItemsetSize === size
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {size} 件
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Toggles & Safeguards */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-zinc-800 dark:text-zinc-200 select-none">
            <input
              type="checkbox"
              checked={config.singleConsequentOnly}
              onChange={(e) => updateConfig({ singleConsequentOnly: e.target.checked })}
              className="rounded bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>後項僅限單一商品 (推薦: A, B → C)</span>
          </label>

          {/* Safety Limit Selector */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-zinc-500 dark:text-zinc-400 shrink-0" />
              資料量上限保護:
            </span>
            <select
              value={config.maxTransactionsLimit || 30000}
              onChange={(e) => updateConfig({ maxTransactionsLimit: parseInt(e.target.value) })}
              aria-label="資料量上限保護選擇"
              className="bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 focus:outline-none"
            >
              <option value="10000">前 10,000 筆訂單</option>
              <option value="30000">前 30,000 筆訂單 (建議)</option>
              <option value="50000">前 50,000 筆訂單</option>
              <option value="100000">全量處理 (10 萬筆)</option>
            </select>
          </div>
        </div>

        {/* Apply Button */}
        <button
          type="button"
          onClick={() => {
            onApply();
            onCloseMobile?.();
          }}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-xs active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>套用門檻並重新計算</span>
        </button>
      </div>
    </div>
  );
};
