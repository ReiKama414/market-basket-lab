import React, { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { FrequentItemset, DatasetStats } from '../types/basket';
import { exportItemsetsToCSV } from '../utils/exportUtils';
import { EChartsPareto } from './EChartsPareto';

// Rendering thousands of cards freezes low-end devices; cap the visible grid.
const MAX_VISIBLE_ITEMSETS = 300;

interface ItemsetsViewProps {
  itemsets: FrequentItemset[];
  itemsetsBySize: { [size: number]: FrequentItemset[] };
  stats: DatasetStats;
}

export const ItemsetsView: React.FC<ItemsetsViewProps> = ({
  itemsets,
  itemsetsBySize,
  stats
}) => {
  const [selectedSize, setSelectedSize] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'support' | 'size'>('support');

  const sizes = useMemo(() => {
    return Object.keys(itemsetsBySize)
      .map(Number)
      .sort((a, b) => a - b);
  }, [itemsetsBySize]);

  // After re-mining, the previously selected k may no longer exist: fall back to "all"
  const effectiveSize: number | 'all' =
    selectedSize !== 'all' && !sizes.includes(selectedSize) ? 'all' : selectedSize;

  const filteredItemsets = useMemo(() => {
    let result = effectiveSize === 'all' ? [...itemsets] : [...(itemsetsBySize[effectiveSize] || [])];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.items.some(item => item.toLowerCase().includes(term))
      );
    }

    if (sortField === 'support') {
      result.sort((a, b) => b.support - a.support);
    } else if (sortField === 'size') {
      result.sort((a, b) => b.size - a.size || b.support - a.support);
    }

    return result;
  }, [itemsets, itemsetsBySize, effectiveSize, searchTerm, sortField]);

  const maxSupport = useMemo(() => {
    if (filteredItemsets.length === 0) return 1;
    return Math.max(...filteredItemsets.map(s => s.support));
  }, [filteredItemsets]);

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Pareto 80/20 Chart */}
      <EChartsPareto stats={stats} />

      {/* Itemsets Controls & Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 w-full max-w-full">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Size Filter Tabs */}
          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs max-w-full overflow-x-auto no-scrollbar [&>button]:whitespace-nowrap [&>button]:shrink-0">
            <button
              type="button"
              onClick={() => setSelectedSize('all')}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs font-medium transition ${
                effectiveSize === 'all'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              全部 ({itemsets.length})
            </button>
            {sizes.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`px-2.5 sm:px-3 py-1 rounded text-xs font-medium transition ${
                  effectiveSize === size
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {size}-項集 ({itemsetsBySize[size]?.length || 0})
              </button>
            ))}
          </div>

          {/* Search & Export */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="搜尋項集..."
                value={searchTerm}
                aria-label="搜尋項集"
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-32 sm:w-40"
              />
            </div>
            <button
              type="button"
              onClick={() => exportItemsetsToCSV(filteredItemsets)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">匯出項集 CSV</span>
            </button>
          </div>
        </div>

        {/* Itemsets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredItemsets.length === 0 ? (
            <div className="col-span-full py-8 text-center text-zinc-500 text-xs">
              查無符合條件的頻繁項集
            </div>
          ) : (
            filteredItemsets.slice(0, MAX_VISIBLE_ITEMSETS).map((itemset, idx) => {
              const relativePercent = (itemset.support / maxSupport) * 100;
              return (
                <div
                  key={`${itemset.items.join('-')}-${idx}`}
                  className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                        {itemset.size}-項集 (k={itemset.size})
                      </span>
                      <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {(itemset.support * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {itemset.items.map(item => (
                        <span
                          key={item}
                          className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                    <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
                      <span>{itemset.count} 筆訂單</span>
                      <span>{relativePercent.toFixed(0)}% 相對權重</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full"
                        style={{ width: `${relativePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {filteredItemsets.length > MAX_VISIBLE_ITEMSETS && (
          <p className="m-0 text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
            僅顯示支持度最高的前 {MAX_VISIBLE_ITEMSETS} 組（共 {filteredItemsets.length.toLocaleString()} 組），請使用搜尋或 k 階篩選縮小範圍；匯出 CSV 仍包含全部結果。
          </p>
        )}
      </div>
    </div>
  );
};
