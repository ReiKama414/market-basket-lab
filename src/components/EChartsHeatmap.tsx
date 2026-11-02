import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Download, Grid } from 'lucide-react';
import { escapeHtml } from '../utils/chartUtils';
import { AssociationRule, DatasetStats } from '../types/basket';
import { useTheme } from '../context/ThemeContext';

interface EChartsHeatmapProps {
  rules: AssociationRule[];
  stats: DatasetStats;
}

export const EChartsHeatmap: React.FC<EChartsHeatmapProps> = ({ rules, stats }) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [metric, setMetric] = useState<'lift' | 'confidence'>('lift');
  const { resolvedTheme } = useTheme();

  // Memoized: a fresh array every render would be a changing effect dependency and re-create the chart on every parent render
  const topItems = useMemo(() => stats.itemFrequencies.slice(0, 10).map(i => i.item), [stats]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const isDark = resolvedTheme === 'dark';
    const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    chartInstanceRef.current = chart;

    const ruleMap = new Map<string, AssociationRule>();
    for (const rule of rules) {
      if (rule.antecedent.length === 1 && rule.consequent.length === 1) {
        const key = `${rule.antecedent[0]}===>${rule.consequent[0]}`;
        ruleMap.set(key, rule);
      }
    }

    const data: any[] = [];
    let maxVal = metric === 'lift' ? 2.5 : 0.8;
    const minVal = 0;

    for (let i = 0; i < topItems.length; i++) {
      for (let j = 0; j < topItems.length; j++) {
        if (i === j) {
          data.push([j, i, null]);
          continue;
        }

        const aItem = topItems[i];
        const cItem = topItems[j];
        const rule = ruleMap.get(`${aItem}===>${cItem}`);

        if (rule) {
          const val = metric === 'lift' ? rule.lift : rule.confidence;
          if (val > maxVal) maxVal = val;
          data.push([j, i, Math.round(val * 100) / 100, rule]);
        } else {
          data.push([j, i, 0, null]);
        }
      }
    }

    const textColor = isDark ? '#a1a1aa' : '#52525b';
    const titleColor = isDark ? '#f4f4f5' : '#18181b';
    const tooltipBg = isDark ? '#18181b' : '#ffffff';
    const tooltipBorder = isDark ? '#3f3f46' : '#e4e4e7';
    const axisLineColor = isDark ? '#3f3f46' : '#d4d4d8';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        position: 'top',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        textStyle: { color: titleColor, fontSize: 11 },
        formatter: (params: any) => {
          const d = params.value;
          const a = escapeHtml(topItems[d[1]]);
          const c = escapeHtml(topItems[d[0]]);
          const rule: AssociationRule | null = d[3];

          if (d[1] === d[0]) {
            return `【${a}】<br/><span style="color:${textColor};">(同一商品，不適用)</span>`;
          }

          if (!rule) {
            return `【${a}】 → 【${c}】<br/><span style="color:${textColor};">(無顯著關聯或低於門檻)</span>`;
          }

          return `
            <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
              <div style="font-weight: 600; color: ${isDark ? '#e4e4e7' : '#09090b'}; margin-bottom: 2px;">
                【${a}】 → 【${c}】
              </div>
              <div style="font-family: monospace; font-size: 11px; color: ${textColor};">
                <div>提升度 (Lift): <strong style="color:${isDark ? '#fbbf24' : '#b45309'};">${rule.lift.toFixed(2)}x</strong></div>
                <div>信心度 (Confidence): <strong style="color:${isDark ? '#34d399' : '#059669'};">${(rule.confidence * 100).toFixed(1)}%</strong></div>
                <div>支持度 (Support): ${(rule.support * 100).toFixed(1)}% (${rule.count} 筆)</div>
                <div>確信度 (Conviction): ${rule.conviction === 999 ? '∞' : rule.conviction.toFixed(2)}</div>
              </div>
            </div>
          `;
        }
      },
      grid: {
        top: 20,
        right: 65,
        bottom: 50,
        left: 30,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: topItems,
        splitArea: { show: true },
        axisLabel: {
          interval: 0,
          rotate: 35,
          color: textColor,
          fontSize: 10,
          formatter: (val: string) => (val.length > 5 ? val.slice(0, 4) + '…' : val)
        },
        axisLine: { lineStyle: { color: axisLineColor } }
      },
      yAxis: {
        type: 'category',
        data: topItems,
        splitArea: { show: true },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          formatter: (val: string) => (val.length > 6 ? val.slice(0, 5) + '…' : val)
        },
        axisLine: { lineStyle: { color: axisLineColor } }
      },
      visualMap: {
        min: minVal,
        max: maxVal,
        calculable: true,
        orient: 'vertical',
        right: 5,
        top: 'center',
        itemHeight: 110,
        itemWidth: 12,
        text: ['高', '低'],
        textStyle: { color: textColor, fontSize: 10 },
        inRange: {
          color: isDark
            ? (metric === 'lift'
                ? ['#18181b', '#2563eb', '#7c3aed', '#d97706', '#dc2626']
                : ['#18181b', '#047857', '#10b981', '#34d399', '#6ee7b7'])
            : (metric === 'lift'
                ? ['#f4f4f5', '#93c5fd', '#c084fc', '#fbbf24', '#ef4444']
                : ['#f4f4f5', '#a7f3d0', '#6ee7b7', '#10b981', '#047857'])
        }
      },
      series: [
        {
          name: '共購親和度',
          type: 'heatmap',
          data,
          label: {
            show: true,
            fontSize: 9,
            formatter: (p: any) => {
              const val = p.data[2];
              if (!val) return '';
              return metric === 'lift' ? `${val.toFixed(1)}x` : `${Math.round(val * 100)}%`;
            },
            color: isDark ? '#ffffff' : '#000000'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: 'rgba(0, 0, 0, 0.4)'
            }
          }
        }
      ]
    };

    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [rules, stats, metric, resolvedTheme, topItems]);

  const handleExportPNG = () => {
    if (!chartInstanceRef.current) return;
    const isDark = resolvedTheme === 'dark';
    const url = chartInstanceRef.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: isDark ? '#09090b' : '#ffffff'
    });
    const link = document.createElement('a');
    link.download = `co_occurrence_heatmap_${Date.now()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs p-4 sm:p-5 space-y-4 w-full max-w-full">
      {/* 1. Header Area */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <Grid className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 m-0">
            熱門商品共購親和矩陣
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setMetric('lift')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                metric === 'lift'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              提升度 (Lift)
            </button>
            <button
              type="button"
              onClick={() => setMetric('confidence')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                metric === 'confidence'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              信心度 (Confidence)
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPNG}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 transition"
            title="匯出熱圖 PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出 PNG</span>
          </button>
        </div>
      </div>

      {/* 2. Description & 3. Statistics Area */}
      <div data-testid="heatmap-desc" className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <p className="m-0 text-[11px] leading-relaxed">
          矩陣行（Y 軸）為前項商品 A，矩陣列（X 軸）為後項商品 B。色塊深淺反映加購誘發力或共購倍率。
        </p>
        <div className="flex items-center space-x-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            維度: 前 10 大熱銷商品交叉矩陣 (10×10)
          </span>
        </div>
      </div>

      {/* 4. Chart Drawing Canvas Area (No absolute elements overlapping) */}
      <div data-testid="heatmap-canvas" className="w-full h-[320px] sm:h-[420px] lg:h-[480px] bg-zinc-50 dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div ref={chartRef} className="w-full h-full" />
      </div>

      {/* 5. Legend / Footer Notes Area */}
      <div data-testid="heatmap-footer" className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">零售實務決策應用：</span>
        <p className="m-0 leading-relaxed">
          高親和度色塊（暖色系）代表顯著正向搭售組合。可直接運用於電商結帳頁加價購推薦（A 購物車頁提示加購 B）、或實體門市的跨品類端架陳列與聯合促銷組合。
        </p>
      </div>
    </div>
  );
};
