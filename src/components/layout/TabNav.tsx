import React from 'react';
import {
  FileText,
  Share2,
  Layers,
  ScatterChart as ScatterIcon,
  Grid,
  ShoppingBag
} from 'lucide-react';

export type TabType = 'rules' | 'network' | 'itemsets' | 'scatter' | 'heatmap' | 'simulator';

interface TabNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  rulesCount?: number;
  itemsetsCount?: number;
  networkCount?: string | number;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onTabChange,
  rulesCount,
  itemsetsCount,
  networkCount
}) => {
  const tabs = [
    {
      id: 'rules' as TabType,
      label: '商品共購規則',
      icon: FileText,
      badge: rulesCount !== undefined ? `${rulesCount} 條` : undefined
    },
    {
      id: 'network' as TabType,
      label: '關聯網絡圖',
      icon: Share2,
      badge: networkCount !== undefined ? `${networkCount}` : undefined
    },
    {
      id: 'itemsets' as TabType,
      label: '頻繁項集與二八分析',
      icon: Layers,
      badge: itemsetsCount !== undefined ? `${itemsetsCount} 個` : undefined
    },
    {
      id: 'scatter' as TabType,
      label: '規則散佈圖 (ECharts)',
      icon: ScatterIcon
    },
    {
      id: 'heatmap' as TabType,
      label: '共購親和矩陣 (ECharts)',
      icon: Grid
    },
    {
      id: 'simulator' as TabType,
      label: '購物車推薦模擬',
      icon: ShoppingBag
    }
  ];

  return (
    <nav
      aria-label="工作台視圖導覽"
      className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none shadow-xs transition-colors"
    >
      <div className="max-w-[1700px] mx-auto px-2 sm:px-4 flex items-center overflow-x-auto no-scrollbar gap-1 min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2.5 sm:px-3.5 border-b-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-100/70 dark:bg-zinc-800/60'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-semibold rounded-full border border-zinc-300 dark:border-zinc-700">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
