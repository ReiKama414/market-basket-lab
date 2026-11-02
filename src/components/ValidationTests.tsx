import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  ShieldCheck,
  X
} from 'lucide-react';
import { ValidationTestResult, AssociationRule, FrequentItemset } from '../types/basket';
import { runValidationSuite } from '../algorithms/tests';
import { useEscapeKey } from '../utils/useEscapeKey';

interface ValidationTestsProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: string[][];
  rules: AssociationRule[];
  itemsets: FrequentItemset[];
}

export const ValidationTests: React.FC<ValidationTestsProps> = ({
  isOpen,
  onClose,
  transactions,
  rules,
  itemsets
}) => {
  const [results, setResults] = useState<ValidationTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Re-run against the *current* mining result every time the dialog opens (or the result changes
  // while open); previously the suite ran once at mount and showed stale results after re-mining.
  useEffect(() => {
    if (!isOpen) return;
    setResults(runValidationSuite(transactions, rules, itemsets));
  }, [isOpen, transactions, rules, itemsets]);

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const handleRunAll = () => {
    setIsRunning(true);
    setTimeout(() => {
      const newResults = runValidationSuite(transactions, rules, itemsets);
      setResults(newResults);
      setIsRunning(false);
    }, 150);
  };

  const totalPassed = results.filter(r => r.passed).length;
  const allPassed = results.length > 0 && totalPassed === results.length;
  const passRate = results.length > 0 ? Math.round((totalPassed / results.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 m-0">規則驗證與數學測試套件</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 m-0">
                自動檢驗關聯規則機率邊界、反單調性與演算法一致性
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded"
            aria-label="關閉視窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">驗證結果：</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full border text-[11px] ${
                allPassed
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
              }`}
            >
              {totalPassed} / {results.length} 測試通過 ({passRate}%)
            </span>
          </div>
          <button
            type="button"
            onClick={handleRunAll}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-3 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md text-xs font-semibold shadow-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>重新執行測試</span>
          </button>
        </div>

        {/* Tests List */}
        <div className="space-y-2.5">
          {results.map((res) => (
            <div
              key={res.id}
              className={`p-3 rounded-lg border text-xs transition ${
                res.passed
                  ? 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                {res.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs truncate">{res.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">
                      {res.durationMs} ms
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 m-0">{res.description}</p>
                  <div className="p-2 mt-1 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed overflow-x-auto">
                    {res.details}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-md text-xs font-semibold transition"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
