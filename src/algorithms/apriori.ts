// Apriori Algorithm Implementation with Inverted Index Support Counting
import { FrequentItemset, MiningConfig } from '../types/basket';

/**
 * Generate candidate k-itemsets from L_{k-1}
 * Joins itemsets that share the first k-2 items
 */
function generateCandidates(prevFrequentItemsets: string[][], k: number): string[][] {
  const candidates: string[][] = [];
  const n = prevFrequentItemsets.length;

  // Set for fast lookup during pruning
  const prevSet = new Set(prevFrequentItemsets.map(itemset => itemset.join('|||')));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const itemset1 = prevFrequentItemsets[i];
      const itemset2 = prevFrequentItemsets[j];

      // Check if first k-2 items match
      let canJoin = true;
      for (let m = 0; m < k - 2; m++) {
        if (itemset1[m] !== itemset2[m]) {
          canJoin = false;
          break;
        }
      }

      if (canJoin) {
        // Form candidate k-itemset
        const candidate = [...itemset1, itemset2[k - 2]].sort();

        // Pruning step: all (k-1) subsets must be in prevFrequentItemsets
        let allSubsetsFrequent = true;
        for (let removeIdx = 0; removeIdx < candidate.length; removeIdx++) {
          const subset = candidate.filter((_, idx) => idx !== removeIdx).join('|||');
          if (!prevSet.has(subset)) {
            allSubsetsFrequent = false;
            break;
          }
        }

        if (allSubsetsFrequent) {
          candidates.push(candidate);
        }
      }
    }
  }

  return candidates;
}

/**
 * Executes Apriori mining on a list of transactions
 * Uses an Inverted Transaction Index for instant subset intersection counting
 */
export function mineApriori(
  transactions: string[][],
  config: MiningConfig,
  onProgress?: (phase: string, percent: number, message: string) => void
): FrequentItemset[] {
  const totalTransactions = transactions.length;
  if (totalTransactions === 0) return [];

  const minCount = Math.ceil(config.minSupport * totalTransactions);
  const frequentItemsets: FrequentItemset[] = [];

  // Step 1: Build inverted index: item -> Set of transaction indices
  onProgress?.('Counting 1-itemsets', 10, '建立倒排索引並統計 1-項集頻率...');
  const itemTransactionMap = new Map<string, number[]>();

  for (let tIdx = 0; tIdx < totalTransactions; tIdx++) {
    const basket = transactions[tIdx];
    // Deduplicate within same basket
    const uniqueItems = new Set(basket);
    for (const item of uniqueItems) {
      let list = itemTransactionMap.get(item);
      if (!list) {
        list = [];
        itemTransactionMap.set(item, list);
      }
      list.push(tIdx);
    }
  }

  // Step 2: Filter L1 (frequent 1-itemsets)
  let currentLevelItemsets: string[][] = [];
  for (const [item, tIndices] of itemTransactionMap.entries()) {
    if (tIndices.length >= minCount) {
      currentLevelItemsets.push([item]);
      frequentItemsets.push({
        items: [item],
        support: tIndices.length / totalTransactions,
        count: tIndices.length,
        size: 1
      });
    }
  }

  // Sort alphabetically
  currentLevelItemsets.sort((a, b) => a[0].localeCompare(b[0]));

  let k = 2;
  const maxK = config.maxItemsetSize;

  // Step 3: Iterate level-by-level up to maxK
  while (currentLevelItemsets.length > 0 && k <= maxK) {
    const progressPercent = Math.min(85, 10 + Math.round(((k - 1) / maxK) * 75));
    onProgress?.(`Mining ${k}-itemsets`, progressPercent, `計算 ${k}-項集候選 (前階項數: ${currentLevelItemsets.length})...`);

    const candidates = generateCandidates(currentLevelItemsets, k);
    if (candidates.length === 0) break;

    const nextFrequentItemsets: string[][] = [];

    // Support counting for candidates using inverted index intersection
    for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
      const candidate = candidates[cIdx];

      // Get transaction list of first item
      let intersected = itemTransactionMap.get(candidate[0]) || [];

      // Intersect with remaining items
      for (let i = 1; i < candidate.length && intersected.length >= minCount; i++) {
        const nextList = itemTransactionMap.get(candidate[i]);
        if (!nextList) {
          intersected = [];
          break;
        }

        // Two-pointer intersection of sorted arrays
        const temp: number[] = [];
        let p1 = 0;
        let p2 = 0;
        while (p1 < intersected.length && p2 < nextList.length) {
          if (intersected[p1] === nextList[p2]) {
            temp.push(intersected[p1]);
            p1++;
            p2++;
          } else if (intersected[p1] < nextList[p2]) {
            p1++;
          } else {
            p2++;
          }
        }
        intersected = temp;
      }

      if (intersected.length >= minCount) {
        nextFrequentItemsets.push(candidate);
        frequentItemsets.push({
          items: candidate,
          support: intersected.length / totalTransactions,
          count: intersected.length,
          size: k
        });
      }
    }

    currentLevelItemsets = nextFrequentItemsets;
    k++;
  }

  onProgress?.('Apriori Complete', 85, `Apriori 挖掘完成，共找出 ${frequentItemsets.length} 個頻繁項集`);
  return frequentItemsets;
}
