# 🎨 ASSET_REQUESTS.md - Visual Assets Specification for ComfyUI

本文件記錄 Market Basket Lab 未來視覺素材（Logo、橫幅、空狀態插圖）之生成規格與 Prompt 指引。系統現階段全面採用純向量 SVG 與簡潔占位區，不依賴外部美術圖檔，確保功能與效能不被阻塞。

---

## 1. 專案主視覺標誌 (App Logo & Icon)
- **檔案路徑**：`assets/branding/logo.png` / `assets/branding/favicon.svg`
- **尺寸規格**：512 x 512 px (1:1 正方形, PNG 格式，透明背景)
- **建議 ComfyUI 模型**：SDXL / Flux.1-Dev
- **Prompt (Positive)**:
  ```text
  minimalist modern technology logo for retail data analytics, a sleek shopping basket morphing into interconnected graph nodes and data network, vector style, flat design, indigo and amber color palette, sharp edges, dark slate background, high precision, professional workbench branding, 8k resolution
  ```
- **Prompt (Negative)**:
  ```text
  3d render, glossy, photorealistic, complex gradient, messy, crowded, text, watermark, blurry, low resolution
  ```

---

## 2. 空狀態插畫 (Empty State Illustration)
- **檔案路徑**：`assets/illustrations/empty-cart.png`
- **尺寸規格**：800 x 600 px (4:3 比例, WebP / PNG)
- **用途**：購物車模擬器無商品時之占位展示。
- **Prompt (Positive)**:
  ```text
  clean minimal line art illustration of an empty shopping cart beside a clean digital checklist, subtle indigo and slate lines, professional SaaS style, white space, technical schematic feel
  ```
- **Prompt (Negative)**:
  ```text
  cartoon, colorful rainbow, messy, cluttered, realistic human
  ```

---

## 3. 社交媒體分享橫幅 (OpenGraph Cover Image)
- **檔案路徑**：`assets/branding/og-preview.png`
- **尺寸規格**：1200 x 630 px (1.91:1 標準 OG 格式)
- **用途**：Cloudflare Pages 社群分享卡片預覽。
- **Prompt (Positive)**:
  ```text
  sleek dark-mode dashboard header for market basket analysis, displaying network graphs of item association, scatter plot bubbles, dark slate background, high tech retail intelligence, clean typography
  ```
