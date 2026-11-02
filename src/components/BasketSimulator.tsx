import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Tag
} from 'lucide-react';
import { AssociationRule, DatasetStats } from '../types/basket';

interface BasketSimulatorProps {
  rules: AssociationRule[];
  stats: DatasetStats;
  initialBasket?: string[];
}

export const BasketSimulator: React.FC<BasketSimulatorProps> = ({
  rules,
  stats,
  initialBasket = []
}) => {
  const [basket, setBasket] = useState<string[]>(initialBasket);
  const [selectedToAdd, setSelectedToAdd] = useState<string>('');

  const allItems = useMemo(() => {
    return stats.itemFrequencies.map(f => f.item);
  }, [stats]);

  // Dataset changed while the simulator is open: drop cart items that no longer exist
  const [prevStats, setPrevStats] = useState(stats);
  if (prevStats !== stats) {
    setPrevStats(stats);
    const valid = new Set(allItems);
    setBasket(prev => prev.filter(i => valid.has(i)));
  }

  const addItem = (item: string) => {
    if (!item || basket.includes(item)) return;
    setBasket([...basket, item]);
    setSelectedToAdd('');
  };

  const removeItem = (item: string) => {
    setBasket(basket.filter(i => i !== item));
  };

  const clearBasket = () => {
    setBasket([]);
  };

  const recommendations = useMemo(() => {
    if (basket.length === 0) return [];

    const basketSet = new Set(basket);
    const recMap = new Map<
      string,
      {
        consequent: string[];
        maxConfidence: number;
        maxLift: number;
        triggeredBy: string[];
        rule: AssociationRule;
      }
    >();

    for (const rule of rules) {
      const hasAllAntecedents = rule.antecedent.every(item => basketSet.has(item));

      if (hasAllAntecedents) {
        const newItems = rule.consequent.filter(item => !basketSet.has(item));

        if (newItems.length > 0) {
          const key = newItems.sort().join('|||');
          const existing = recMap.get(key);

          if (!existing || rule.confidence > existing.maxConfidence) {
            recMap.set(key, {
              consequent: newItems,
              maxConfidence: rule.confidence,
              maxLift: rule.lift,
              triggeredBy: rule.antecedent,
              rule
            });
          }
        }
      }
    }

    return Array.from(recMap.values()).sort((a, b) => {
      const scoreB = b.maxConfidence * b.maxLift;
      const scoreA = a.maxConfidence * a.maxLift;
      return scoreB - scoreA;
    });
  }, [basket, rules]);

  const handleExportRecommendations = () => {
    const report = {
      timestamp: new Date().toISOString(),
      currentBasket: basket,
      recommendationCount: recommendations.length,
      recommendations: recommendations.map(r => ({
        recommendedItem: r.consequent,
        confidence: r.maxConfidence,
        lift: r.maxLift,
        triggeredByAntecedent: r.triggeredBy
      }))
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `basket_cross_sell_report_${Date.now()}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs p-4 sm:p-5 space-y-4 w-full max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            購物車即時交叉銷售推薦模擬器 (What-If Cart Simulator)
          </h3>
        </div>
        {recommendations.length > 0 && (
          <button
            type="button"
            onClick={handleExportRecommendations}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出策略報表</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Current Basket (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span data-testid="cart-count-badge" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1 text-zinc-500 dark:text-zinc-400" />
                目前模擬購物車 ({basket.length} 件商品)
              </span>
              {basket.length > 0 && (
                <button
                  type="button"
                  onClick={clearBasket}
                  className="text-[11px] text-zinc-500 hover:text-red-600 dark:hover:text-red-400 flex items-center space-x-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>清空購物車</span>
                </button>
              )}
            </div>

            {/* Current Basket Items Box */}
            <div className="min-h-[80px] flex flex-wrap gap-1.5 p-2 bg-white dark:bg-zinc-900/60 rounded border border-zinc-200 dark:border-zinc-800 items-start">
              {basket.length === 0 ? (
                <div className="w-full text-center py-5 text-zinc-500 text-xs">
                  購物車目前是空的，請於下方選取或點擊商品加入
                </div>
              ) : (
                basket.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-medium"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white focus:outline-none"
                      aria-label={`移除 ${item}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add dropdown */}
            <div className="flex space-x-2 pt-1">
              <select
                value={selectedToAdd}
                onChange={(e) => setSelectedToAdd(e.target.value)}
                aria-label="選取商品加入購物車"
                className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="">-- 選取商品加入購物車 --</option>
                {allItems
                  .filter(i => !basket.includes(i))
                  .map(item => (
                    <option key={item} value={item} className="bg-white dark:bg-zinc-900">
                      {item}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => addItem(selectedToAdd)}
                disabled={!selectedToAdd}
                className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-900 rounded-lg text-xs font-medium transition flex items-center space-x-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>加入</span>
              </button>
            </div>

            {/* Top items quick pick */}
            <div className="pt-1">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">
                熱門商品快速加入：
              </span>
              <div className="flex flex-wrap gap-1">
                {allItems.slice(0, 8).map(item => (
                  <button
                    key={item}
                    data-testid="quick-add-btn"
                    type="button"
                    onClick={() => addItem(item)}
                    disabled={basket.includes(item)}
                    className={`px-2 py-0.5 rounded text-[11px] border transition ${
                      basket.includes(item)
                        ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                        : 'bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Recommendations (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-zinc-700 dark:text-zinc-300" />
              觸發之交叉銷售推薦 ({recommendations.length} 個項目)
            </span>
            {recommendations.length > 0 && (
              <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                最高信心度: {(recommendations[0].maxConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <div className="space-y-2">
            {recommendations.length === 0 ? (
              <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center text-zinc-500 text-xs space-y-1">
                <p>目前購物車尚未觸發符合門檻的規則</p>
                <p className="text-[11px] text-zinc-400">請嘗試加入更多商品，或於上方門檻調降 Min Support / Min Confidence</p>
              </div>
            ) : (
              recommendations.slice(0, 6).map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-[10px]">
                        推薦加購
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {rec.consequent.map(c => (
                          <span key={c} className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed m-0">
                      觸發依據：買了 <span className="font-medium text-zinc-900 dark:text-zinc-200">【{rec.triggeredBy.join('、')}】</span> 的顧客，有 <strong>{(rec.maxConfidence * 100).toFixed(1)}%</strong> 也會加購此品（帶動倍率 Lift = <strong>{rec.maxLift.toFixed(2)}x</strong>）。
                    </p>
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBasket([...basket, ...rec.consequent])}
                      className="px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md text-xs font-semibold shadow-xs transition flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>加購</span>
                    </button>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      加購機率: {(rec.maxConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
