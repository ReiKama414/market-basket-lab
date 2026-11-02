// Association Rule Generation & Metric Calculations
import { AssociationRule, FrequentItemset, MiningConfig } from '../types/basket';

/**
 * Helper to get all non-empty proper subsets of an array
 */
function getAllSubsets<T>(array: T[]): T[][] {
  const subsets: T[][] = [];
  const n = array.length;
  const totalSubsets = (1 << n) - 1; // 2^n - 1 (exclude full set later)

  for (let i = 1; i < totalSubsets; i++) {
    const subset: T[] = [];
    for (let j = 0; j < n; j++) {
      if ((i & (1 << j)) !== 0) {
        subset.push(array[j]);
      }
    }
    subsets.push(subset);
  }

  return subsets;
}

/**
 * Generate association rules from frequent itemsets
 */
export function generateAssociationRules(
  frequentItemsets: FrequentItemset[],
  config: MiningConfig,
  totalTransactions: number,
  onProgress?: (phase: string, percent: number, message: string) => void
): AssociationRule[] {
  // Create quick lookup map for itemset support
  const supportMap = new Map<string, { support: number; count: number }>();
  for (const itemset of frequentItemsets) {
    const key = [...itemset.items].sort().join('|||');
    supportMap.set(key, { support: itemset.support, count: itemset.count });
  }

  // Filter only itemsets with size >= 2
  const candidateItemsets = frequentItemsets.filter(itemset => itemset.size >= 2);
  const rules: AssociationRule[] = [];
  const maxRules = config.maxRulesLimit || 2000;

  onProgress?.('Generating Rules', 90, `從 ${candidateItemsets.length} 個多項目項集中衍生關聯規則...`);

  let ruleIndex = 0;
  for (const itemset of candidateItemsets) {
    const items = [...itemset.items].sort();
    const itemsetKey = items.join('|||');
    const itemsetData = supportMap.get(itemsetKey);
    if (!itemsetData) continue;

    const supportXY = itemsetData.support;
    const countXY = itemsetData.count;

    // Generate non-empty proper subsets as antecedent X
    const subsets = getAllSubsets(items);

    for (const subset of subsets) {
      const antecedent = [...subset].sort();
      const antecedentKey = antecedent.join('|||');
      const antecedentData = supportMap.get(antecedentKey);
      if (!antecedentData) continue;

      const supportX = antecedentData.support;
      const countX = antecedentData.count;

      // Consequent Y = itemset \ antecedent
      const antecedentSet = new Set(antecedent);
      const consequent = items.filter(item => !antecedentSet.has(item)).sort();

      // If user requires single-consequent rules (A, B -> C)
      if (config.singleConsequentOnly && consequent.length !== 1) {
        continue;
      }

      const consequentKey = consequent.join('|||');
      const consequentData = supportMap.get(consequentKey);
      if (!consequentData) continue;

      const supportY = consequentData.support;
      const countY = consequentData.count;

      // Calculate Confidence: P(Y | X) = P(X ∪ Y) / P(X)
      const confidence = supportXY / supportX;

      if (confidence < config.minConfidence) {
        continue;
      }

      // Calculate Lift: P(X ∪ Y) / (P(X) * P(Y)) = Confidence / P(Y)
      const lift = confidence / supportY;

      if (lift < config.minLift) {
        continue;
      }

      // Calculate Conviction: (1 - P(Y)) / (1 - Confidence)
      let conviction = 1;
      if (Math.abs(1 - confidence) < 1e-6) {
        conviction = 999.0; // effectively infinite
      } else {
        conviction = (1 - supportY) / (1 - confidence);
      }

      // Calculate Leverage: P(X ∪ Y) - P(X) * P(Y)
      const leverage = supportXY - (supportX * supportY);

      // Calculate Zhang's metric [-1, 1]
      let zhang = 0;
      const num = supportXY - supportX * supportY;
      if (Math.abs(num) > 1e-9) {
        const denom = Math.max(
          supportXY * (1 - supportX),
          supportX * (supportY - supportXY)
        );
        zhang = denom > 1e-9 ? Math.max(-1, Math.min(1, num / denom)) : 0;
      }

      // Calculate Chi-Square statistic
      let chiSquare = 0;
      let isSignificant = false;
      if (totalTransactions > 0) {
        const n = totalTransactions;
        const o11 = countXY;
        const o10 = countX - o11;
        const o01 = countY - o11;
        const o00 = Math.max(0, n - o11 - o10 - o01);
        const numerator = n * Math.pow(o11 * o00 - o10 * o01, 2);
        const denominator = (o11 + o10) * (o01 + o00) * (o11 + o01) * (o10 + o00);
        if (denominator > 0) {
          chiSquare = Math.round((numerator / denominator) * 100) / 100;
          isSignificant = chiSquare >= 3.841; // p < 0.05
        }
      }

      rules.push({
        id: `rule-${ruleIndex++}`,
        antecedent,
        consequent,
        support: supportXY,
        confidence,
        lift,
        conviction,
        leverage,
        zhang: Math.round(zhang * 1000) / 1000,
        chiSquare,
        isSignificant,
        count: countXY,
        antecedentCount: countX,
        consequentCount: countY
      });

      if (rules.length >= maxRules) {
        break;
      }
    }

    if (rules.length >= maxRules) {
      break;
    }
  }

  // Sort rules descending by Lift, then Confidence, then Support
  rules.sort((a, b) => {
    if (b.lift !== a.lift) return b.lift - a.lift;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.support - a.support;
  });

  onProgress?.('Rules Generated', 98, `計算完成，共篩選出 ${rules.length} 條顯著關聯規則`);

  return rules;
}
