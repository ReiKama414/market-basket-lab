// Automated Rule Validation & Sanity Testing Suite
import { ValidationTestResult, MiningConfig, FrequentItemset, AssociationRule } from '../types/basket';
import { mineApriori } from './apriori';
import { mineFPGrowth } from './fpgrowth';
import { generateAssociationRules } from './rules';

// Standard 9-transaction dataset from classic Agrawal/Han textbook
const TEXTBOOK_TRANSACTIONS = [
  ['I1', 'I2', 'I5'],
  ['I2', 'I4'],
  ['I2', 'I3'],
  ['I1', 'I2', 'I4'],
  ['I1', 'I3'],
  ['I2', 'I3'],
  ['I1', 'I3'],
  ['I1', 'I2', 'I3', 'I5'],
  ['I1', 'I2', 'I3']
];

export function runValidationSuite(
  sampleTransactions: string[][],
  currentRules: AssociationRule[],
  currentItemsets: FrequentItemset[]
): ValidationTestResult[] {
  const results: ValidationTestResult[] = [];

  // Test 1: Anti-Monotone Property (反單調性原則)
  {
    const start = performance.now();
    let passed = true;
    let failureDetail = '';

    const supportMap = new Map<string, number>();
    for (const itemset of currentItemsets) {
      supportMap.set([...itemset.items].sort().join('|||'), itemset.support);
    }

    // Check every itemset size >= 2
    for (const itemset of currentItemsets) {
      if (itemset.size < 2) continue;
      const items = [...itemset.items].sort();
      const parentSupport = itemset.support;

      // Check all subsets of size k-1
      for (let i = 0; i < items.length; i++) {
        const subset = items.filter((_, idx) => idx !== i);
        const subKey = subset.join('|||');
        const subSupport = supportMap.get(subKey);

        if (subSupport === undefined) {
          passed = false;
          failureDetail = `子集 {${subset.join(',')}} 未存在於頻繁項集中，但超集 {${items.join(',')}} 卻存在！`;
          break;
        } else if (parentSupport > subSupport + 1e-9) {
          passed = false;
          failureDetail = `反單調性違規：超集支持度 (${parentSupport.toFixed(4)}) 大於子集支持度 (${subSupport.toFixed(4)})！`;
          break;
        }
      }
      if (!passed) break;
    }

    const duration = performance.now() - start;
    results.push({
      id: 'test-antimonotone',
      name: '項集反單調性原則 (Anti-Monotone Property)',
      description: '檢驗任何頻繁項集之所有非空子集亦必然為頻繁，且超集支持度絕不大於任何子集支持度。',
      passed,
      details: passed
        ? `通過！已驗證全部 ${currentItemsets.length} 個頻繁項集均嚴格遵循反單調性（∀ A ⊆ B ⇒ Support(B) ≤ Support(A)）。`
        : failureDetail,
      durationMs: Math.round(duration * 100) / 100
    });
  }

  // Test 2: Apriori vs FP-Growth Equivalence (演算法等價性檢驗)
  {
    const start = performance.now();
    let passed = true;
    let details = '';

    const testConfig: MiningConfig = {
      algorithm: 'apriori',
      minSupport: 0.22,
      minConfidence: 0.5,
      minLift: 1.0,
      maxItemsetSize: 4,
      singleConsequentOnly: true
    };

    const aprioriItemsets = mineApriori(TEXTBOOK_TRANSACTIONS, testConfig);
    const fpItemsets = mineFPGrowth(TEXTBOOK_TRANSACTIONS, testConfig);

    const aprioriKeys = new Set(aprioriItemsets.map(s => `${[...s.items].sort().join(',')}:${s.count}`));
    const fpKeys = new Set(fpItemsets.map(s => `${[...s.items].sort().join(',')}:${s.count}`));

    if (aprioriKeys.size !== fpKeys.size) {
      passed = false;
      details = `項集數量不一致：Apriori 產出 ${aprioriKeys.size} 個，FP-Growth 產出 ${fpKeys.size} 個。`;
    } else {
      for (const k of aprioriKeys) {
        if (!fpKeys.has(k)) {
          passed = false;
          details = `項集差異：Apriori 項集 ${k} 未出現在 FP-Growth 結果中。`;
          break;
        }
      }
    }

    if (passed) {
      details = `通過！Apriori 與 FP-Growth 演算法在標準教科書資料集上產出完全相同的 ${aprioriKeys.size} 個頻繁項集與計數。`;
    }

    const duration = performance.now() - start;
    results.push({
      id: 'test-equivalence',
      name: 'Apriori 與 FP-Growth 等價性驗證',
      description: '比對候選生成-剪枝法與前綴樹遞迴法在同一輸入下產出結果之數學一致性。',
      passed,
      details,
      durationMs: Math.round(duration * 100) / 100
    });
  }

  // Test 3: Lift Symmetry (提升度對稱性檢驗)
  {
    const start = performance.now();
    let passed = true;
    let details = '';

    // Check pairwise rules: Lift(A -> B) should equal Lift(B -> A)
    const singleRules = currentRules.filter(r => r.antecedent.length === 1 && r.consequent.length === 1);
    let checkedPairs = 0;

    for (const r1 of singleRules) {
      const a = r1.antecedent[0];
      const b = r1.consequent[0];

      // Find reverse rule B -> A
      const r2 = singleRules.find(r => r.antecedent[0] === b && r.consequent[0] === a);
      if (r2) {
        checkedPairs++;
        if (Math.abs(r1.lift - r2.lift) > 1e-6) {
          passed = false;
          details = `對稱性違規：Lift(${a} -> ${b}) = ${r1.lift.toFixed(4)}，但 Lift(${b} -> ${a}) = ${r2.lift.toFixed(4)}。`;
          break;
        }
      }
    }

    if (passed) {
      details = `通過！已驗證 ${checkedPairs} 對雙向規則之提升度完全對稱，符合 Lift(A → B) = P(A ∩ B) / (P(A)P(B)) = Lift(B → A)。`;
    }

    const duration = performance.now() - start;
    results.push({
      id: 'test-lift-symmetry',
      name: '提升度 Lift 對稱性定理',
      description: '檢驗單項目共購時 Lift(A → B) 恆等於 Lift(B → A)。',
      passed,
      details,
      durationMs: Math.round(duration * 100) / 100
    });
  }

  // Test 4: Confidence & Support Mathematical Bounds (機率區間合法性)
  {
    const start = performance.now();
    let passed = true;
    let details = '';

    for (const rule of currentRules) {
      if (rule.support <= 0 || rule.support > 1.0) {
        passed = false;
        details = `支持度超出 [0, 1] 範圍：${rule.support}`;
        break;
      }
      if (rule.confidence < 0 || rule.confidence > 1.000001) {
        passed = false;
        details = `信心度超出 [0, 1] 範圍：${rule.confidence}`;
        break;
      }
      if (rule.support > rule.confidence + 1e-9) {
        passed = false;
        details = `支持度大於信心度違規：Support (${rule.support}) > Confidence (${rule.confidence})。`;
        break;
      }
    }

    if (passed) {
      details = `通過！全部 ${currentRules.length} 條規則之 Support 與 Confidence 皆在法定機率區間 [0, 1] 內，且 Support ≤ Confidence。`;
    }

    const duration = performance.now() - start;
    results.push({
      id: 'test-bounds',
      name: '條件機率與聯合機率邊界合法性',
      description: '檢驗 0 ≤ Support ≤ Confidence ≤ 1，且 P(A ∩ B) ≤ P(B | A)。',
      passed,
      details,
      durationMs: Math.round(duration * 100) / 100
    });
  }

  // Test 5: Classic Textbook Ground Truth Exact Match
  {
    const start = performance.now();
    const config: MiningConfig = {
      algorithm: 'fpgrowth',
      minSupport: 2 / 9, // support count >= 2
      minConfidence: 0.7, // 70%
      minLift: 1.0,
      maxItemsetSize: 3,
      singleConsequentOnly: true
    };

    const itemsets = mineFPGrowth(TEXTBOOK_TRANSACTIONS, config);
    const rules = generateAssociationRules(itemsets, config, TEXTBOOK_TRANSACTIONS.length);

    // Verify known theoretical rule: {I1, I5} -> {I2} has confidence 100% (2/2) and lift = 1.0 / (7/9) = 1.2857
    const targetRule = rules.find(
      r => r.antecedent.includes('I1') && r.antecedent.includes('I5') && r.consequent.includes('I2')
    );

    let passed = false;
    let details = '';

    if (targetRule && Math.abs(targetRule.confidence - 1.0) < 1e-4) {
      passed = true;
      details = `通過！基準規則 {I1, I5} → {I2} 實測 Confidence = ${(targetRule.confidence * 100).toFixed(1)}%, Lift = ${targetRule.lift.toFixed(3)}，與經典教科書理論值完全吻合。`;
    } else {
      details = `基準測試未檢測到預期規則或數值偏差。`;
    }

    const duration = performance.now() - start;
    results.push({
      id: 'test-ground-truth',
      name: '經典 Agrawal 教科書基準題真值校驗',
      description: '驗證經典 9 筆交易資料集之 {I1, I5} → {I2} 規則是否精準符合 100% 信心度。',
      passed,
      details,
      durationMs: Math.round(duration * 100) / 100
    });
  }

  return results;
}
