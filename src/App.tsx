import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle,
  Database,
  ShoppingBag,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import {
  AlgorithmType,
  AnalysisResult,
  ColumnMapping,
  MiningConfig,
  WorkerMessage,
  WorkerProgressMessage,
  AssociationRule
} from './types/basket';
import { SAMPLE_DATASETS } from './datasets/sampleDatasets';
import { useEscapeKey } from './utils/useEscapeKey';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { TabNav, TabType } from './components/layout/TabNav';
import { MiningControlBar } from './components/MiningControlBar';
import { ControlsPanel } from './components/ControlsPanel';
import { StatusBar } from './components/layout/StatusBar';
import { ProgressOverlay } from './components/ProgressOverlay';
import { RulesTable } from './components/RulesTable';
import { ItemsetsView } from './components/ItemsetsView';
import { CytoscapeNetwork } from './components/CytoscapeNetwork';
import { EChartsScatterPlot } from './components/EChartsScatterPlot';
import { EChartsHeatmap } from './components/EChartsHeatmap';
import { BasketSimulator } from './components/BasketSimulator';
import { ValidationTests } from './components/ValidationTests';
import { DataPreviewModal } from './components/DataPreviewModal';
import { ProjectHistoryModal } from './components/ProjectHistoryModal';
import {
  recordHistory,
  listPinnedRules,
  pinRule,
  unpinRuleByKey,
  ruleKey,
  SavedProject
} from './storage/db';

// Stable reference (a fresh `[]` each render would retrigger effects in ValidationTests)
const EMPTY_TRANSACTIONS: string[][] = [];

const AppContent: React.FC = () => {
  // Dataset state
  const [currentDatasetId, setCurrentDatasetId] = useState<string>('supermarket');
  const [datasetName, setDatasetName] = useState<string>(SAMPLE_DATASETS[0].name);
  const [csvString, setCsvString] = useState<string>(SAMPLE_DATASETS[0].csvContent);
  const [customMapping, setCustomMapping] = useState<ColumnMapping | undefined>(undefined);

  // Mining Config
  const [config, setConfig] = useState<MiningConfig>({
    algorithm: 'fpgrowth',
    minSupport: SAMPLE_DATASETS[0].defaultSupport,
    minConfidence: SAMPLE_DATASETS[0].defaultConfidence,
    minLift: SAMPLE_DATASETS[0].defaultLift,
    maxItemsetSize: 4,
    singleConsequentOnly: true,
    maxTransactionsLimit: 30000
  });

  // Mobile Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('rules');

  // Simulation bridge
  const [simulatedBasketItems, setSimulatedBasketItems] = useState<string[]>([]);

  // Pinned rules state (IndexedDB)
  const [pinnedRuleIds, setPinnedRuleIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Worker & Progress state
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<WorkerProgressMessage | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // Always-fresh dataset identity for the worker callbacks. Handlers that switch dataset and
  // start mining in the same tick would otherwise record history against the *previous* dataset
  // (state updates have not been applied to the closure yet).
  const datasetMetaRef = useRef<{ id: string; name: string }>({
    id: 'supermarket',
    name: SAMPLE_DATASETS[0].name
  });

  // Load pinned rules of the active dataset/project (keyed by stable rule identity)
  useEffect(() => {
    let cancelled = false;
    listPinnedRules(currentDatasetId)
      .then((pinned) => {
        if (cancelled) return;
        setPinnedRuleIds(new Set(pinned.map((p) => ruleKey(p))));
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [currentDatasetId]);

  // Initialize and clean up Web Worker
  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    const worker = new Worker(new URL('./workers/basketWorker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const data = e.data;
      if (data.type === 'PROGRESS') {
        setProgress(data);
      } else if (data.type === 'SUCCESS') {
        setResult(data.result);
        setIsLoading(false);
        setProgress(null);
        setErrorMessage(null);

        // Record history in IndexedDB
        recordHistory({
          id: `hist-${Date.now()}`,
          projectId: datasetMetaRef.current.id,
          datasetName: datasetMetaRef.current.name,
          algorithm: data.result.algorithm,
          executionTimeMs: data.result.executionTimeMs,
          rulesCount: data.result.rules.length,
          itemsetsCount: data.result.frequentItemsets.length,
          config: data.result.config,
          timestamp: Date.now()
        }).catch(console.error);
      } else if (data.type === 'ERROR') {
        setErrorMessage(data.error);
        setIsLoading(false);
        setProgress(null);
      }
    };

    worker.onerror = (err) => {
      console.error('Worker error:', err);
      setErrorMessage(`Web Worker 運算發生錯誤: ${err.message}`);
      setIsLoading(false);
      setProgress(null);
    };

    workerRef.current = worker;
    return worker;
  }, []);

  // Trigger Mining in Web Worker
  const runMining = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setProgress({
      type: 'PROGRESS',
      phase: 'PARSING',
      message: '啟動背景 Web Worker 進行分析...',
      percent: 5
    });

    const worker = initWorker();
    worker.postMessage({
      type: 'START',
      csvString,
      customMapping,
      config
    });
  }, [csvString, customMapping, config, initWorker]);

  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);
  useEscapeKey(isMobileSidebarOpen, closeMobileSidebar);

  // Cancel Worker
  const cancelMining = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsLoading(false);
    setProgress(null);
  }, []);

  // Run mining automatically on mount
  useEffect(() => {
    runMining();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Handle Dataset Selection
  const handleSelectDataset = (datasetId: string) => {
    if (datasetId === 'custom') {
      setIsUploadOpen(true);
      return;
    }

    const ds = SAMPLE_DATASETS.find((d) => d.id === datasetId);
    if (!ds) return;

    datasetMetaRef.current = { id: datasetId, name: ds.name };
    setCurrentDatasetId(datasetId);
    setDatasetName(ds.name);
    setCsvString(ds.csvContent);
    setCustomMapping(undefined);

    const newConfig: MiningConfig = {
      ...config,
      minSupport: ds.defaultSupport,
      minConfidence: ds.defaultConfidence,
      minLift: ds.defaultLift
    };
    setConfig(newConfig);

    setIsLoading(true);
    setProgress({
      type: 'PROGRESS',
      phase: 'PARSING',
      message: `載入範例資料【${ds.name}】...`,
      percent: 5
    });

    const worker = initWorker();
    worker.postMessage({
      type: 'START',
      csvString: ds.csvContent,
      customMapping: undefined,
      config: newConfig
    });
  };

  // Handle Custom CSV Load
  const handleConfirmCustomCSV = (newCsvString: string, mapping: ColumnMapping) => {
    datasetMetaRef.current = { id: 'custom', name: '自訂上傳資料集' };
    setCurrentDatasetId('custom');
    setDatasetName('自訂上傳資料集');
    setCsvString(newCsvString);
    setCustomMapping(mapping);

    setIsLoading(true);
    setProgress({
      type: 'PROGRESS',
      phase: 'PARSING',
      message: '載入自訂 CSV 檔案...',
      percent: 5
    });

    const worker = initWorker();
    worker.postMessage({
      type: 'START',
      csvString: newCsvString,
      customMapping: mapping,
      config
    });
  };

  // Load project from IndexedDB
  const handleLoadSavedProject = (project: SavedProject) => {
    datasetMetaRef.current = { id: project.id, name: project.name };
    setCurrentDatasetId(project.id);
    setDatasetName(project.name);
    setCsvString(project.csvContent);
    setCustomMapping(project.mapping);
    setConfig(project.config);

    setIsLoading(true);
    setProgress({
      type: 'PROGRESS',
      phase: 'PARSING',
      message: `載入已存專案【${project.name}】...`,
      percent: 5
    });

    const worker = initWorker();
    worker.postMessage({
      type: 'START',
      csvString: project.csvContent,
      customMapping: project.mapping,
      config: project.config
    });
  };

  // Switch Algorithm
  const handleChangeAlgorithm = (algo: AlgorithmType) => {
    const updated = { ...config, algorithm: algo };
    setConfig(updated);

    setIsLoading(true);
    setProgress({
      type: 'PROGRESS',
      phase: 'MINING',
      message: `切換演算法為 ${algo.toUpperCase()}...`,
      percent: 15
    });

    const worker = initWorker();
    worker.postMessage({
      type: 'START',
      csvString,
      customMapping,
      config: updated
    });
  };

  // Add rule's antecedent to simulator
  const handleAddToSimulator = (items: string[]) => {
    setSimulatedBasketItems(items);
    setActiveTab('simulator');
  };

  // Toggle rule pin in IndexedDB
  const handleTogglePin = async (rule: AssociationRule) => {
    const key = ruleKey(rule);
    const isPinned = pinnedRuleIds.has(key);
    try {
      if (isPinned) {
        await unpinRuleByKey(currentDatasetId, rule);
      } else {
        await pinRule(rule, currentDatasetId);
      }
    } catch (err) {
      console.error(err);
      return;
    }
    setPinnedRuleIds((prev) => {
      const next = new Set(prev);
      if (isPinned) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
      {/* 1. Studio Header */}
      <Header
        currentDatasetId={currentDatasetId}
        datasetName={datasetName}
        onSelectDataset={handleSelectDataset}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        onRunMining={runMining}
        isLoading={isLoading}
        algorithm={config.algorithm}
        onChangeAlgorithm={handleChangeAlgorithm}
        result={result}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        onOpenProjectHistory={() => setIsProjectModalOpen(true)}
        pinnedCount={pinnedRuleIds.size}
        onViewPinnedRules={() => setActiveTab('rules')}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* 2. Studio Tab Navigation */}
      <TabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rulesCount={result?.rules.length}
        itemsetsCount={result?.frequentItemsets.length}
        networkCount={result?.rules.length ? Math.min(result.rules.length, 150) : undefined}
      />

      {/* 3. Horizontal Mining Control / Threshold Bar */}
      <MiningControlBar
        config={config}
        onChangeConfig={setConfig}
        onApply={runMining}
        isLoading={isLoading}
        totalTransactionsCount={result?.stats.totalTransactions}
        onOpenMobileDrawer={() => setIsMobileSidebarOpen(true)}
      />

      {/* 4. Main Analytical Studio Body */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 min-w-0 space-y-5">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3 text-red-900 dark:text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold block">運算中斷：</span>
              <p className="m-0 break-words">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-2.5 py-1 bg-red-100 dark:bg-red-900/60 hover:bg-red-200 dark:hover:bg-red-800 rounded text-red-800 dark:text-red-200 text-xs transition"
            >
              忽略
            </button>
          </div>
        )}

        {/* 4 Health / KPI Summary Cards (Aligned with insight-canvas) */}
        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
            {/* Card 1: Total Orders */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  交易訂單總筆數
                </div>
                <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                  {result.stats.totalTransactions.toLocaleString()} <span className="text-sm font-normal text-zinc-500 font-sans">筆</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                  平均購物籃 {result.stats.avgBasketSize} 件 · 最大單量 {result.stats.maxBasketSize} 件
                </div>
              </div>
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
                <Database className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Distinct Items */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  相異商品維度
                </div>
                <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                  {result.stats.distinctItemsCount} <span className="text-sm font-normal text-zinc-500 font-sans">種品項</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                  原始 {result.stats.totalRows.toLocaleString()} 列 · 最小單量 {result.stats.minBasketSize} 件
                </div>
              </div>
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Frequent Itemsets */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  頻繁項集規模
                </div>
                <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                  {result.frequentItemsets.length.toLocaleString()} <span className="text-sm font-normal text-zinc-500 font-sans">組組合</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                  最高 k={result.config.maxItemsetSize} 階組合 · 達標 Min Sup ≥ {(result.config.minSupport * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Association Rules */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  探勘關聯規則
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                  {result.rules.length.toLocaleString()} <span className="text-sm font-normal text-zinc-500 font-sans">條規則</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                  Min Conf ≥ {(result.config.minConfidence * 100).toFixed(0)}% · Min Lift ≥ {result.config.minLift.toFixed(2)}x
                </div>
              </div>
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Views Container */}
        {result && (
          <div className="min-w-0">
            {activeTab === 'rules' && (
              <RulesTable
                rules={result.rules}
                projectId={currentDatasetId}
                onAddToSimulator={handleAddToSimulator}
                pinnedRuleIds={pinnedRuleIds}
                onTogglePin={handleTogglePin}
              />
            )}

            {activeTab === 'network' && (
              <CytoscapeNetwork rules={result.rules} />
            )}

            {activeTab === 'itemsets' && (
              <ItemsetsView
                itemsets={result.frequentItemsets}
                itemsetsBySize={result.itemsetsBySize}
                stats={result.stats}
              />
            )}

            {activeTab === 'scatter' && (
              <EChartsScatterPlot rules={result.rules} />
            )}

            {activeTab === 'heatmap' && (
              <EChartsHeatmap rules={result.rules} stats={result.stats} />
            )}

            {activeTab === 'simulator' && (
              <BasketSimulator
                rules={result.rules}
                stats={result.stats}
                initialBasket={simulatedBasketItems}
              />
            )}
          </div>
        )}
      </main>

      {/* 5. Sticky Bottom Studio Status Bar (Aligned with insight-canvas) */}
      <StatusBar result={result} pinnedCount={pinnedRuleIds.size} />

      {/* Mobile Drawer for ControlsPanel */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-sm bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full p-4 overflow-y-auto shadow-2xl flex flex-col space-y-4 animate-in slide-in-from-right duration-200 z-10 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">參數與過濾門檻</span>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="關閉門檻選單"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ControlsPanel
              config={config}
              onChangeConfig={setConfig}
              onApply={() => {
                runMining();
                setIsMobileSidebarOpen(false);
              }}
              isLoading={isLoading}
              totalTransactionsCount={result?.stats.totalTransactions}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {result && (
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs space-y-2">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">資料集簡要</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                  <div>總筆數: {result.stats.totalTransactions} 筆</div>
                  <div>商品數: {result.stats.distinctItemsCount} 種</div>
                  <div>平均件數: {result.stats.avgBasketSize}</div>
                  <div>最大單量: {result.stats.maxBasketSize}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Overlay during Worker run */}
      <ProgressOverlay progress={progress} onCancel={cancelMining} />

      {/* CSV Upload & Column Mapping Modal */}
      <DataPreviewModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onConfirmLoad={handleConfirmCustomCSV}
      />

      {/* Project & History Modal */}
      <ProjectHistoryModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentResult={result}
        csvContent={csvString}
        mapping={customMapping}
        config={config}
        currentDatasetName={datasetName}
        onLoadProject={handleLoadSavedProject}
      />

      {/* Validation Test Suite Modal */}
      {result && (
        <ValidationTests
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          transactions={EMPTY_TRANSACTIONS}
          rules={result.rules}
          itemsets={result.frequentItemsets}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
