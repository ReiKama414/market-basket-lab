import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Layers,
  X,
  Tag
} from 'lucide-react';
import { AssociationRule } from '../types/basket';
import { useTheme } from '../context/ThemeContext';

interface CytoscapeNetworkProps {
  rules: AssociationRule[];
}

type LayoutName = 'cose' | 'concentric' | 'circle' | 'breadthfirst' | 'grid';

export const CytoscapeNetwork: React.FC<CytoscapeNetworkProps> = ({ rules }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const { resolvedTheme } = useTheme();

  const [minLift, setMinLift] = useState<number>(1.0);
  // No UI exposes a confidence filter here, and a hidden non-zero default would silently drop
  // rules mined with a lower Min Confidence than 20%. Keep it at 0 (mining thresholds already apply).
  const minConfidence = 0;
  const [currentLayout, setCurrentLayout] = useState<LayoutName>('cose');
  const [selectedNode, setSelectedNode] = useState<{ id: string; degree: number } | null>(null);
  const [nodeRules, setNodeRules] = useState<AssociationRule[]>([]);

  const filteredRules = useMemo(() => {
    return rules
      .filter(r => r.lift >= minLift && r.confidence >= minConfidence)
      .slice(0, 150);
  }, [rules, minLift, minConfidence]);

  const elements = useMemo(() => {
    const nodeMap = new Map<string, { id: string; degree: number }>();
    const edges: any[] = [];

    for (const rule of filteredRules) {
      for (const aItem of rule.antecedent) {
        if (!nodeMap.has(aItem)) {
          nodeMap.set(aItem, { id: aItem, degree: 0 });
        }
        nodeMap.get(aItem)!.degree += 1;

        for (const cItem of rule.consequent) {
          if (!nodeMap.has(cItem)) {
            nodeMap.set(cItem, { id: cItem, degree: 0 });
          }
          nodeMap.get(cItem)!.degree += 1;

          edges.push({
            data: {
              id: `${aItem}->${cItem}-${rule.id}`,
              source: aItem,
              target: cItem,
              confidence: rule.confidence,
              lift: rule.lift,
              support: rule.support,
              label: `${rule.lift.toFixed(2)}x`,
              isHighLift: rule.lift >= 1.5
            }
          });
        }
      }
    }

    const nodes = Array.from(nodeMap.values()).map(n => ({
      data: {
        id: n.id,
        label: n.id,
        degree: n.degree,
        size: Math.min(42, Math.max(20, 15 + Math.sqrt(n.degree) * 5.5))
      }
    }));

    return [...nodes, ...edges];
  }, [filteredRules]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const isDark = resolvedTheme === 'dark';

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': isDark ? '#18181b' : '#ffffff',
            'border-color': isDark ? '#71717a' : '#18181b',
            'border-width': 2,
            'label': 'data(label)',
            'color': isDark ? '#f4f4f5' : '#18181b',
            'font-size': '10px',
            'font-family': 'ui-sans-serif, system-ui, sans-serif',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-outline-color': isDark ? '#09090b' : '#ffffff',
            'text-outline-width': 2,
            'width': 'data(size)',
            'height': 'data(size)'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': isDark ? '#f59e0b' : '#d97706',
            'border-width': 4,
            'background-color': isDark ? '#27272a' : '#f4f4f5'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 'mapData(confidence, 0.1, 1.0, 1.5, 5)',
            'line-color': isDark ? '#3f3f46' : '#d4d4d8',
            'target-arrow-color': isDark ? '#52525b' : '#a1a1aa',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.1,
            'opacity': 0.85
          }
        },
        {
          selector: 'edge[?isHighLift]',
          style: {
            'line-color': isDark ? '#d97706' : '#b45309',
            'target-arrow-color': isDark ? '#f59e0b' : '#d97706',
            'width': 3,
            'opacity': 1
          }
        },
        {
          // Applied on node tap: dim everything outside the selected node's neighbourhood
          selector: '.faded',
          style: {
            'opacity': 0.15,
            'text-opacity': 0.25
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-color': isDark ? '#f59e0b' : '#d97706',
            'border-width': 3
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': isDark ? '#ef4444' : '#dc2626',
            'target-arrow-color': isDark ? '#ef4444' : '#dc2626',
            'width': 4,
            'label': 'data(label)',
            'font-size': '10px',
            'color': isDark ? '#fbbf24' : '#b45309',
            'text-background-color': isDark ? '#18181b' : '#ffffff',
            'text-background-opacity': 0.9,
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle'
          }
        }
      ],
      layout: {
        name: currentLayout,
        animate: true,
        animationDuration: 400
      }
    });

    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      const nodeId = node.id();
      const nodeDegree = node.data('degree');

      const related = filteredRules.filter(
        r => r.antecedent.includes(nodeId) || r.consequent.includes(nodeId)
      );

      setSelectedNode({ id: nodeId, degree: nodeDegree });
      setNodeRules(related);

      // Highlight connected edges & neighbors
      cy.elements().removeClass('highlighted faded');
      const neighborhood = node.neighborhood().add(node);
      neighborhood.addClass('highlighted');
      cy.elements().not(neighborhood).addClass('faded');
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setNodeRules([]);
        cy.elements().removeClass('highlighted faded');
      }
    });

    cyRef.current = cy;

    // The graph was rebuilt: a previously selected node/highlight no longer applies
    setSelectedNode(null);
    setNodeRules([]);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, resolvedTheme, currentLayout]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 20);
  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.layout({ name: currentLayout, animate: true }).run();
      cyRef.current.fit(undefined, 20);
    }
  };

  const handleExportPNG = () => {
    if (!cyRef.current) return;
    const isDark = resolvedTheme === 'dark';
    const png64 = cyRef.current.png({ full: true, scale: 2, bg: isDark ? '#09090b' : '#ffffff' });
    const link = document.createElement('a');
    link.download = `association_network_${Date.now()}.png`;
    link.href = png64;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nodeCount = useMemo(() => {
    const set = new Set<string>();
    filteredRules.forEach(r => {
      r.antecedent.forEach(i => set.add(i));
      r.consequent.forEach(i => set.add(i));
    });
    return set.size;
  }, [filteredRules]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs p-4 sm:p-5 space-y-4 w-full max-w-full">
      {/* 1. Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 m-0">
            商品共購關聯網絡圖 (Cytoscape.js)
          </h3>
        </div>

        {/* Dynamic Filters & Layout Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Layout Selector */}
          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px] px-1 hidden sm:flex items-center">
              <Layers className="w-3 h-3 mr-1" />
              佈局:
            </span>
            {(['cose', 'concentric', 'circle', 'breadthfirst', 'grid'] as LayoutName[]).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setCurrentLayout(l)}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[11px] font-medium uppercase transition ${
                  currentLayout === l
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Lift Filter Slider */}
          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Lift:</span>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={minLift}
              aria-label="網絡圖最小提升度"
              onChange={(e) => setMinLift(parseFloat(e.target.value))}
              className="w-14 sm:w-16 h-1 bg-zinc-300 dark:bg-zinc-700 rounded accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
            />
            <span className="font-mono text-zinc-900 dark:text-zinc-100 text-[11px] font-semibold">{minLift.toFixed(1)}x</span>
          </div>

          {/* Zoom & Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-700"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-700"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFit}
              className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-700"
              title="最適大小"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-700"
              title="重設佈局"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportPNG}
              className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-700"
              title="匯出 PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Description & 3. Statistics Area */}
      <div data-testid="network-desc" className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <p className="m-0 text-[11px] leading-relaxed">
          有向邊指向被觸發購買之商品，箭頭代表推薦方向。支援滑鼠滾輪縮放與點擊節點高亮關聯商品。
        </p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            商品節點數: {nodeCount} 個
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            關聯邊數: {filteredRules.length} 條
          </span>
        </div>
      </div>

      {/* 4. Chart Drawing Canvas Area (No overlapping absolute cards) */}
      <div data-testid="network-canvas" className="relative w-full h-[360px] sm:h-[460px] lg:h-[500px] bg-zinc-50 dark:bg-zinc-950/70 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
        {filteredRules.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400 pointer-events-none">
            沒有符合目前提升度篩選的關聯規則
          </div>
        )}
      </div>

      {/* 5. Legend Area (in Document Flow) */}
      <div data-testid="network-legend" className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-lg text-xs text-zinc-700 dark:text-zinc-300">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">圖例指南:</span>
        <div className="flex items-center space-x-1.5 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 inline-block" />
          <span>節點大小 = 商品度數 (連接關聯數)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px]">
          <span className="w-4 h-1 bg-amber-600 dark:bg-amber-400 inline-block rounded" />
          <span>金色箭頭 = 高提升度 (Lift ≥ 1.5x)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px]">
          <span className="w-4 h-0.5 bg-zinc-400 dark:bg-zinc-600 inline-block" />
          <span>連線粗細 = 信心度 (Confidence)</span>
        </div>
      </div>

      {/* 6. Selected Node Detail Panel (in Document Flow, Never overlaps canvas) */}
      {selectedNode && (
        <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400 block">選取商品節點</span>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 m-0">{selectedNode.id}</h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="關閉商品抽屜"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
            商品度數 (連接規則數): <strong className="text-zinc-900 dark:text-zinc-200 font-bold">{selectedNode.degree}</strong> | 相關關聯規則 ({nodeRules.length} 條):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {nodeRules.slice(0, 6).map((r, idx) => (
              <div key={idx} className="p-2.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                  <span>{r.antecedent.join(', ')}</span>
                  <span className="text-zinc-400 mx-1">→</span>
                  <span>{r.consequent.join(', ')}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  <span>Lift: <strong className="text-amber-600 dark:text-amber-400">{r.lift.toFixed(2)}x</strong></span>
                  <span>Conf: {(r.confidence * 100).toFixed(0)}%</span>
                  <span>Sup: {(r.support * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
