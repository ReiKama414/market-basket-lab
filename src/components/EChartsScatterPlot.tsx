import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { Download, ScatterChart as ScatterIcon } from 'lucide-react';
import { escapeHtml } from '../utils/chartUtils';
import { AssociationRule } from '../types/basket';
import { useTheme } from '../context/ThemeContext';

interface EChartsScatterPlotProps {
  rules: AssociationRule[];
}

export const EChartsScatterPlot: React.FC<EChartsScatterPlotProps> = ({ rules }) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const { resolvedTheme } = useTheme();

  // Memoized so the chart is only rebuilt when rules/theme actually change (not on every parent render)
  const displayRules = useMemo(() => rules.slice(0, 300), [rules]);

  const { medianSupport, medianConfidence } = useMemo(() => {
    const supports = displayRules.map(r => r.support * 100).sort((a, b) => a - b);
    const confidences = displayRules.map(r => r.confidence * 100).sort((a, b) => a - b);
    return {
      medianSupport: supports.length > 0 ? supports[Math.floor(supports.length / 2)] : 5,
      medianConfidence: confidences.length > 0 ? confidences[Math.floor(confidences.length / 2)] : 50
    };
  }, [displayRules]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const isDark = resolvedTheme === 'dark';
    const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined);
    chartInstanceRef.current = chart;

    const data = displayRules.map(rule => [
      Math.round(rule.support * 1000) / 10,       // 0: Support %
      Math.round(rule.confidence * 1000) / 10,    // 1: Confidence %
      Math.round(rule.lift * 100) / 100,          // 2: Lift
      rule.antecedent.join(' + '),                // 3: Antecedent
      rule.consequent.join(' + '),                // 4: Consequent
      rule.count,                                 // 5: Transaction count
      rule.conviction,                            // 6: Conviction
      rule.leverage,                              // 7: Leverage
      rule.chiSquare || 0,                        // 8: Chi-square
      rule.isSignificant ? 1 : 0                  // 9: Significant
    ]);

    const maxLift = Math.max(2.5, Math.max(...displayRules.map(r => r.lift)));
    const minLift = Math.min(1.0, Math.min(...displayRules.map(r => r.lift)));

    const textColor = isDark ? '#a1a1aa' : '#52525b';
    const titleColor = isDark ? '#f4f4f5' : '#18181b';
    const splitLineColor = isDark ? '#27272a' : '#e4e4e7';
    const axisLineColor = isDark ? '#3f3f46' : '#d4d4d8';
    const tooltipBg = isDark ? '#18181b' : '#ffffff';
    const tooltipBorder = isDark ? '#3f3f46' : '#e4e4e7';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        top: 25,
        right: 80,
        bottom: 50,
        left: 20,
        containLabel: true
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        textStyle: { color: titleColor, fontSize: 11 },
        formatter: (params: any) => {
          const d = params.value;
          return `
            <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
              <div style="font-weight: 600; color: ${isDark ? '#e4e4e7' : '#09090b'}; margin-bottom: 2px;">
                【${escapeHtml(d[3])}】 → 【${escapeHtml(d[4])}】
              </div>
              <div style="font-family: monospace; font-size: 11px; color: ${textColor};">
                <div>支持度 (Support): <strong style="color: ${titleColor};">${d[0]}%</strong> (${d[5]} 筆訂單)</div>
                <div>信心度 (Confidence): <strong style="color: ${titleColor};">${d[1]}%</strong></div>
                <div>提升度 (Lift): <strong style="color: ${isDark ? '#fbbf24' : '#b45309'};">${d[2]}x</strong></div>
                <div>確信度 (Conviction): ${d[6] === 999 ? '∞' : d[6].toFixed(2)}</div>
                <div>卡方值 (Chi-Square): ${d[8]} ${d[9] ? '<span style="color:#16a34a;">(p<0.05)</span>' : ''}</div>
              </div>
            </div>
          `;
        }
      },
      visualMap: [
        {
          right: 5,
          top: 'center',
          dimension: 2,
          min: minLift,
          max: maxLift,
          itemHeight: 110,
          itemWidth: 12,
          calculable: true,
          precision: 2,
          text: ['高 Lift', '低 Lift'],
          textStyle: { color: textColor, fontSize: 10 },
          inRange: {
            color: isDark
              ? ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
              : ['#2563eb', '#7c3aed', '#d97706', '#dc2626']
          }
        }
      ],
      xAxis: {
        name: '支持度 (%)',
        nameLocation: 'middle',
        nameGap: 26,
        nameTextStyle: { color: textColor, fontSize: 11 },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: textColor, fontFamily: 'monospace', fontSize: 10 }
      },
      yAxis: {
        name: '信心度 (%)',
        nameLocation: 'middle',
        nameGap: 34,
        nameTextStyle: { color: textColor, fontSize: 11 },
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: textColor, fontFamily: 'monospace', fontSize: 10 }
      },
      series: [
        {
          name: '關聯規則',
          type: 'scatter',
          data,
          symbolSize: (val: any) => {
            const lift = val[2];
            return Math.min(22, Math.max(6, Math.sqrt(lift) * 6.5));
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: isDark ? '#52525b' : '#a1a1aa', type: 'dotted', width: 1.5 },
            data: [
              { xAxis: medianSupport, label: { formatter: '中位支持度', color: textColor, fontSize: 9 } },
              { yAxis: medianConfidence, label: { formatter: '中位信心度', color: textColor, fontSize: 9 } }
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
  }, [displayRules, medianSupport, medianConfidence, resolvedTheme]);

  const handleExportPNG = () => {
    if (!chartInstanceRef.current) return;
    const isDark = resolvedTheme === 'dark';
    const url = chartInstanceRef.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: isDark ? '#09090b' : '#ffffff'
    });
    const link = document.createElement('a');
    link.download = `rules_scatter_plot_${Date.now()}.png`;
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
          <ScatterIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 m-0">
            規則散佈圖：支持度 vs 信心度 vs 提升度
          </h3>
        </div>

        <button
          type="button"
          onClick={handleExportPNG}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 transition"
          title="匯出圖表 PNG"
        >
          <Download className="w-3.5 h-3.5" />
          <span>匯出 PNG</span>
        </button>
      </div>

      {/* 2. Description & 3. Statistics Area */}
      <div data-testid="scatter-desc" className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <p className="m-0 text-[11px] leading-relaxed">
          以支持度為 X 軸、信心度為 Y 軸，氣泡半徑與色相代表提升度 (Lift)。中位數基準線將規則劃分至四大經營象限。
        </p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            規則數: {Math.min(rules.length, 300)} 條
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            中位支持度: {medianSupport.toFixed(1)}%
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            中位信心度: {medianConfidence.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 4. Chart Drawing Canvas Area (No absolute elements overlapping) */}
      <div data-testid="scatter-canvas" className="w-full h-[320px] sm:h-[400px] lg:h-[460px] bg-zinc-50 dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div ref={chartRef} className="w-full h-full" />
      </div>

      {/* 5. Legend / Quadrants Footer Area */}
      <div data-testid="scatter-legend" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-lg space-y-0.5">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">右上象限：核心主力</span>
          <p className="m-0 leading-relaxed">高支持度 + 高信心度。大眾主流客群的高頻搭售組合，適合做常態陳列與主推加價購。</p>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-lg space-y-0.5">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">左上象限：利基黑馬</span>
          <p className="m-0 leading-relaxed">低支持度 + 高信心度 (高 Lift)。特定受眾精準需求，搭售促購轉換率最高，適合精準推播。</p>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-lg space-y-0.5">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">右下象限：大眾泛用</span>
          <p className="m-0 leading-relaxed">高支持度 + 低信心度。民生基礎消耗品，本來就常買，搭售引導增量效果有限。</p>
        </div>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-lg space-y-0.5">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">左下象限：微弱偶發</span>
          <p className="m-0 leading-relaxed">低支持度 + 低信心度。多為偶發隨機交易或弱關聯，通常作為過濾排除對象。</p>
        </div>
      </div>
    </div>
  );
};
