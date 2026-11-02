import { test, expect, Page } from '@playwright/test';

// Helper to check that two elements do not overlap
async function checkNoOverlap(page: Page, selectorA: string, selectorB: string, contextName: string) {
  const elA = page.locator(selectorA).first();
  const elB = page.locator(selectorB).first();

  if (await elA.isVisible() && await elB.isVisible()) {
    const boxA = await elA.boundingBox();
    const boxB = await elB.boundingBox();

    if (boxA && boxB && boxA.height > 0 && boxB.height > 0) {
      const hasIntersection = !(
        boxA.x + boxA.width <= boxB.x + 0.5 ||
        boxB.x + boxB.width <= boxA.x + 0.5 ||
        boxA.y + boxA.height <= boxB.y + 0.5 ||
        boxB.y + boxB.height <= boxA.y + 0.5
      );

      expect(
        hasIntersection,
        `[ZERO OVERLAP BUG in ${contextName}]: Elements "${selectorA}" and "${selectorB}" overlap! BoxA: ${JSON.stringify(boxA)}, BoxB: ${JSON.stringify(boxB)}`
      ).toBe(false);
    }
  }
}

test.describe('Market Basket Lab Workbench E2E & Layout Integrity Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the background Web Worker to finish initial mining
    await expect(page.locator('header').locator('strong', { hasText: '800' })).toBeVisible({ timeout: 12000 });
  });

  test('should display workbench header, stats, and default rules table', async ({ page }) => {
    // Check brand in header
    await expect(page.locator('header').getByText('Market Basket')).toBeVisible();
    await expect(page.locator('header').getByText('PRO')).toBeVisible();

    // Verify rules table headers are visible
    await expect(page.locator('th:has-text("前項商品")')).toBeVisible();
    await expect(page.locator('th:has-text("後項商品")')).toBeVisible();
    await expect(page.locator('th:has-text("提升度 (Lift)")')).toBeVisible();

    // Verify rules rows exist
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('should allow switching datasets and re-mining', async ({ page }) => {
    // Select 3C dataset
    const datasetSelect = page.locator('header select[aria-label="選擇資料集"]');
    await datasetSelect.selectOption('tech');

    // Wait for Web Worker to finish processing 3C dataset (600 orders)
    await expect(page.locator('header').locator('strong', { hasText: '600' })).toBeVisible({ timeout: 12000 });
  });

  test('should adjust threshold sliders and recalculate', async ({ page }) => {
    // Adjust Min Support using preset button (e.g. 15%)
    await page.locator('button:has-text("15%")').first().click();

    // Click Apply
    await page.locator('button:has-text("套用門檻並重新計算")').first().click();

    // Wait for completion
    await expect(page.locator('header').locator('strong', { hasText: '800' })).toBeVisible();
  });

  test('should switch between all analysis tabs smoothly', async ({ page }) => {
    // Switch to Cytoscape Network Graph
    await page.locator('button:has-text("關聯網絡圖")').click();
    await expect(page.locator('text=商品共購關聯網絡圖 (Cytoscape.js)')).toBeVisible();

    // Switch to Itemsets & Pareto
    await page.locator('button:has-text("頻繁項集與二八分析")').click();
    await expect(page.locator('text=商品頻率與二八法則分佈圖 (Pareto 80/20)')).toBeVisible();

    // Switch to Scatter Plot
    await page.locator('button:has-text("規則散佈圖 (ECharts)")').click();
    await expect(page.locator('text=規則散佈圖：支持度 vs 信心度 vs 提升度')).toBeVisible();

    // Switch to Heatmap
    await page.locator('button:has-text("共購親和矩陣 (ECharts)")').click();
    await expect(page.locator('text=熱門商品共購親和矩陣')).toBeVisible();

    // Switch to Cart Simulator
    await page.locator('button:has-text("購物車推薦模擬")').click();
    await expect(page.locator('text=購物車即時交叉銷售推薦模擬器')).toBeVisible();
  });

  test('should simulate shopping cart and trigger cross-sell recommendations', async ({ page }) => {
    // Go to Simulator tab
    await page.locator('button:has-text("購物車推薦模擬")').click();
    await expect(page.locator('text=購物車即時交叉銷售推薦模擬器')).toBeVisible();

    // Click first quick-add button
    const quickAddBtns = page.locator('button[data-testid="quick-add-btn"]');
    await quickAddBtns.first().waitFor({ state: 'visible' });
    await quickAddBtns.first().click();

    // Verify item added to cart
    const countBadge = page.locator('[data-testid="cart-count-badge"]');
    await expect(countBadge).toContainText('1 件商品');

    // Click second quick-add button
    await quickAddBtns.nth(1).click();
    await expect(countBadge).toContainText('2 件商品');
  });

  test('should open and execute mathematical validation test suite', async ({ page }) => {
    // Click Rule Validation button
    await page.locator('button:has-text("規則驗證")').click();

    // Verify modal appears
    await expect(page.locator('text=規則驗證與數學測試套件')).toBeVisible();
    await expect(page.locator('text=5 / 5 測試通過 (100%)')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("關閉視窗")').click();
    await expect(page.locator('text=規則驗證與數學測試套件')).not.toBeVisible();
  });

  test('should open Project History & Storage modal', async ({ page }) => {
    // Click Project Library button
    await page.locator('button:has-text("專案庫")').click();

    // Verify modal appears
    await expect(page.locator('text=專案庫與探勘歷史紀錄 (IndexedDB)')).toBeVisible();
    await expect(page.locator('text=儲存目前分析為專案：')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("關閉")').last().click();
  });

  test('should support light and dark theme switching correctly', async ({ page }) => {
    const html = page.locator('html');

    // Switch to Dark mode
    const darkBtn = page.locator('button[aria-label="深色模式"]');
    await expect(darkBtn).toBeVisible();
    await darkBtn.click();
    await expect(html).toHaveClass(/dark/);
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Switch to Light mode
    const lightBtn = page.locator('button[aria-label="淺色模式"]');
    await expect(lightBtn).toBeVisible();
    await lightBtn.click();
    await expect(html).not.toHaveClass(/dark/);
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Switch back to System mode
    const systemBtn = page.locator('button[aria-label="系統模式"]');
    await expect(systemBtn).toBeVisible();
    await systemBtn.click();
  });

  test('should test mobile drawer and mobile navigation on small screens', async ({ page }) => {
    // Set viewport to mobile 375px
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile sidebar drawer
    const drawerBtn = page.locator('button[aria-label="開啟門檻設定側邊欄"]');
    await expect(drawerBtn).toBeVisible();
    await drawerBtn.click();

    // Verify mobile drawer is open
    await expect(page.getByText('參數與過濾門檻')).toBeVisible();

    // Close mobile drawer
    const closeDrawerBtn = page.locator('button[aria-label="關閉門檻選單"]');
    await closeDrawerBtn.click();
    await expect(page.getByText('參數與過濾門檻')).not.toBeVisible();

    // Open mobile menu
    const menuBtn = page.locator('button[aria-label="切換功能選單"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Verify mobile menu items
    await expect(page.locator('label:has-text("切換資料集")')).toBeVisible();
  });

  test('should pass responsive verification across all 9 viewports without horizontal overflow', async ({ page }) => {
    const viewports = [
      { name: '320px (Tiny Mobile)', width: 320, height: 568 },
      { name: '375px (Small Mobile)', width: 375, height: 667 },
      { name: '390px (Standard Mobile)', width: 390, height: 844 },
      { name: '430px (Large Mobile)', width: 430, height: 932 },
      { name: '768px (Tablet Portrait)', width: 768, height: 1024 },
      { name: '1024px (Tablet Landscape)', width: 1024, height: 768 },
      { name: '1280px (Laptop)', width: 1280, height: 800 },
      { name: '1440px (Desktop)', width: 1440, height: 900 },
      { name: '1920px (Large Desktop)', width: 1920, height: 1080 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(100);

      // Verify no horizontal overflow on document
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(
        isOverflowing,
        `Viewport ${vp.name} (${vp.width}px) has unwanted horizontal overflow: scrollWidth=${await page.evaluate(() => document.documentElement.scrollWidth)} > innerWidth=${vp.width}`
      ).toBe(false);

      // Verify header and brand are visible
      await expect(page.locator('header')).toBeVisible();
    }
  });

  test('should verify ZERO-OVERLAP in Chart Cards & Document Flow', async ({ page }) => {
    // 1. Verify Scatter Plot card layout integrity
    await page.locator('button:has-text("規則散佈圖 (ECharts)")').click();
    await expect(page.locator('text=規則散佈圖：支持度 vs 信心度 vs 提升度')).toBeVisible();
    await page.waitForTimeout(300);

    await checkNoOverlap(page, 'h3:has-text("規則散佈圖")', '[data-testid="scatter-desc"]', 'ScatterPlot Header vs Description');
    await checkNoOverlap(page, '[data-testid="scatter-desc"]', '[data-testid="scatter-canvas"]', 'ScatterPlot Description vs Canvas');
    await checkNoOverlap(page, '[data-testid="scatter-canvas"]', '[data-testid="scatter-legend"]', 'ScatterPlot Canvas vs Legend');

    // 2. Verify Heatmap card layout integrity
    await page.locator('button:has-text("共購親和矩陣 (ECharts)")').click();
    await expect(page.locator('text=熱門商品共購親和矩陣')).toBeVisible();
    await page.waitForTimeout(300);

    await checkNoOverlap(page, 'h3:has-text("熱門商品共購親和矩陣")', '[data-testid="heatmap-desc"]', 'Heatmap Header vs Description');
    await checkNoOverlap(page, '[data-testid="heatmap-desc"]', '[data-testid="heatmap-canvas"]', 'Heatmap Description vs Canvas');
    await checkNoOverlap(page, '[data-testid="heatmap-canvas"]', '[data-testid="heatmap-footer"]', 'Heatmap Canvas vs Footer');

    // 3. Verify Pareto card layout integrity
    await page.locator('button:has-text("頻繁項集與二八分析")').click();
    await expect(page.locator('text=商品頻率與二八法則分佈圖 (Pareto 80/20)')).toBeVisible();
    await page.waitForTimeout(300);

    await checkNoOverlap(page, 'h3:has-text("商品頻率與二八法則分佈圖")', '[data-testid="pareto-desc"]', 'Pareto Header vs Description');
    await checkNoOverlap(page, '[data-testid="pareto-desc"]', '[data-testid="pareto-canvas"]', 'Pareto Description vs Canvas');
    await checkNoOverlap(page, '[data-testid="pareto-canvas"]', '[data-testid="pareto-footer"]', 'Pareto Canvas vs Footer');

    // 4. Verify Cytoscape Network card layout integrity
    await page.locator('button:has-text("關聯網絡圖")').click();
    await expect(page.locator('text=商品共購關聯網絡圖 (Cytoscape.js)')).toBeVisible();
    await page.waitForTimeout(300);

    await checkNoOverlap(page, 'h3:has-text("商品共購關聯網絡圖")', '[data-testid="network-desc"]', 'Network Header vs Description');
    await checkNoOverlap(page, '[data-testid="network-desc"]', '[data-testid="network-canvas"]', 'Network Description vs Canvas');
    await checkNoOverlap(page, '[data-testid="network-canvas"]', '[data-testid="network-legend"]', 'Network Canvas vs Legend');
  });

  test('should maintain layout integrity under 200% font/zoom scale', async ({ page }) => {
    // Set viewport to laptop
    await page.setViewportSize({ width: 1280, height: 800 });

    // Emulate 200% zoom
    await page.evaluate(() => {
      document.body.style.zoom = '2.0';
    });
    await page.waitForTimeout(300);

    // Verify header remains functional
    await expect(page.locator('header')).toBeVisible();

    // Verify tab buttons are visible and clickable under zoom
    const rulesTab = page.locator('button:has-text("商品共購規則")');
    await expect(rulesTab).toBeVisible();
    await rulesTab.click();

    // Verify rules table is visible
    await expect(page.locator('th:has-text("前項商品")')).toBeVisible();

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1.0';
    });
  });

  test('should capture visual screenshots for Light and Dark themes', async ({ page }) => {
    // Light Mode Screenshot
    const lightBtn = page.locator('button[aria-label="淺色模式"]');
    await lightBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/screenshots/workbench-light.png', fullPage: false });

    // Dark Mode Screenshot
    const darkBtn = page.locator('button[aria-label="深色模式"]');
    await darkBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/screenshots/workbench-dark.png', fullPage: false });

    // Mobile Viewport Screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/screenshots/workbench-mobile-390.png', fullPage: false });
  });
});
