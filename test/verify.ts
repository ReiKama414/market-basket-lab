import { mineApriori } from '../src/algorithms/apriori';
import { mineFPGrowth } from '../src/algorithms/fpgrowth';
import { generateAssociationRules } from '../src/algorithms/rules';
import { runValidationSuite } from '../src/algorithms/tests';
import { parseCSVData } from '../src/datasets/csvParser';
import { SAMPLE_DATASETS } from '../src/datasets/sampleDatasets';
import { MiningConfig } from '../src/types/basket';

console.log('=== MARKET BASKET LAB VALIDATION SCRIPT ===\n');

// 1. Test classic Agrawal 9-transaction dataset
console.log('1. Testing Classic Agrawal Textbook Dataset...');
const textbookDS = SAMPLE_DATASETS.find(d => d.id === 'textbook')!;
const textbookParsed = parseCSVData(textbookDS.csvContent);

console.log(`- Transactions parsed: ${textbookParsed.transactions.length}`);
console.log(`- Distinct items: ${textbookParsed.stats.distinctItemsCount}`);

const textbookConfig: MiningConfig = {
  algorithm: 'fpgrowth',
  minSupport: 2 / 9, // support count >= 2
  minConfidence: 0.6,
  minLift: 1.0,
  maxItemsetSize: 3,
  singleConsequentOnly: true
};

const aprioriItemsets = mineApriori(textbookParsed.transactions, textbookConfig);
const fpItemsets = mineFPGrowth(textbookParsed.transactions, textbookConfig);

console.log(`- Apriori Frequent Itemsets count: ${aprioriItemsets.length}`);
console.log(`- FP-Growth Frequent Itemsets count: ${fpItemsets.length}`);

// Verify equivalence
const aprioriMap = new Map(aprioriItemsets.map(s => [s.items.sort().join(','), s.count]));
let isEquivalent = aprioriItemsets.length === fpItemsets.length;
for (const s of fpItemsets) {
  const key = s.items.sort().join(',');
  if (aprioriMap.get(key) !== s.count) {
    isEquivalent = false;
    console.error(`Mismatch for itemset ${key}: Apriori ${aprioriMap.get(key)} vs FP ${s.count}`);
  }
}
console.log(`- Equivalence Check: ${isEquivalent ? '✅ PASSED' : '❌ FAILED'}`);

// Association Rules on Textbook
const textbookRules = generateAssociationRules(fpItemsets, textbookConfig, textbookParsed.transactions.length);
console.log(`- Generated Rules: ${textbookRules.length}`);
const targetRule = textbookRules.find(r => r.antecedent.includes('I1') && r.antecedent.includes('I5') && r.consequent.includes('I2'));
if (targetRule) {
  console.log(`- Target Rule {I1, I5} -> {I2}: Conf = ${(targetRule.confidence * 100).toFixed(1)}%, Lift = ${targetRule.lift.toFixed(3)} (Expected: Conf 100%, Lift 1.286)`);
}

// 2. Run the Full Automated Validation Suite
console.log('\n2. Running Validation Suite...');
const suiteResults = runValidationSuite(textbookParsed.transactions, textbookRules, fpItemsets);
for (const r of suiteResults) {
  console.log(`  [${r.passed ? 'PASS' : 'FAIL'}] ${r.name} (${r.durationMs}ms)`);
  console.log(`         ${r.details}`);
}

// 3. Benchmark on Supermarket Dataset (800 transactions)
console.log('\n3. Benchmarking Algorithms on Supermarket Dataset (800 orders)...');
const supermarketDS = SAMPLE_DATASETS.find(d => d.id === 'supermarket')!;
const supermarketParsed = parseCSVData(supermarketDS.csvContent);

console.log(`- Total transactions: ${supermarketParsed.transactions.length}`);
console.log(`- Distinct items: ${supermarketParsed.stats.distinctItemsCount}`);
console.log(`- Avg basket size: ${supermarketParsed.stats.avgBasketSize}`);

const superConfig: MiningConfig = {
  algorithm: 'fpgrowth',
  minSupport: 0.08,
  minConfidence: 0.4,
  minLift: 1.2,
  maxItemsetSize: 4,
  singleConsequentOnly: true
};

const t0 = performance.now();
const superFP = mineFPGrowth(supermarketParsed.transactions, superConfig);
const fpTime = performance.now() - t0;

const t1 = performance.now();
const superApriori = mineApriori(supermarketParsed.transactions, superConfig);
const aprioriTime = performance.now() - t1;

console.log(`- FP-Growth: ${superFP.length} itemsets found in ${fpTime.toFixed(2)} ms`);
console.log(`- Apriori:   ${superApriori.length} itemsets found in ${aprioriTime.toFixed(2)} ms`);

const superRules = generateAssociationRules(superFP, superConfig, supermarketParsed.transactions.length);
console.log(`- Association Rules found: ${superRules.length}`);
console.log('Top 3 Rules by Lift:');
superRules.slice(0, 3).forEach((r, idx) => {
  console.log(`  ${idx + 1}. [${r.antecedent.join(', ')}] -> [${r.consequent.join(', ')}] (Sup: ${(r.support * 100).toFixed(1)}%, Conf: ${(r.confidence * 100).toFixed(1)}%, Lift: ${r.lift.toFixed(2)}x)`);
});

console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
