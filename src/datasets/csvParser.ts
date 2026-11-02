// CSV Parsing, Column Auto-Detection, and Basket Aggregator
import Papa from 'papaparse';
import { ColumnMapping, DatasetStats } from '../types/basket';

export interface ParseResult {
  transactions: string[][];
  rawRows: Record<string, string>[];
  headers: string[];
  mapping: ColumnMapping;
  stats: DatasetStats;
  warnings: string[];
}

// Regex patterns to guess Order ID columns
const ORDER_REGEX = /(order|invoice|trans|tid|bill|receipt|sale|cart|basket|訂單|單號|發票|序號|購物車|編號|id)/i;

// Regex patterns to guess Product / Item columns
const ITEM_REGEX = /(item|product|description|sku|good|commodity|name|title|商品|品名|名稱|品項|產品)/i;

export function detectColumns(headers: string[]): ColumnMapping {
  let orderCol = '';
  let itemCol = '';

  // 1. Check order col
  for (const h of headers) {
    if (ORDER_REGEX.test(h)) {
      orderCol = h;
      break;
    }
  }

  // 2. Check item col (different from orderCol)
  for (const h of headers) {
    if (h !== orderCol && ITEM_REGEX.test(h)) {
      itemCol = h;
      break;
    }
  }

  // Fallback defaults
  if (!orderCol && headers.length > 0) orderCol = headers[0];
  if (!itemCol && headers.length > 1) itemCol = headers[1];
  if (!itemCol && headers.length === 1) itemCol = headers[0];

  return {
    orderCol,
    itemCol,
    isWideFormat: false
  };
}

export function parseCSVData(
  csvString: string,
  customMapping?: Partial<ColumnMapping>,
  maxTransactionsLimit: number = 30000
): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvString.trim(), {
    header: true,
    skipEmptyLines: 'greedy'
  });

  const rawRows = parsed.data;
  const headers = parsed.meta.fields || [];
  const detected = detectColumns(headers);
  const mapping: ColumnMapping = {
    orderCol: customMapping?.orderCol || detected.orderCol,
    itemCol: customMapping?.itemCol || detected.itemCol,
    isWideFormat: customMapping?.isWideFormat ?? detected.isWideFormat
  };

  const warnings: string[] = [];
  const basketMap = new Map<string, Set<string>>();

  if (mapping.isWideFormat) {
    // Wide format: each row is an order, columns (other than orderCol) are items
    let rowIdx = 0;
    for (const row of rawRows) {
      rowIdx++;
      const orderId = mapping.orderCol && row[mapping.orderCol]
        ? String(row[mapping.orderCol]).trim()
        : `ROW-${rowIdx}`;

      if (!basketMap.has(orderId)) {
        basketMap.set(orderId, new Set<string>());
      }
      const basket = basketMap.get(orderId)!;

      for (const col of headers) {
        if (col === mapping.orderCol) continue;
        const val = row[col];
        if (val && typeof val === 'string') {
          // split commas or semicolons inside wide cell if any
          const splitted = val.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
          for (const item of splitted) {
            basket.add(item);
          }
        }
      }

      if (basketMap.size >= maxTransactionsLimit) {
        warnings.push(`資料量達到安全上限 (${maxTransactionsLimit} 筆訂單)，已截斷後續訂單以確保計算效率。`);
        break;
      }
    }
  } else {
    // Long format: [OrderID, ItemName]
    let rowIdx = 0;
    for (const row of rawRows) {
      rowIdx++;
      const orderVal = row[mapping.orderCol];
      const itemVal = row[mapping.itemCol];

      if (!orderVal || !itemVal) continue;

      const orderId = String(orderVal).trim();
      const item = String(itemVal).trim();

      if (!item) continue;

      let basket = basketMap.get(orderId);
      if (!basket) {
        if (basketMap.size >= maxTransactionsLimit) {
          warnings.push(`資料量達到安全上限 (${maxTransactionsLimit} 筆訂單)，已截斷後續訂單以保護記憶體。`);
          break;
        }
        basket = new Set<string>();
        basketMap.set(orderId, basket);
      }
      basket.add(item);
    }
  }

  // Filter out empty baskets or baskets with only 0 items
  const transactions: string[][] = [];
  const itemCounts = new Map<string, number>();

  let totalItemsInBaskets = 0;
  let maxBasketSize = 0;
  let minBasketSize = Infinity;

  for (const basket of basketMap.values()) {
    if (basket.size === 0) continue;
    const items = Array.from(basket).sort();
    transactions.push(items);

    totalItemsInBaskets += items.length;
    if (items.length > maxBasketSize) maxBasketSize = items.length;
    if (items.length < minBasketSize) minBasketSize = items.length;

    for (const item of items) {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
    }
  }

  if (minBasketSize === Infinity) minBasketSize = 0;

  const totalTransactions = transactions.length;
  const itemFrequencies = Array.from(itemCounts.entries())
    .map(([item, count]) => ({
      item,
      count,
      support: totalTransactions > 0 ? count / totalTransactions : 0
    }))
    .sort((a, b) => b.count - a.count);

  if (rawRows.length > 50000) {
    warnings.push(`原始資料共 ${rawRows.length} 列，已完成匯總為 ${totalTransactions} 筆訂單。`);
  }
  if (itemCounts.size > 2000) {
    warnings.push(`商品相異種類達到 ${itemCounts.size} 種，建議調高 Minimum Support 以免候選項集組合過度膨脹。`);
  }

  const stats: DatasetStats = {
    totalRows: rawRows.length,
    totalTransactions,
    distinctItemsCount: itemCounts.size,
    avgBasketSize: totalTransactions > 0 ? Math.round((totalItemsInBaskets / totalTransactions) * 10) / 10 : 0,
    maxBasketSize,
    minBasketSize,
    itemFrequencies
  };

  return {
    transactions,
    rawRows: rawRows.slice(0, 100), // preserve first 100 rows for preview UI
    headers,
    mapping,
    stats,
    warnings
  };
}
