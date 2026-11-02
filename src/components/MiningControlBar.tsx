import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { MiningConfig } from '../types/basket';
import { MetricHelpTooltip } from './MetricHelpTooltip';

interface MiningControlBarProps {
  config: MiningConfig;
  onChangeConfig: (newConfig: MiningConfig) => void;
  onApply: () => void;
  isLoading: boolean;
  totalTransactionsCount?: number;
  onOpenMobileDrawer?: () => void;
}

export const MiningControlBar: React.FC<MiningControlBarProps> = ({
  config,
  onChangeConfig,
  onApply,
  isLoading,
  totalTransactionsCount,
  onOpenMobileDrawer
}) => {
  const [activePopover, setActivePopover] = useState<'support' | 'confidence' | 'lift' | 'advanced' | null>(null);

  const updateConfig = (patch: Partial<MiningConfig>) => {
    onChangeConfig({
      ...config,
      ...patch
    });
  };

  const supportPresets = [0.02, 0.05, 0.08, 0.15];
  const confidencePresets = [0.2, 0.4, 0.6, 0.8];
  const liftPresets = [1.0, 1.2, 1.5, 2.0];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-2 text-xs transition-colors">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2.5 min-w-0">
        {/* Left: Quick Parameter Pills & Preset Triggers */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium text-[11px] shrink-0 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">探勘門檻:</span>
          </div>

          {/* Min Support Popover / Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'support' ? null : 'support')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors shrink-0 ${
                activePopover === 'support'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Min Sup:</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                {(config.minSupport * 100).toFixed(1)}%
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {activePopover === 'support' && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setActivePopover(null)} />
                <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-36 sm:top-full mt-1 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 p-3 z-40 text-zinc-900 dark:text-zinc-100 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800 font-semibold text-xs">
                    <span className="flex items-center gap-1">
                      最低支持度 (Min Support)
                      <MetricHelpTooltip metric="support" />
                    </span>
                    <span className="font-mono text-zinc-500">{(config.minSupport * 100).toFixed(1)}%</span>
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
                  <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400">快速預設:</span>
                    <div className="flex items-center gap-1">
                      {supportPresets.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateConfig({ minSupport: val })}
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition ${
                            Math.abs(config.minSupport - val) < 0.001
                              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {(val * 100).toFixed(0)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick presets for Min Support directly in toolbar for easy 1-click access */}
          <div className="hidden md:flex items-center gap-1">
            {supportPresets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => updateConfig({ minSupport: val })}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                  Math.abs(config.minSupport - val) < 0.001
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                    : 'bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {(val * 100).toFixed(0)}%
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

          {/* Min Confidence Popover / Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'confidence' ? null : 'confidence')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors shrink-0 ${
                activePopover === 'confidence'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Min Conf:</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                {(config.minConfidence * 100).toFixed(0)}%
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {activePopover === 'confidence' && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setActivePopover(null)} />
                <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-36 sm:top-full mt-1 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 p-3 z-40 text-zinc-900 dark:text-zinc-100 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800 font-semibold text-xs">
                    <span className="flex items-center gap-1">
                      最低信心度 (Min Confidence)
                      <MetricHelpTooltip metric="confidence" />
                    </span>
                    <span className="font-mono text-zinc-500">{(config.minConfidence * 100).toFixed(0)}%</span>
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
                  <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400">快速預設:</span>
                    <div className="flex items-center gap-1">
                      {confidencePresets.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateConfig({ minConfidence: val })}
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition ${
                            Math.abs(config.minConfidence - val) < 0.01
                              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {(val * 100).toFixed(0)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Min Lift Popover / Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'lift' ? null : 'lift')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors shrink-0 ${
                activePopover === 'lift'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Min Lift:</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                {config.minLift.toFixed(2)}x
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {activePopover === 'lift' && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setActivePopover(null)} />
                <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-36 sm:top-full mt-1 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 p-3 z-40 text-zinc-900 dark:text-zinc-100 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800 font-semibold text-xs">
                    <span className="flex items-center gap-1">
                      最低提升度 (Min Lift)
                      <MetricHelpTooltip metric="lift" />
                    </span>
                    <span className="font-mono text-zinc-500">{config.minLift.toFixed(2)}x</span>
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
                  <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400">快速預設:</span>
                    <div className="flex items-center gap-1">
                      {liftPresets.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateConfig({ minLift: val })}
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition ${
                            Math.abs(config.minLift - val) < 0.05
                              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {val.toFixed(1)}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1 hidden lg:block" />

          {/* k-Itemset Size Selector */}
          <div className="hidden lg:flex items-center gap-1">
            <span className="text-zinc-400 text-[11px]">k 階:</span>
            {[2, 3, 4, 5].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => updateConfig({ maxItemsetSize: size })}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  config.maxItemsetSize === size
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Single Consequent Toggle */}
          <label className="hidden xl:flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600 dark:text-zinc-300 ml-1 select-none">
            <input
              type="checkbox"
              checked={config.singleConsequentOnly}
              onChange={(e) => updateConfig({ singleConsequentOnly: e.target.checked })}
              className="rounded bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>後項僅限單品</span>
          </label>
        </div>

        {/* Right: Data Safety Limit & Apply Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Safeguard Limit */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={config.maxTransactionsLimit || 30000}
              onChange={(e) => updateConfig({ maxTransactionsLimit: parseInt(e.target.value) })}
              aria-label="資料量上限保護選擇"
              className="bg-white dark:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="10000">前 10,000 筆</option>
              <option value="30000">前 30,000 筆 (建議)</option>
              <option value="50000">前 50,000 筆</option>
              <option value="100000">全量處理 (10 萬)</option>
            </select>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={onApply}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md text-xs font-semibold shadow-xs active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>套用門檻並重新計算</span>
          </button>
        </div>
      </div>
    </div>
  );
};
