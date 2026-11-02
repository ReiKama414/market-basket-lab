import { describe, it, expect } from 'vitest';
import { mineApriori } from '../algorithms/apriori';
import { mineFPGrowth } from '../algorithms/fpgrowth';
import { generateAssociationRules } from '../algorithms/rules';
import { runValidationSuite } from '../algorithms/tests';
import { parseCSVData } from '../datasets/csvParser';
import { SAMPLE_DATASETS } from '../datasets/sampleDatasets';
import { MiningConfig } from '../types/basket';

describe('Market Basket Mining Algorithms', () => {
  const textbookDS = SAMPLE_DATASETS.find(d => d.id === 'textbook')!;
  const parsed = parseCSVData(textbookDS.csvContent);

  const config: MiningConfig = {
    algorithm: 'fpgrowth',
    minSupport: 2 / 9,
    minConfidence: 0.6,
    minLift: 1.0,
    maxItemsetSize: 3,
    singleConsequentOnly: true
  };

  it('should parse textbook dataset into 9 distinct transactions', () => {
    expect(parsed.transactions.length).toBe(9);
    expect(parsed.stats.distinctItemsCount).toBe(5);
  });

  it('should yield identical frequent itemsets between Apriori and FP-Growth', () => {
    const aprioriItemsets = mineApriori(parsed.transactions, config);
    const fpItemsets = mineFPGrowth(parsed.transactions, config);

    expect(aprioriItemsets.length).toBe(fpItemsets.length);

    const aprioriMap = new Map(aprioriItemsets.map(s => [s.items.sort().join(','), s.count]));
    for (const itemset of fpItemsets) {
      const key = itemset.items.sort().join(',');
      expect(aprioriMap.get(key)).toBe(itemset.count);
    }
  });

  it('should generate association rules with theoretical precision', () => {
    const fpItemsets = mineFPGrowth(parsed.transactions, config);
    const rules = generateAssociationRules(fpItemsets, config, parsed.transactions.length);

    expect(rules.length).toBeGreaterThan(0);

    // Theoretical rule: {I1, I5} -> {I2} has 100% confidence
    const rule = rules.find(r => r.antecedent.includes('I1') && r.antecedent.includes('I5') && r.consequent.includes('I2'));
    expect(rule).toBeDefined();
    expect(rule?.confidence).toBeCloseTo(1.0, 3);
    expect(rule?.lift).toBeGreaterThan(1.2);
  });

  it('should pass all automated mathematical validation suite checks', () => {
    const fpItemsets = mineFPGrowth(parsed.transactions, config);
    const rules = generateAssociationRules(fpItemsets, config, parsed.transactions.length);

    const testResults = runValidationSuite(parsed.transactions, rules, fpItemsets);
    expect(testResults.length).toBe(5);
    for (const test of testResults) {
      expect(test.passed).toBe(true);
    }
  });

  it('should calculate Zhang metric and Chi-square values appropriately', () => {
    const fpItemsets = mineFPGrowth(parsed.transactions, config);
    const rules = generateAssociationRules(fpItemsets, config, parsed.transactions.length);

    for (const rule of rules) {
      if (rule.zhang !== undefined) {
        expect(rule.zhang).toBeGreaterThanOrEqual(-1);
        expect(rule.zhang).toBeLessThanOrEqual(1);
      }
      if (rule.chiSquare !== undefined) {
        expect(rule.chiSquare).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
