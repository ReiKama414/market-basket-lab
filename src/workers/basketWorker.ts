// Web Worker for Market Basket Mining
import { mineApriori } from '../algorithms/apriori';
import { mineFPGrowth } from '../algorithms/fpgrowth';
import { generateAssociationRules } from '../algorithms/rules';
import { parseCSVData } from '../datasets/csvParser';
import {
  AnalysisResult,
  ColumnMapping,
  FrequentItemset,
  MiningConfig,
  WorkerMessage
} from '../types/basket';

interface StartMiningPayload {
  type: 'START';
  csvString: string;
  customMapping?: Partial<ColumnMapping>;
  config: MiningConfig;
}

self.onmessage = (event: MessageEvent<StartMiningPayload>) => {
  const { type, csvString, customMapping, config } = event.data;

  if (type !== 'START') return;

  const startTime = performance.now();

  try {
    // 1. Parsing CSV
    self.postMessage({
      type: 'PROGRESS',
      phase: 'PARSING',
      message: '正在解析 CSV 資料與彙總購物籃訂單...',
      percent: 15
    } as WorkerMessage);

    const parseResult = parseCSVData(csvString, customMapping, config.maxTransactionsLimit || 30000);
    const { transactions, stats } = parseResult;

    if (transactions.length === 0) {
      throw new Error('未在資料中找到有效訂單或商品，請檢查欄位映射設定。');
    }

    // 2. Mining Itemsets
    self.postMessage({
      type: 'PROGRESS',
      phase: 'MINING',
      message: `開始使用 ${config.algorithm === 'fpgrowth' ? 'FP-Growth' : 'Apriori'} 演算法探勘頻繁項集...`,
      percent: 30
    } as WorkerMessage);

    let frequentItemsets: FrequentItemset[] = [];

    const handleProgress = (phase: string, percent: number, msg: string) => {
      self.postMessage({
        type: 'PROGRESS',
        phase: 'MINING',
        message: msg,
        percent: Math.min(88, percent)
      } as WorkerMessage);
    };

    if (config.algorithm === 'fpgrowth') {
      frequentItemsets = mineFPGrowth(transactions, config, handleProgress);
    } else {
      frequentItemsets = mineApriori(transactions, config, handleProgress);
    }

    // 3. Generate Association Rules
    self.postMessage({
      type: 'PROGRESS',
      phase: 'RULES',
      message: '計算關聯度量 (Support, Confidence, Lift, Conviction, Leverage)...',
      percent: 90
    } as WorkerMessage);

    const rules = generateAssociationRules(
      frequentItemsets,
      config,
      transactions.length,
      (phase, percent, msg) => {
        self.postMessage({
          type: 'PROGRESS',
          phase: 'RULES',
          message: msg,
          percent
        } as WorkerMessage);
      }
    );

    // Group itemsets by size
    const itemsetsBySize: { [size: number]: FrequentItemset[] } = {};
    for (const itemset of frequentItemsets) {
      if (!itemsetsBySize[itemset.size]) {
        itemsetsBySize[itemset.size] = [];
      }
      itemsetsBySize[itemset.size].push(itemset);
    }

    const executionTimeMs = Math.round(performance.now() - startTime);

    const result: AnalysisResult = {
      stats,
      frequentItemsets,
      itemsetsBySize,
      rules,
      executionTimeMs,
      algorithm: config.algorithm,
      config
    };

    self.postMessage({
      type: 'SUCCESS',
      result
    } as WorkerMessage);

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    self.postMessage({
      type: 'ERROR',
      error: errorMsg
    } as WorkerMessage);
  }
};
