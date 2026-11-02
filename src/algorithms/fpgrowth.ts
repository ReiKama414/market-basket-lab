// FP-Growth (Frequent Pattern Growth) Algorithm Implementation
import { FrequentItemset, MiningConfig } from '../types/basket';

class FPNode {
  item: string | null;
  count: number;
  parent: FPNode | null;
  children: Map<string, FPNode>;
  nodeLink: FPNode | null;

  constructor(item: string | null = null, count: number = 0, parent: FPNode | null = null) {
    this.item = item;
    this.count = count;
    this.parent = parent;
    this.children = new Map();
    this.nodeLink = null;
  }
}

interface HeaderItem {
  item: string;
  count: number;
  head: FPNode | null;
}

/**
 * Builds an FP-Tree from filtered and sorted transactions
 */
function buildFPTree(
  transactions: string[][],
  minCount: number
): { root: FPNode; headerTable: Map<string, HeaderItem> } {
  // Step 1: Count frequency of each item
  const itemCounts = new Map<string, number>();
  for (const trans of transactions) {
    // Unique items per transaction
    const set = new Set(trans);
    for (const item of set) {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
    }
  }

  // Filter infrequent items
  const headerTable = new Map<string, HeaderItem>();
  for (const [item, count] of itemCounts.entries()) {
    if (count >= minCount) {
      headerTable.set(item, { item, count, head: null });
    }
  }

  // Helper comparator: descending frequency, then alphabetical
  const compareItems = (a: string, b: string) => {
    const countDiff = (itemCounts.get(b) || 0) - (itemCounts.get(a) || 0);
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b);
  };

  const root = new FPNode();

  // Step 2: Insert each transaction into FP-Tree
  for (const trans of transactions) {
    // Deduplicate and filter only frequent items
    const set = new Set(trans);
    const sortedItems = Array.from(set)
      .filter(item => headerTable.has(item))
      .sort(compareItems);

    if (sortedItems.length === 0) continue;

    let currentNode = root;
    for (const item of sortedItems) {
      let childNode = currentNode.children.get(item);
      if (!childNode) {
        childNode = new FPNode(item, 1, currentNode);
        currentNode.children.set(item, childNode);

        // Link in Header Table
        const header = headerTable.get(item)!;
        if (!header.head) {
          header.head = childNode;
        } else {
          let curr = header.head;
          while (curr.nodeLink) {
            curr = curr.nodeLink;
          }
          curr.nodeLink = childNode;
        }
      } else {
        childNode.count += 1;
      }
      currentNode = childNode;
    }
  }

  return { root, headerTable };
}

/**
 * Mines FP-Tree recursively
 */
function mineFPTreeRecursive(
  headerTable: Map<string, HeaderItem>,
  prefix: string[],
  minCount: number,
  maxSize: number,
  totalTransactions: number,
  frequentItemsets: FrequentItemset[]
) {
  // Sort header items in ascending order of frequency
  const sortedHeaderItems = Array.from(headerTable.values()).sort((a, b) => {
    const diff = a.count - b.count;
    if (diff !== 0) return diff;
    return a.item.localeCompare(b.item);
  });

  for (const header of sortedHeaderItems) {
    const item = header.item;
    const itemset = [...prefix, item].sort();
    const supportCount = header.count;

    frequentItemsets.push({
      items: itemset,
      count: supportCount,
      support: supportCount / totalTransactions,
      size: itemset.length
    });

    if (itemset.length >= maxSize) {
      continue;
    }

    // Construct conditional pattern base
    const condPatterns: { path: string[]; count: number }[] = [];
    let currNode = header.head;

    while (currNode) {
      const pathCount = currNode.count;
      const path: string[] = [];
      let parent = currNode.parent;
      while (parent && parent.item !== null) {
        path.push(parent.item);
        parent = parent.parent;
      }

      if (path.length > 0) {
        condPatterns.push({ path: path.reverse(), count: pathCount });
      }
      currNode = currNode.nodeLink;
    }

    // Build conditional tree
    // 1. Count conditional items
    const condItemCounts = new Map<string, number>();
    for (const pat of condPatterns) {
      for (const pItem of pat.path) {
        condItemCounts.set(pItem, (condItemCounts.get(pItem) || 0) + pat.count);
      }
    }

    // Filter by minCount
    const condHeaderTable = new Map<string, HeaderItem>();
    for (const [cItem, cCount] of condItemCounts.entries()) {
      if (cCount >= minCount) {
        condHeaderTable.set(cItem, { item: cItem, count: cCount, head: null });
      }
    }

    if (condHeaderTable.size === 0) continue;

    // Build conditional FP-tree
    const condRoot = new FPNode();
    for (const pat of condPatterns) {
      const sortedCondItems = pat.path
        .filter(cItem => condHeaderTable.has(cItem))
        .sort((a, b) => {
          const diff = (condItemCounts.get(b) || 0) - (condItemCounts.get(a) || 0);
          if (diff !== 0) return diff;
          return a.localeCompare(b);
        });

      let cCurrent = condRoot;
      for (const cItem of sortedCondItems) {
        let cChild = cCurrent.children.get(cItem);
        if (!cChild) {
          cChild = new FPNode(cItem, pat.count, cCurrent);
          cCurrent.children.set(cItem, cChild);

          // Link in conditional header table
          const cHeader = condHeaderTable.get(cItem)!;
          if (!cHeader.head) {
            cHeader.head = cChild;
          } else {
            let trace = cHeader.head;
            while (trace.nodeLink) {
              trace = trace.nodeLink;
            }
            trace.nodeLink = cChild;
          }
        } else {
          cChild.count += pat.count;
        }
        cCurrent = cChild;
      }
    }

    // Recursive call
    mineFPTreeRecursive(
      condHeaderTable,
      itemset,
      minCount,
      maxSize,
      totalTransactions,
      frequentItemsets
    );
  }
}

/**
 * Mines Frequent Itemsets using FP-Growth
 */
export function mineFPGrowth(
  transactions: string[][],
  config: MiningConfig,
  onProgress?: (phase: string, percent: number, message: string) => void
): FrequentItemset[] {
  const totalTransactions = transactions.length;
  if (totalTransactions === 0) return [];

  const minCount = Math.ceil(config.minSupport * totalTransactions);
  onProgress?.('Building FP-Tree', 20, '構建前綴 FP-樹 (FP-Tree) 並初始化頻率頭表...');

  const { headerTable } = buildFPTree(transactions, minCount);

  onProgress?.('Mining Conditional Trees', 45, `開始遞迴探勘條件模式基 (共 ${headerTable.size} 個頻繁項目)...`);

  const frequentItemsets: FrequentItemset[] = [];
  mineFPTreeRecursive(
    headerTable,
    [],
    minCount,
    config.maxItemsetSize,
    totalTransactions,
    frequentItemsets
  );

  onProgress?.('FP-Growth Complete', 85, `FP-Growth 完成，共探勘出 ${frequentItemsets.length} 個頻繁項集`);

  // Ensure deterministic sort: size ascending, then support descending, then items
  frequentItemsets.sort((a, b) => {
    if (a.size !== b.size) return a.size - b.size;
    if (b.support !== a.support) return b.support - a.support;
    return a.items.join(',').localeCompare(b.items.join(','));
  });

  return frequentItemsets;
}
