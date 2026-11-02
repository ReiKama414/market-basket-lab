import React, { useState } from 'react';
import {
  ShoppingBag,
  Play,
  UploadCloud,
  Database,
  CheckCircle2,
  Clock,
  RefreshCw,
  FolderArchive,
  Bookmark,
  Menu,
  X,
  Sliders
} from 'lucide-react';
import { AlgorithmType, AnalysisResult } from '../types/basket';
import { SAMPLE_DATASETS } from '../datasets/sampleDatasets';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentDatasetId: string;
  /** Human readable name of the loaded dataset/project (falls back to id when omitted) */
  datasetName?: string;
  onSelectDataset: (datasetId: string) => void;
  onOpenUploadModal: () => void;
  onRunMining: () => void;
  isLoading: boolean;
  algorithm: AlgorithmType;
  onChangeAlgorithm: (algo: AlgorithmType) => void;
  result: AnalysisResult | null;
  onOpenTestModal: () => void;
  onOpenProjectHistory: () => void;
  pinnedCount: number;
  onViewPinnedRules: () => void;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDatasetId,
  datasetName,
  onSelectDataset,
  onOpenUploadModal,
  onRunMining,
  isLoading,
  algorithm,
  onChangeAlgorithm,
  result,
  onOpenTestModal,
  onOpenProjectHistory,
  pinnedCount,
  onViewPinnedRules,
  onToggleMobileSidebar
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentDataset = SAMPLE_DATASETS.find(d => d.id === currentDatasetId);
  const isSampleDataset = !!currentDataset;
  const datasetDisplayName =
    datasetName || (currentDataset ? currentDataset.name : currentDatasetId === 'custom' ? '自訂上傳資料集' : currentDatasetId);

  return (
    <header className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 select-none transition-colors">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Brand & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Sidebar Trigger (Drawer) */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none"
            aria-label="開啟門檻設定側邊欄"
            title="開啟門檻設定側邊欄"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Logo */}
          <div className="p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          {/* Brand Titles */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight font-mono truncate">
                Market Basket <span className="font-normal text-zinc-500 dark:text-zinc-400">Lab</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded shrink-0 inline-block font-mono">
                PRO
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 hidden md:block truncate m-0">
              購物籃關聯分析工作室 · 本地極速運算
            </p>
          </div>

          {/* Current Dataset Badge */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2 pl-3 border-l border-zinc-200 dark:border-zinc-800 min-w-0">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs shrink-0">資料集:</span>
            <span className="font-medium text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 max-w-[180px] truncate">
              {datasetDisplayName}
            </span>
          </div>
        </div>

        {/* Center: Desktop Quick Controls */}
        <div className="hidden lg:flex items-center space-x-2">
          {/* Dataset Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
            <Database className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ml-2 mr-1 shrink-0" />
            <select
              value={currentDatasetId}
              onChange={(e) => onSelectDataset(e.target.value)}
              aria-label="選擇資料集"
              className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 border-none focus:outline-none pr-2 py-1 cursor-pointer font-medium max-w-[190px] truncate"
            >
              {!isSampleDataset && currentDatasetId !== 'custom' && (
                <option value={currentDatasetId} disabled className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {datasetDisplayName}
                </option>
              )}
              {SAMPLE_DATASETS.map((ds) => (
                <option key={ds.id} value={ds.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {ds.name}
                </option>
              ))}
              <option value="custom" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold">
                📂 匯入自訂 CSV 檔案
              </option>
            </select>
          </div>

          {/* Import CSV */}
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition"
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span>匯入 CSV</span>
          </button>

          {/* Project History */}
          <button
            type="button"
            onClick={onOpenProjectHistory}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-700 transition"
            title="查看 IndexedDB 專案與歷次探勘紀錄"
          >
            <FolderArchive className="w-3.5 h-3.5 shrink-0" />
            <span>專案庫</span>
          </button>

          {/* Pinned Rules */}
          {pinnedCount > 0 && (
            <button
              type="button"
              onClick={onViewPinnedRules}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 text-xs font-medium transition"
              title="查看已釘選商務規則"
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-current" />
              <span>釘選 ({pinnedCount})</span>
            </button>
          )}

          {/* Algorithm Toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => onChangeAlgorithm('fpgrowth')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                algorithm === 'fpgrowth'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="FP-Growth (Frequent Pattern Tree) - 速度快"
            >
              FP-Growth
            </button>
            <button
              type="button"
              onClick={() => onChangeAlgorithm('apriori')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                algorithm === 'apriori'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Apriori - 經典候選剪枝"
            >
              Apriori
            </button>
          </div>

          {/* Validation Suite */}
          <button
            type="button"
            onClick={onOpenTestModal}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium transition"
            title="開啟規則驗證與數學測試套件"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>規則驗證</span>
          </button>
        </div>

        {/* Right: Theme Toggle & Primary Run Button & Mobile Hamburger */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Primary Run Button */}
          <button
            type="button"
            onClick={onRunMining}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 ${
              isLoading
                ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-75'
                : 'bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">運算中...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>執行探勘</span>
              </>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none"
            aria-label="切換功能選單"
            title="切換功能選單"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu Sheet */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              切換資料集
            </label>
            <select
              value={currentDatasetId}
              onChange={(e) => {
                onSelectDataset(e.target.value);
                setMobileMenuOpen(false);
              }}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              {!isSampleDataset && currentDatasetId !== 'custom' && (
                <option value={currentDatasetId} disabled className="bg-white dark:bg-zinc-900">
                  {datasetDisplayName}
                </option>
              )}
              {SAMPLE_DATASETS.map((ds) => (
                <option key={ds.id} value={ds.id} className="bg-white dark:bg-zinc-900">
                  {ds.name}
                </option>
              ))}
              <option value="custom" className="bg-white dark:bg-zinc-900 font-semibold">
                📂 匯入自訂 CSV 檔案
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onChangeAlgorithm(algorithm === 'fpgrowth' ? 'apriori' : 'fpgrowth');
              }}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"
            >
              <span>演算法: {algorithm.toUpperCase()}</span>
            </button>
            <button
              type="button"
              onClick={() => { onOpenUploadModal(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>匯入 CSV</span>
            </button>
            <button
              type="button"
              onClick={() => { onOpenProjectHistory(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>專案庫</span>
            </button>
            <button
              type="button"
              onClick={() => { onOpenTestModal(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>規則驗證</span>
            </button>
            {pinnedCount > 0 && (
              <button
                type="button"
                onClick={() => { onViewPinnedRules(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 text-xs font-medium col-span-2"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>釘選 ({pinnedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Benchmark Stats Bar in Header */}
      {result && (
        <div className="bg-zinc-100/70 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-1.5 font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
              <Clock className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              <span>耗時: <strong className="text-zinc-900 dark:text-zinc-100">{result.executionTimeMs} ms</strong></span>
            </span>
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
              <span>訂單數: <strong className="text-zinc-900 dark:text-zinc-100">{result.stats.totalTransactions.toLocaleString()}</strong> 筆</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
              <span>商品種類: <strong className="text-zinc-900 dark:text-zinc-100">{result.stats.distinctItemsCount}</strong> 種</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
              <span>頻繁項集: <strong className="text-zinc-900 dark:text-zinc-100">{result.frequentItemsets.length}</strong> 個</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
              <span>共購規則: <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{result.rules.length}</strong> 條</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              演算法: {result.algorithm.toUpperCase()}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              平均購物籃: {result.stats.avgBasketSize} 件
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
