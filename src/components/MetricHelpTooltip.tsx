import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface MetricHelpTooltipProps {
  metric: 'support' | 'confidence' | 'lift' | 'conviction' | 'leverage';
}

const METRIC_INFOS = {
  support: {
    title: '支持度 (Support)',
    formula: 'Support(A → B) = P(A ∩ B) = count(A ∪ B) / N',
    explanation: '代表所有訂單中，同時購買商品 A 與商品 B 的比例。',
    businessMeaning: '衡量該共購組合在市場中的普遍普及程度。過低代表冷門偶發事件；支持度高代表大眾核心常客組合。',
    benchmark: '通常設定在 1% ~ 10% 之間，視交易總筆數而定。'
  },
  confidence: {
    title: '信心度 (Confidence)',
    formula: 'Confidence(A → B) = P(B | A) = Support(A ∩ B) / Support(A)',
    explanation: '代表在「已購買商品 A」的前題下，顧客「也會購買商品 B」的條件機率。',
    businessMeaning: '衡量關聯規則的可靠度與定向準確度。例如 Confidence = 80%，代表買 A 的顧客有八成會順便購買 B。',
    benchmark: '通常設定在 30% ~ 70% 之間。'
  },
  lift: {
    title: '提升度 (Lift)',
    formula: 'Lift(A → B) = Confidence(A → B) / Support(B) = P(A ∩ B) / [P(A) × P(B)]',
    explanation: '衡量購買商品 A 對於促成購買商品 B 的「帶動倍率」。',
    businessMeaning: '• Lift > 1：顯著正相關（交叉銷售強推薦價值）。\n• Lift = 1：互相獨立（碰巧出現，無促購效果）。\n• Lift < 1：負相關/互斥（替代品，通常避免同時推薦）。',
    benchmark: '優先尋找 Lift > 1.2 或 > 1.5 以上的高價值強搭售規則。'
  },
  conviction: {
    title: '確信度 (Conviction)',
    formula: 'Conviction(A → B) = [1 - Support(B)] / [1 - Confidence(A → B)]',
    explanation: '衡量規則預測失敗率相較於隨機猜測的比例。',
    businessMeaning: '數值趨近於無限大 (∞) 代表該規則從未被違反（買 A 必買 B）。若為 1 則代表兩者完全獨立。',
    benchmark: '數值越高代表規則定向約束力越強。'
  },
  leverage: {
    title: '超額槓桿率 (Leverage)',
    formula: 'Leverage(A → B) = Support(A ∩ B) - [Support(A) × Support(B)]',
    explanation: '衡量實際共購機率超出兩者獨立期望機率的絕對比例差值。',
    businessMeaning: '不同於 Lift 是倍數比率，Leverage 呈現的是絕對比例差值。數值 > 0 即代表正向超額共購。',
    benchmark: '數值大於 0 即代表超額共購發生。'
  }
};

export const MetricHelpTooltip: React.FC<MetricHelpTooltipProps> = ({ metric }) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = METRIC_INFOS[metric];

  return (
    <span className="inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors focus:outline-none"
        title="查看指標公式與零售決策說明"
        aria-label="查看指標公式與零售決策說明"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Card - 100% contained in viewport, zero overlap */}
          <div className="relative w-full max-w-sm p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl text-xs text-zinc-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-150 z-10 max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{info.title}</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                aria-label="關閉說明"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block mb-1">
                  數學定義公式
                </span>
                <div className="p-2 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono text-zinc-900 dark:text-zinc-100 text-[11px] overflow-x-auto">
                  {info.formula}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block mb-0.5">
                  概念說明
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 m-0 leading-relaxed text-xs">
                  {info.explanation}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block mb-0.5">
                  零售與電商應用
                </span>
                <p className="text-zinc-600 dark:text-zinc-400 m-0 whitespace-pre-line leading-relaxed text-[11px]">
                  {info.businessMeaning}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">
                💡 基準建議：{info.benchmark}
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};
