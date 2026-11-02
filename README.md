# Market Basket Lab — Association Rules Mining Workbench

**English** · [繁體中文](README.zh-TW.md)

> **Market basket association rules mining workbench**. Implements Apriori and FP-Growth algorithms, featuring Web Worker background multi-threading, interactive ECharts statistics, Cytoscape.js directed association networks, What-If cart cross-sell simulator, and IndexedDB local persistence.

<p align="center">
  <img src="test-results/screenshots/workbench-dark.png" alt="Market Basket Lab Professional Workbench" width="900" />
</p>

<p align="center">
  <a href="https://github.com/ReiKama414/market-basket-lab"><img src="https://img.shields.io/badge/GitHub-ReiKama414-181717?logo=github" alt="GitHub" /></a>
  <a href="https://reikama414.vercel.app/"><img src="https://img.shields.io/badge/Author-ReiKama414-000000" alt="Website" /></a>
  <img src="https://img.shields.io/badge/License-All_Rights_Reserved-red" alt="License" />
  <img src="https://img.shields.io/badge/React-19-blue" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/E2E-Playwright_Passed-success" alt="E2E Tests" />
</p>

<p align="center">
  <a href="https://github.com/ReiKama414/market-basket-lab">GitHub Repository</a> · <a href="https://reikama414.vercel.app/">Personal Website</a> · <a href="#quick-start">Quick Start</a> · <a href="#core-analytical-dimensions">Analysis Dimensions</a> · <a href="#license--permissions">License</a>
</p>

---

## Why This Project

Market Basket Analysis (MBA) is fundamental for physical retail shelf placement, e-commerce checkout cross-selling, and food combo promotions. Traditional analysis often requires heavy server-side Python pipelines or paid SaaS products, making it difficult to achieve both data privacy and instant interactive exploration in pure front-end environments.

Market Basket Lab is a 100% client-side Single Page Application (SPA) without any backend server or paid third-party APIs. All computation executes asynchronously inside Web Workers, keeping customer transactions completely on the user's device.

---

## Highlights

- **Dual Mining Engines** — Complete implementations of both FP-Growth (prefix pattern tree) and Apriori (accelerated with inverted transaction index intersection), with sub-second switching and performance comparisons.
- **Rigorous Mathematical Metrics** — Computes Support, Confidence, Lift, Conviction, Leverage, Zhang's metric, and Chi-Square statistical significance tests ($p < 0.05$).
- **Six Visualization Workspaces** — Interactive rules table, Cytoscape.js association network topology, Pareto 80/20 distribution chart, ECharts scatter plot, pairwise co-occurrence affinity heatmap, and What-If cart simulator.
- **Zero UI Freezing with Web Workers** — CSV parsing and recursive pattern mining run in background threads with real-time percentage progress and cancel capability.
- **Local Persistence via IndexedDB** — Integrated IndexedDB layer to save custom projects, past mining history, and pinned business rules offline.
- **Zero-Overlap Dual Themes** — Minimalist monochrome workbench design supporting System, Light, and Dark modes, strictly verified across 9 viewports for zero clipping, zero unexpected overlay, and zero horizontal page overflow.
- **Automated Theoretical Verification** — Built-in automated mathematical validation suite verifying Anti-Monotone property, Apriori vs FP-Growth equivalence, Lift symmetry, probability bounds, and textbook Agrawal true values.

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | React 19 · TypeScript 5.8 | Modular workbench UI with strict typing |
| **Build Tooling** | Vite 8 · Tailwind CSS v4 | Rapid bundling and modern CSS token system |
| **Charts & Analytics** | Apache ECharts 6 | Pareto 80/20 dual-axis chart, scatter quadrant plot, affinity heatmap |
| **Network Graph** | Cytoscape.js 3 | Directed association network supporting CoSE, Concentric, Circle, and Grid layouts |
| **Multi-Threading** | Web Workers API | Background CSV parsing, FP-Tree construction, and itemset mining |
| **Local Storage** | IndexedDB (`idb` wrapper) | Offline project library, execution history, and pinned rule bookmarks |
| **Automated Testing** | Vitest · Playwright | Mathematical unit tests, zero-overlap bounding box checks, and RWD verification |

---

## Quick Start

### Requirements

- Node.js 20+ or 22+ LTS
- Modern web browser (supporting ES Modules, Web Workers, and IndexedDB)

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/ReiKama414/market-basket-lab.git
cd market-basket-lab

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open the localhost URL displayed in the terminal (default: `http://localhost:5173`).

---

## Testing & Verification

The project includes an end-to-end automated testing pipeline covering unit tests, textbook true-value benchmarking, and browser layout integrity checks.

```bash
# Run core mathematical algorithm unit tests (Vitest)
npm test

# Run textbook Agrawal dataset verification script (CLI)
npm run test:verify

# Production build check
npm run build

# Run 13 Playwright E2E and zero-overlap layout tests
npm run test:e2e
```

> **Note:** To inspect interactive browser testing, run `npx playwright test --ui` to open the visual test runner.

---

## Core Analytical Dimensions

### 1. Association Rules Table
- Multi-column instant sorting, item keyword search, minimum Lift filter, and Chi-Square significance toggles.
- Expandable plain-language business recommendations (e.g., customers who bought A have an 80% likelihood of buying B, a 3.2x lift over random chance).
- True CSV export with UTF-8 BOM (compatible with Microsoft Excel) and structured JSON format.

### 2. Directed Association Network (Cytoscape.js)
- 5 graph layouts: CoSE (force-directed), Concentric, Circle, Breadthfirst, and Grid.
- Node sizes reflect degree centrality; golden arrows indicate high-lift rules ($\text{Lift} \ge 1.5$).
- Clicking any node opens an isolated detail card below the canvas, ensuring zero visual overlap with the graph.

### 3. Pareto 80/20 Distribution Chart
- Dual-axis bar and line chart displaying item frequencies and cumulative sales percentage for the top 20 items.
- Identifies the 80% core item cutoff line to separate head items from long-tail opportunities.

### 4. Rule Scatter Plot (ECharts Scatter)
- Support on X-axis, Confidence on Y-axis, with bubble radius and hue mapped to Lift.
- Median reference lines divide rules into four quadrants: Core Drivers, High-Conversion Niche, Staples, and Infrequent Pairs.

### 5. Pairwise Co-Occurrence Affinity Heatmap (ECharts Heatmap)
- Cross-tabulated co-occurrence matrix color-coded by Lift or Confidence.
- Informs physical store end-cap displays and e-commerce cart cross-sell recommendations.

### 6. What-If Shopping Cart Simulator
- Simulates real customer journeys in online stores or point-of-sale systems.
- Cart contents dynamically match association rules, showing recommended add-ons, trigger confidence, and conversion lift, with strategy export.

---

## Project Structure

```text
market-basket-lab/
├── src/
│   ├── algorithms/          # Mining algorithms and math verification
│   │   ├── apriori.ts       # Optimized Apriori with inverted index
│   │   ├── fpgrowth.ts      # Recursive FP-Growth engine
│   │   ├── rules.ts         # Association metric calculator
│   │   └── tests.ts         # 5 automated mathematical validation tests
│   ├── components/          # Workbench UI components
│   │   ├── Header.tsx       # Top navigation, dataset selector, metrics bar
│   │   ├── ControlsPanel.tsx# Sliders, presets, and safety limits
│   │   ├── RulesTable.tsx   # Rules table, search, bookmarks, CSV export
│   │   ├── CytoscapeNetwork.tsx # Cytoscape.js association network
│   │   ├── EChartsScatterPlot.tsx # ECharts scatter quadrant plot
│   │   ├── EChartsHeatmap.tsx    # ECharts co-occurrence affinity heatmap
│   │   ├── EChartsPareto.tsx     # ECharts Pareto 80/20 distribution
│   │   ├── ItemsetsView.tsx      # Hierarchical frequent itemsets
│   │   ├── BasketSimulator.tsx   # What-If shopping cart simulator
│   │   ├── ProjectHistoryModal.tsx # IndexedDB project and history drawer
│   │   ├── ValidationTests.tsx   # Math validation modal
│   │   └── DataPreviewModal.tsx  # CSV upload and column mapping
│   ├── context/             # Theme Context (System / Light / Dark)
│   ├── datasets/            # Sample datasets and resilient CSV parser
│   ├── storage/             # IndexedDB persistence layer (idb)
│   ├── workers/             # Web Worker background thread
│   ├── types/               # TypeScript data models
│   ├── App.tsx              # Application layout and state orchestration
│   └── main.tsx             # Application entrypoint
├── tests/
│   └── e2e/                 # Playwright zero-overlap & RWD tests
├── test/
│   └── verify.ts            # CLI textbook benchmark script
├── test-results/            # Generated screenshots and test artifacts
├── LICENSE                  # Project license agreement
├── package.json
└── vite.config.ts
```

---

## Static Deployment

Market Basket Lab is a static SPA and can be deployed directly to Cloudflare Pages, Vercel, or GitHub Pages.

### Deploy to Cloudflare Pages

1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Select **Create application** → **Pages** → **Connect to Git**.
3. Choose this repository and configure build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**.

Or deploy directly with Wrangler CLI:
```bash
npm run build
npx wrangler pages deploy dist --project-name market-basket-lab
```

---

## Boundaries & Known Limitations

- **Browser Tab Memory Limit** — Client-side mining is bounded by available browser tab memory (typically 2GB–4GB). A built-in transaction safety limit restricts processing to the first 10,000 / 30,000 / 50,000 orders when desired.
- **Combinatorial Explosion Protection** — If distinct items exceed 1,000 and minimum support is set too low, candidate subsets can grow exponentially. For large datasets, keep `Min Support ≥ 1%` or `Max Itemset Size ≤ 4`.
- **Privacy & Offline Guarantee** — All analysis is performed entirely inside the local browser. Uploaded CSV data is never sent to any server. Clearing browser cache resets local IndexedDB records.

---

## External Links

- [GitHub Repository](https://github.com/ReiKama414/market-basket-lab)
- [Author's Personal Website](https://reikama414.vercel.app/)
- [Full License Terms](./LICENSE)

---

## License / Permissions

Copyright (c) 2026 ReiKama414. All rights reserved.

This project is provided solely for personal viewing and learning purposes. No permission is granted to use, copy, modify, distribute, or incorporate this software into other projects (whether for commercial or non-commercial purposes) without express written consent of the copyright holder.

- [GitHub](https://github.com/ReiKama414/market-basket-lab)
- [Personal Website](https://reikama414.vercel.app/)
- [Full License Terms](./LICENSE)

---

<sub>ReiKama414 · Market Basket Lab · All Rights Reserved</sub>
