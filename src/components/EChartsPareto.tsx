import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { Download, TrendingUp } from 'lucide-react';
import { escapeHtml } from '../utils/chartUtils';
import { DatasetStats } from '../types/basket';
import { useTheme } from '../context/ThemeContext';

interface EChartsParetoProps {
  stats: DatasetStats;
}

export const EChartsPareto: React.FC<EChartsParetoProps> = ({ stats }) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const { resolvedTheme } = useTheme();

  // Memoized so the chart is only rebuilt when stats/theme change (not on every parent render)
  const { top20, itemNames, counts, cumulativePercents } = useMemo(() => {
    const top = stats.itemFrequencies.slice(0, 20);
    const cnts = top.map(i => i.count);
    const totalOccurrences = stats.itemFrequencies.reduce((sum, item) => sum + item.count, 0) || 1;
    const cumulative: number[] = [];
    cnts.reduce((acc, count) => {
      const next = acc + count;
      cumulative.push(Math.round((next / totalOccurrences) * 1000) / 10);
      return next;
    }, 0);
    return {
      top20: top,
      itemNames: top.map(i => i.item),
      counts: cnts,
      cumulativePercents: cumulative
    };
  }, [stats]);

  const top20CumulativePct = cumulativePercents.length > 0 ? cumulativePercents[cumulativePercents.length - 1] : 0;

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const isDark = resolvedTheme === 'dark';
    const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    chartInstanceRef.current = chart;

    const textColor = isDark ? '#a1a1aa' : '#52525b';
    const titleColor = isDark ? '#f4f4f5' : '#18181b';
    const splitLineColor = isDark ? '#27272a' : '#e4e4e7';
    const axisLineColor = isDark ? '#3f3f46' : '#d4d4d8';
    const tooltipBg = isDark ? '#18181b' : '#ffffff';
    const tooltipBorder = isDark ? '#3f3f46' : '#e4e4e7';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        textStyle: { color: titleColor, fontSize: 11 },
        formatter: (params: any) => {
          const item = params[0];
          const line = params[1];
          const rawItem = top20[item.dataIndex];
          const supportPct = rawItem ? (rawItem.support * 100).toFixed(1) : '0';

          return `
            <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
              <div style="font-weight: 600; color: ${isDark ? '#e4e4e7' : '#09090b'}; margin-bottom: 2px;">
                ${escapeHtml(item.name)}
              </div>
              <div style="font-family: monospace; font-size: 11px; color: ${textColor};">
                <div>出現訂單數: <strong style="color:${titleColor};">${item.value} 筆</strong></div>
                <div>獨立支持度 (Support): <strong style="color:${isDark ? '#34d399' : '#059669'};">${supportPct}%</strong></div>
                <div>累計商品佔比: <strong style="color:${isDark ? '#fbbf24' : '#b45309'};">${line?.value || 0}%</strong></div>
              </div>
            </div>
          `;
        }
      },
      grid: {
        top: 25,
        right: 25,
        bottom: 45,
        left: 20,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: itemNames,
        axisLabel: {
          interval: 'auto',
          rotate: 35,
          color: textColor,
          fontSize: 10,
          formatter: (val: string) => (val.length > 5 ? val.slice(0, 4) + '…' : val)
        },
        axisLine: { lineStyle: { color: axisLineColor } }
      },
      yAxis: [
        {
          type: 'value',
          name: '訂單次數',
          nameTextStyle: { color: textColor, fontSize: 10 },
          splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
          axisLabel: { color: textColor, fontFamily: 'monospace', fontSize: 10 }
        },
        {
          type: 'value',
          name: '累計佔比 (%)',
          min: 0,
          max: 100,
          nameTextStyle: { color: textColor, fontSize: 10 },
          splitLine: { show: false },
          axisLabel: {
            formatter: '{value}%',
            color: isDark ? '#fbbf24' : '#b45309',
            fontFamily: 'monospace',
            fontSize: 10
          }
        }
      ],
      series: [
        {
          name: '出現次數',
          type: 'bar',
          data: counts,
          barMaxWidth: 24,
          itemStyle: {
            color: isDark ? '#52525b' : '#71717a',
            borderRadius: [3, 3, 0, 0]
          }
        },
        {
          name: '累計百分比',
          type: 'line',
          yAxisIndex: 1,
          data: cumulativePercents,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: isDark ? '#fbbf24' : '#d97706' },
          lineStyle: { width: 2, color: isDark ? '#fbbf24' : '#d97706' },
          markLine: {
            silent: true,
            lineStyle: { color: '#ef4444', type: 'dashed', width: 1.5 },
            data: [
              {
                yAxis: 80,
                label: { formatter: '80% 核心集中線 (Pareto)', position: 'insideEndTop', color: '#ef4444', fontSize: 9 }
              }
            ]
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
  }, [resolvedTheme, itemNames, counts, cumulativePercents, top20]);

  const handleExportPNG = () => {
    if (!chartInstanceRef.current) return;
    const isDark = resolvedTheme === 'dark';
    const url = chartInstanceRef.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: isDark ? '#09090b' : '#ffffff'
    });
    const link = document.createElement('a');
    link.download = `item_pareto_chart_${Date.now()}.png`;
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
          <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 m-0">
            商品頻率與二八法則分佈圖 (Pareto 80/20)
          </h3>
        </div>
        <button
          type="button"
          onClick={handleExportPNG}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 transition"
          title="匯出二八法則圖表 PNG"
        >
          <Download className="w-3.5 h-3.5" />
          <span>匯出 PNG</span>
        </button>
      </div>

      {/* 2. Description & 3. Statistics Area */}
      <div data-testid="pareto-desc" className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <p className="m-0 text-[11px] leading-relaxed">
          展示前 20 大熱門商品的單品出現次數（柱狀）與累計銷售佔比（折線），紅虛線標示 80% 核心商品集中分界線。
        </p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            相異商品數: {stats.distinctItemsCount} 種
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            前 20 品項累計佔比: {top20CumulativePct}%
          </span>
        </div>
      </div>

      {/* 4. Chart Drawing Canvas Area (No absolute elements overlapping) */}
      <div data-testid="pareto-canvas" className="w-full h-[300px] sm:h-[360px] bg-zinc-50 dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div ref={chartRef} className="w-full h-full" />
      </div>

      {/* 5. Legend / Footer Area */}
      <div data-testid="pareto-footer" className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">二八法則管理洞察：</span>
        <p className="m-0 leading-relaxed">
          若前 20% 的商品已貢獻超過 80% 的累計銷量，代表長尾效應顯著。可針對前段頭部商品設計專屬的交叉搭售搭贈促銷，同時藉由搭售帶動後段中長尾高毛利商品的動銷率。
        </p>
      </div>
    </div>
  );
};
