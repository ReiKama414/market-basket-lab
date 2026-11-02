# Market Basket Lab — 購物籃關聯分析工作台

[English](README.md) · **繁體中文**

> **購物籃關聯規則挖掘工作台**。實作 Apriori 與 FP-Growth 演算法，支援 Web Worker 背景多執行緒運算、ECharts 多維度統計圖表、Cytoscape.js 關聯網絡拓撲、購物車即時推薦模擬與 IndexedDB 本機資料庫持久化

<p align="center">
  <img src="test-results/screenshots/workbench-dark.png" alt="Market Basket Lab 專業工作台介面" width="900" />
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
  <a href="https://github.com/ReiKama414/market-basket-lab">GitHub 倉庫</a> · <a href="https://reikama414.vercel.app/">個人網站</a> · <a href="#快速開始">快速開始</a> · <a href="#核心分析維度">分析維度</a> · <a href="#license--權限">授權聲明</a>
</p>

---

## 為什麼做

零售實體門市的端架陳列、電商購物車加價購，以及餐飲套餐搭售，核心皆仰賴「購物籃關聯分析（Market Basket Analysis）」。傳統分析往往依賴肥重的後端 Python 腳本或付費 SaaS 服務，無法在純前端環境兼顧隱私安全與即時互動

本專案採純靜態單頁應用架構（SPA），無任何後端伺服器與外部收費 API。所有運算皆透過瀏覽器 Web Worker 於背景非同步執行，交易資料 100% 留存在使用者端設備，保障營業資料隱私

---

## 核心亮點

- **雙演算法引擎** — 完整實作 FP-Growth（前綴模式樹遞迴）與 Apriori（倒排交易索引位元運算加速），毫秒級切換比對
- **嚴謹數學度量** — 支持度（Support）、信心度（Confidence）、提升度（Lift）、確信度（Conviction）、超額槓桿率（Leverage）、Zhang 關聯度及卡方顯著性檢定（$p < 0.05$）
- **六大視覺化工作台** — 包含規則檢視表、Cytoscape.js 網絡拓撲、二八法則 Pareto 分佈圖、ECharts 散佈圖、熱門親和矩陣與 What-If 購物車模擬器
- **零卡頓 Web Worker** — 巨量訂單解析與候選集遞迴均在背景執行緒運算，主畫面流暢不凍結，支援隨時中斷取消
- **本機資料庫持久化** — 整合 IndexedDB，支援離線儲存自訂專案、歷次探勘紀錄與釘選商務規則
- **雙主題與無重疊排版** — 極致簡約黑白工作台風格，支援 System、Light、Dark 模式，嚴格落實零覆蓋、零裁切與 9 種視窗尺寸適配
- **五大理論真值校驗** — 內建反單調性、演算法等價性、Lift 對稱性、機率邊界合法性與經典 Agrawal 教科書題自動化驗證

---

## 技術棧

| 層級 | 技術選型 | 用途說明 |
| :--- | :--- | :--- |
| **核心框架** | React 19 · TypeScript 5.8 | 元件化工作台架構與嚴格型別定義 |
| **建置工具** | Vite 8 · Tailwind CSS v4 | 模組化打包與高效現代樣式系統 |
| **圖表視覺化** | Apache ECharts 6 | 二八法則雙 Y 軸圖、規則散佈圖、共購親和矩陣 |
| **網絡拓撲** | Cytoscape.js 3 | 有向關聯網絡圖，支援 CoSE、同心圓、環狀等 5 種佈局 |
| **多執行緒** | Web Workers API | 背景解析 CSV、建構 FP-Tree 與規則挖掘 |
| **本機資料庫** | IndexedDB（idb 封裝） | 離線專案庫管理、探勘歷史紀錄與釘選規則持久化 |
| **自動化測試** | Vitest · Playwright | 演算法數學單元測試與端對端零重疊排版驗收 |

---

## 快速開始

### 環境需求

- Node.js 20+ 或 22+ LTS
- 現代瀏覽器（支援 ES Modules、Web Worker 與 IndexedDB）

### 安裝與啟動

```bash
# 1. 複製倉庫
git clone https://github.com/ReiKama414/market-basket-lab.git
cd market-basket-lab

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev
```

開啟瀏覽器終端顯示之網址（預設為 `http://localhost:5173`）

---

## 測試與驗證

專案具備多層級自動化測試鏈，包含單元測試、理論真值比對與真實瀏覽器端對端驗收

```bash
# 執行核心演算法數學單元測試（Vitest）
npm test

# 執行經典 Agrawal 教科書資料集真值校驗腳本
npm run test:verify

# 生產打包驗證
npm run build

# 執行 Playwright 13 項端對端與零重疊排版驗收
npm run test:e2e
```

> **提醒：** 欲觀察瀏覽器操作動態，可執行 `npx playwright test --ui` 開啟圖形化測試工作台

---

## 核心分析維度

### 1. 規則檢視表與白話文決策建議
- 支援多欄位即時排序、品名文字過濾、最小 Lift 篩選與卡方顯著性切換
- 點擊展開可閱讀白話文決策建議（例如：購買 A 的顧客有 80% 也會購買 B，共購機率是一般隨機消費者的 3.2 倍）
- 真實匯出含 UTF-8 BOM 之 CSV 檔案（Excel 直接開啟不亂碼）與 JSON 格式

### 2. 商品共購關聯網絡圖 (Cytoscape.js)
- 支援 CoSE（彈簧力導向）、同心圓、環狀、階層樹與網格 5 種圖佈局
- 節點半徑依商品關聯度數動態加權，金色箭頭標註高提升度規則（$\text{Lift} \ge 1.5$）
- 點擊節點自動於下方獨立面板展開關聯度數與專屬規則清單，畫布與圖例不互相重疊遮擋

### 3. 商品頻率與二八法則分佈圖 (Pareto 80/20)
- 雙 Y 軸展示前 20 大熱銷商品的單品出現次數（柱狀）與累計銷售佔比（折線）
- 標註 80% 核心商品集中分界線，輔助判斷長尾效應與主推搭贈策略

### 4. 規則散佈圖 (ECharts Scatter)
- 以支持度為 X 軸、信心度為 Y 軸，氣泡大小與色相代表提升度
- 中位數參考線劃分四大經營象限：右上核心主力、左上利基黑馬、右下大眾泛用、左下微弱偶發

### 5. 熱門商品共購親和矩陣 (ECharts Heatmap)
- 兩兩交叉熱點圖，可切換依提升度或信心度著色
- 輔助實體門市貨架陳列佈局與電商結帳頁加價購推薦

### 6. 購物車即時交叉銷售推薦模擬器 (What-If Cart Simulator)
- 模擬消費者在線上商城或收銀機的選購歷程
- 購物車內容即時觸發匹配規則，呈現推薦加購品項、促購機率與帶動倍率，並支援匯出策略報表

---

## 專案目錄結構

```text
market-basket-lab/
├── src/
│   ├── algorithms/          # 核心探勘演算法與數學驗證
│   │   ├── apriori.ts       # 倒排索引優化 Apriori
│   │   ├── fpgrowth.ts      # 前綴樹遞迴 FP-Growth
│   │   ├── rules.ts         # 關聯度量指標計算核心
│   │   └── tests.ts         # 5 項自動化數學檢定套件
│   ├── components/          # 專業工作台 UI 元件
│   │   ├── Header.tsx       # 頂部導航、資料集切換、狀態指標
│   │   ├── ControlsPanel.tsx# 門檻滑桿、預設按鈕、保護上限
│   │   ├── RulesTable.tsx   # 關聯規則表格、搜尋、釘選、CSV 匯出
│   │   ├── CytoscapeNetwork.tsx # Cytoscape.js 關聯網絡圖
│   │   ├── EChartsScatterPlot.tsx # ECharts 規則散佈圖
│   │   ├── EChartsHeatmap.tsx    # ECharts 共購親和矩陣
│   │   ├── EChartsPareto.tsx     # ECharts 二八法則分佈圖
│   │   ├── ItemsetsView.tsx      # 頻繁項集階層瀏覽
│   │   ├── BasketSimulator.tsx   # 購物車推薦模擬器
│   │   ├── ProjectHistoryModal.tsx # IndexedDB 專案與歷史抽屜
│   │   ├── ValidationTests.tsx   # 規則驗證測試彈窗
│   │   └── DataPreviewModal.tsx  # CSV 上傳與欄位映射設定
│   ├── context/             # 主題 Context（System / Light / Dark）
│   ├── datasets/            # 內建模擬資料集與 CSV 容錯解析器
│   ├── storage/             # IndexedDB 本機持久化層 (idb)
│   ├── workers/             # Web Worker 背景執行緒
│   ├── types/               # TypeScript 資料模型
│   ├── App.tsx              # 主工作台應用狀態整合
│   └── main.tsx             # 應用程式入口
├── tests/
│   └── e2e/                 # Playwright 零重疊與 RWD 端對端測試
├── test/
│   └── verify.ts            # CLI 理論真值校驗腳本
├── test-results/            # 測試截圖與報告
├── LICENSE                  # 專案授權聲明文件
├── package.json
└── vite.config.ts
```

---

## 靜態部署指引

本專案為純前端靜態 SPA，可直接部署於 Cloudflare Pages、Vercel 或 GitHub Pages

### 部署至 Cloudflare Pages

1. 登入 [Cloudflare 控制台](https://dash.cloudflare.com/) 進入 **Workers & Pages**
2. 點選 **Create application** → **Pages** → **Connect to Git**
3. 選取本倉庫，並配置建置參數：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 點擊 **Save and Deploy** 即可完成發布

亦可透過 Wrangler CLI 直接發布：
```bash
npm run build
npx wrangler pages deploy dist --project-name market-basket-lab
```

---

## 已知邊界與安全限制

- **瀏覽器分頁記憶體上限** — 純前端運算受限於用戶端瀏覽器記憶體（通常為 2GB~4GB）。已內建「資料量上限保護機制」，預設可選擇處理前 10,000 / 30,000 / 50,000 筆訂單
- **組合爆炸防護** — 當相異商品種類數超過 1,000 種且最低支持度設過低時，潛在候選項集可能呈指數成長。大資料量時建議保持 `Min Support ≥ 1%` 或設定 `Max Itemset Size ≤ 4`
- **資料隱私與離線保證** — 所有分析皆在使用者本機端執行，上傳的 CSV 絕不發送到任何伺服器。更換瀏覽器或清除網站快取將重置 IndexedDB 資料

---

## 對外連結

- [GitHub 倉庫](https://github.com/ReiKama414/market-basket-lab)
- [作者個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

## License / 權限

Copyright (c) 2026 ReiKama414. All rights reserved.

本專案僅供個人瀏覽與學習。未經著作權人書面同意，不得使用、複製、修改、散布或併入其他專案（含商業與非商業用途）

- [GitHub](https://github.com/ReiKama414/market-basket-lab)
- [個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

<sub>ReiKama414 · Market Basket Lab · All Rights Reserved</sub>
