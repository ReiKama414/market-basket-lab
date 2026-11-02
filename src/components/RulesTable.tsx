import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Download,
  Search,
  ArrowUpDown,
  ShoppingBag,
  Info,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { AssociationRule } from '../types/basket';
import { exportRulesToCSV, exportRulesToJSON } from '../utils/exportUtils';
import { ruleKey } from '../storage/db';

const EMPTY_PINNED: Set<string> = new Set();

interface RulesTableProps {
  rules: AssociationRule[];
  projectId?: string;
  onAddToSimulator?: (items: string[]) => void;
  pinnedRuleIds?: Set<string>;
  onTogglePin?: (rule: AssociationRule) => void;
}

type SortField = 'lift' | 'confidence' | 'support' | 'count' | 'conviction' | 'leverage' | 'chiSquare';

export const RulesTable: React.FC<RulesTableProps> = ({
  rules,
  projectId = 'default',
  onAddToSimulator,
  pinnedRuleIds = EMPTY_PINNED,
  onTogglePin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('lift');
  const [sortAsc, setSortAsc] = useState(false);
  const [liftFilter, setLiftFilter] = useState<number>(0);
  const [showSignificantOnly, setShowSignificantOnly] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Rule ids (rule-0, rule-1...) are run-local: collapse the expanded row when a new mining result arrives
  const [prevRules, setPrevRules] = useState(rules);
  if (prevRules !== rules) {
    setPrevRules(rules);
    setExpandedRuleId(null);
  }

  const filteredRules = useMemo(() => {
    let result = [...rules];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        r =>
          r.antecedent.some(item => item.toLowerCase().includes(term)) ||
          r.consequent.some(item => item.toLowerCase().includes(term))
      );
    }

    if (liftFilter > 0) {
      result = result.filter(r => r.lift >= liftFilter);
    }

    if (showSignificantOnly) {
      result = result.filter(r => r.isSignificant);
    }

    if (showPinnedOnly) {
      result = result.filter(r => pinnedRuleIds.has(ruleKey(r)));
    }

    result.sort((a, b) => {
      const valA = (a[sortField] ?? 0) as number;
      const valB = (b[sortField] ?? 0) as number;
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [rules, searchTerm, liftFilter, showSignificantOnly, showPinnedOnly, pinnedRuleIds, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredRules.length / pageSize) || 1;
  // Clamp: results can shrink (re-mining / filters) while the user is on a later page
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRules = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, safePage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpandedRuleId(expandedRuleId === id ? null : id);
  };

  return (
    <div className="space-y-3 w-full max-w-full">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="搜尋商品關鍵字..."
              value={searchTerm}
              aria-label="搜尋商品關鍵字"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Lift Filter Segment */}
          <div className="flex items-center space-x-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 px-1 hidden sm:inline">Lift:</span>
            <button
              type="button"
              onClick={() => { setLiftFilter(0); setCurrentPage(1); }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                liftFilter === 0
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => { setLiftFilter(1.2); setCurrentPage(1); }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                liftFilter === 1.2
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              ≥ 1.2x
            </button>
            <button
              type="button"
              onClick={() => { setLiftFilter(1.5); setCurrentPage(1); }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                liftFilter === 1.5
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              ≥ 1.5x
            </button>
          </div>

          {/* Significant Only Toggle */}
          <label className="flex items-center space-x-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <input
              type="checkbox"
              checked={showSignificantOnly}
              onChange={(e) => { setShowSignificantOnly(e.target.checked); setCurrentPage(1); }}
              className="rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[11px]">顯著 (p&lt;0.05)</span>
          </label>

          {/* Pinned Only Toggle */}
          <button
            type="button"
            onClick={() => { setShowPinnedOnly(!showPinnedOnly); setCurrentPage(1); }}
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition ${
              showPinnedOnly
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            <span>釘選 ({pinnedRuleIds.size})</span>
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono text-[11px] hidden sm:inline">
            {filteredRules.length} / {rules.length} 條規則
          </span>
          <button
            type="button"
            onClick={() => exportRulesToCSV(filteredRules)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 transition"
            title="匯出規則 CSV (含 UTF-8 BOM，相容 Excel)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={() => exportRulesToJSON(filteredRules)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 transition"
            title="匯出 JSON 格式"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Rules Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-200 min-w-[620px]">
            <thead className="bg-zinc-100/80 dark:bg-zinc-950 text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 select-none">
              <tr>
                <th className="py-2.5 px-2.5 w-8 text-center">釘選</th>
                <th className="py-2.5 px-3 font-semibold">前項商品 (Antecedent X)</th>
                <th className="py-2.5 px-1 w-6 text-center"></th>
                <th className="py-2.5 px-3 font-semibold">後項商品 (Consequent Y)</th>
                <th
                  onClick={() => handleSort('support')}
                  className="py-2.5 px-3 cursor-pointer hover:text-zinc-950 dark:hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>支持度 (Sup)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('confidence')}
                  className="py-2.5 px-3 cursor-pointer hover:text-zinc-950 dark:hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>信心度 (Conf)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lift')}
                  className="py-2.5 px-3 cursor-pointer hover:text-zinc-950 dark:hover:text-white transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>提升度 (Lift)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('chiSquare')}
                  className="py-2.5 px-3 cursor-pointer hover:text-zinc-950 dark:hover:text-white transition hidden md:table-cell"
                >
                  <div className="flex items-center space-x-1">
                    <span>卡方值 (χ²)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
              {paginatedRules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-zinc-500">
                    <p className="text-xs">查無符合條件的關聯規則</p>
                    <p className="text-[11px] text-zinc-400 mt-1">請嘗試放寬篩選條件或調降門檻</p>
                  </td>
                </tr>
              ) : (
                paginatedRules.map((rule) => {
                  const isExpanded = expandedRuleId === rule.id;
                  const isPinned = pinnedRuleIds.has(ruleKey(rule));

                  let liftClass = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
                  if (rule.lift >= 2.0) {
                    liftClass = 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800/80 font-bold';
                  } else if (rule.lift >= 1.5) {
                    liftClass = 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600 font-semibold';
                  }

                  return (
                    <React.Fragment key={rule.id}>
                      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        {/* Pin Button */}
                        <td className="py-2.5 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => onTogglePin?.(rule)}
                            className="text-zinc-400 hover:text-amber-500 transition"
                            title={isPinned ? '取消釘選' : '釘選至重要商務規則清單'}
                            aria-label={isPinned ? '取消釘選' : '釘選規則'}
                          >
                            {isPinned ? (
                              <BookmarkCheck className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-current" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Antecedent */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px] sm:max-w-[260px]">
                            {rule.antecedent.map(item => (
                              <span
                                key={item}
                                className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-medium text-[11px] truncate"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-2.5 px-1 text-center text-zinc-400">
                          <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                        </td>

                        {/* Consequent */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px] sm:max-w-[260px]">
                            {rule.consequent.map(item => (
                              <span
                                key={item}
                                className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-950 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-600 font-semibold text-[11px] truncate"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Support */}
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {(rule.support * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                            {rule.count} 筆
                          </span>
                        </td>

                        {/* Confidence */}
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-8 sm:w-10 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                                style={{ width: `${rule.confidence * 100}%` }}
                              />
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {(rule.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        {/* Lift */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-mono ${liftClass}`}>
                            {rule.lift.toFixed(2)}x
                          </span>
                        </td>

                        {/* ChiSquare */}
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap hidden md:table-cell">
                          <span className={rule.isSignificant ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-500'}>
                            {rule.chiSquare !== undefined ? rule.chiSquare.toFixed(1) : '-'}
                          </span>
                          {rule.isSignificant && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-sans">顯著 (p&lt;0.05)</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => toggleExpand(rule.id)}
                              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                              title="查看商業解讀"
                              aria-label="查看商業解讀"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {onAddToSimulator && (
                              <button
                                type="button"
                                onClick={() => onAddToSimulator(rule.antecedent)}
                                className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium transition flex items-center space-x-1"
                                title="填入購物籃模擬器"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span className="hidden sm:inline">模擬</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/80 dark:bg-zinc-950/80">
                          <td colSpan={9} className="py-3 px-4 sm:px-6 text-xs">
                            <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 space-y-2">
                              <div className="flex items-center space-x-1.5 text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                                <Info className="w-3.5 h-3.5" />
                                <span>白話文零售決策建議：</span>
                              </div>
                              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
                                購買 <strong className="text-zinc-900 dark:text-zinc-100">【{rule.antecedent.join('、')}】</strong> 的訂單中，有 <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{(rule.confidence * 100).toFixed(1)}%</strong> 也購買了 <strong className="text-zinc-900 dark:text-zinc-100">【{rule.consequent.join('、')}】</strong>。
                                共購機率是一般隨機消費者的 <strong className="font-bold text-zinc-900 dark:text-zinc-100">{rule.lift.toFixed(2)} 倍</strong>。
                              </p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 font-mono">
                                <span>前項獨立次數: {rule.antecedentCount} 筆</span>
                                <span>後項獨立次數: {rule.consequentCount} 筆</span>
                                <span>雙方共購次數: {rule.count} 筆</span>
                                <span>確信度 (Conviction): {rule.conviction === 999 ? '∞' : rule.conviction.toFixed(2)}</span>
                                <span>超額槓桿率 (Leverage): {rule.leverage.toFixed(5)}</span>
                                <span>Zhang 關聯度: {rule.zhang !== undefined ? rule.zhang.toFixed(3) : '-'}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredRules.length > pageSize && (
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              顯示第 {(safePage - 1) * pageSize + 1} 至 {Math.min(safePage * pageSize, filteredRules.length)} 筆（共 {filteredRules.length} 筆）
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(safePage - 1)}
                className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
              >
                上一頁
              </button>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
                className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
