// Core TypeScript interfaces for Market Basket Analysis

export type AlgorithmType = 'fpgrowth' | 'apriori';

export interface RawRow {
  [key: string]: string | number;
}

export interface ColumnMapping {
  orderCol: string;
  itemCol: string;
  isWideFormat?: boolean; // wide format: each row is an order with multiple item columns
}

export interface Transaction {
  id: string;
  items: string[];
}

export interface FrequentItemset {
  items: string[];
  support: number; // relative support (0 - 1)
  count: number;   // absolute count (frequency)
  size: number;
}

export interface AssociationRule {
  id: string;
  antecedent: string[]; // X
  consequent: string[]; // Y
  support: number;      // P(X ∪ Y)
  confidence: number;   // P(Y | X) = P(X ∪ Y) / P(X)
  lift: number;         // confidence / P(Y)
  conviction: number;   // (1 - P(Y)) / (1 - confidence)
  leverage: number;     // P(X ∪ Y) - P(X) * P(Y)
  zhang?: number;       // Zhang's metric [-1, 1]
  chiSquare?: number;   // Chi-square test statistic
  isSignificant?: boolean; // Chi-square p < 0.05
  count: number;        // transaction count containing X ∪ Y
  antecedentCount: number;
  consequentCount: number;
}

export interface MiningConfig {
  algorithm: AlgorithmType;
  minSupport: number;       // 0.001 - 1.0 (e.g. 0.05 = 5%)
  minConfidence: number;    // 0.01 - 1.0 (e.g. 0.30 = 30%)
  minLift: number;          // e.g. 1.0
  maxItemsetSize: number;   // e.g. 4
  singleConsequentOnly: boolean; // whether consequent size must be 1 (A, B -> C)
  maxRulesLimit?: number;   // safeguard rule limit (e.g. 1000)
  maxTransactionsLimit?: number; // safeguard transaction count
}

export interface DatasetStats {
  totalRows: number;
  totalTransactions: number;
  distinctItemsCount: number;
  avgBasketSize: number;
  maxBasketSize: number;
  minBasketSize: number;
  itemFrequencies: { item: string; count: number; support: number }[];
}

export interface AnalysisResult {
  stats: DatasetStats;
  frequentItemsets: FrequentItemset[];
  itemsetsBySize: { [size: number]: FrequentItemset[] };
  rules: AssociationRule[];
  executionTimeMs: number;
  algorithm: AlgorithmType;
  config: MiningConfig;
}

export interface WorkerProgressMessage {
  type: 'PROGRESS';
  phase: 'PARSING' | 'COUNTING' | 'MINING' | 'RULES' | 'FINALIZING';
  message: string;
  percent: number;
  current?: number;
  total?: number;
}

export interface WorkerSuccessMessage {
  type: 'SUCCESS';
  result: AnalysisResult;
}

export interface WorkerErrorMessage {
  type: 'ERROR';
  error: string;
}

export type WorkerMessage = WorkerProgressMessage | WorkerSuccessMessage | WorkerErrorMessage;

export interface ValidationTestResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  details: string;
  durationMs: number;
}
