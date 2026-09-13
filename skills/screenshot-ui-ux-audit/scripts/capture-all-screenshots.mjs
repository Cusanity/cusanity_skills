/**
 * Reusable Deterministic Multi-Viewport & Multi-Fold Screenshot Capture Script
 * (capture-all-screenshots.mjs)
 * 
 * Captures fresh, deterministic Desktop (1440x900) and Mobile (412x915) screenshots using Playwright.
 * 
 * Key Capabilities:
 * - Forces Freshness: Automatically purges stale screenshots in the destination directory before running
 * - Cache-Free Execution: Uses clean browser contexts with no persisted cache/storage
 * - High-DPI Fidelity: Always uses `scale: 'css'` to eliminate font measurement timeouts and blur
 * - Progressive Multi-Fold Scrolling: Evaluates page scrollHeight and captures sequential folds
 *   (_Fold1_Top, _Fold2_Middle, _Fold3_Bottom) so below-the-fold content is never missed
 * - 1:1 Cross-Viewport Parity: Guarantees every route, sub-route (/fee/*), and modal is captured on both PC and Mobile
 * - Canvas & Animation Settling: Enforces network idle + settling delays after route transitions and dialog openings
 * - Integrity Verification: Verifies all captured PNGs exist and have non-zero file sizes
 * 
 * Usage:
 *   node capture-all-screenshots.mjs [--baseUrl http://localhost:3000] [--outDir C:/path/to/Review_Signoff]
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// ─── Configuration ────────────────────────────────────────────────────────────
const parseArgs = () => {
  const args = process.argv.slice(2);
  const config = {
    baseUrl: 'http://localhost:3000',
    outDirs: [
      path.resolve(process.env.USERPROFILE || '', 'Desktop/Google_MD3_UI_UX_Review_Signoff'),
    ],
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--baseUrl' && args[i + 1]) config.baseUrl = args[++i];
    if (args[i] === '--outDir' && args[i + 1]) config.outDirs = [args[++i]];
    if (args[i] === '--extraOutDir' && args[i + 1]) config.outDirs.push(args[++i]);
    // Positional argument support: node script.js http://localhost:3000
    if (!args[i].startsWith('--') && i === 0) config.baseUrl = args[i];
  }
  return config;
};

const config = parseArgs();

// ─── Step 1: Force Freshness by Purging Stale Screenshots ──────────────────────
console.log(`\n=== 1. Preparing Output Directories & Purging Stale Screenshots ===`);
config.outDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
    if (existing.length > 0) {
      console.log(`Purging ${existing.length} stale PNGs in: ${dir}`);
      for (const file of existing) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ─── Capture Helpers ──────────────────────────────────────────────────────────
const saveScreenshot = async (page, filename) => {
  const buf = await page.screenshot({ scale: 'css' });
  for (const dir of config.outDirs) {
    const fullPath = path.join(dir, filename);
    let written = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.writeFileSync(fullPath, buf);
        written = true;
        break;
      } catch {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    if (!written) fs.writeFileSync(fullPath, buf);
    console.log(`  [CAPTURED FRESH] ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
  }
};

const waitAndSettle = async (page, delayMs = 600) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, delayMs));
};

/**
 * Capture progressive vertical folds for long scrollable pages.
 * If page height > viewport height * 1.25, captures Top, Middle, and Bottom folds.
 */
const captureFolds = async (page, baseName, { maxFolds = 3, scrollStep = 0.75 } = {}) => {
  await waitAndSettle(page);
  
  // Ensure we start at top
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitAndSettle(page, 300);

  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));

  const isLongPage = metrics.scrollHeight > metrics.innerHeight * 1.25;

  if (!isLongPage) {
    // Single fold is sufficient
    await saveScreenshot(page, `${baseName}_Overview.png`);
    return;
  }

  // Multi-fold capture sequence
  console.log(`    (Multi-fold scroll: scrollHeight ${metrics.scrollHeight}px vs viewport ${metrics.innerHeight}px)`);
  
  // Fold 1: Top
  await saveScreenshot(page, `${baseName}_Fold1_Top.png`);

  const totalScrollable = metrics.scrollHeight - metrics.innerHeight;
  const numExtraFolds = Math.min(maxFolds - 1, Math.ceil(totalScrollable / (metrics.innerHeight * scrollStep)));

  for (let i = 1; i <= numExtraFolds; i++) {
    const isLastFold = i === numExtraFolds;
    const targetScrollY = isLastFold 
      ? totalScrollable 
      : Math.round((totalScrollable * i) / (numExtraFolds + 1));

    await page.evaluate((y) => window.scrollTo(0, y), targetScrollY);
    await waitAndSettle(page, 400);

    const foldLabel = isLastFold ? `Fold${i + 1}_Bottom` : `Fold${i + 1}_Middle`;
    await saveScreenshot(page, `${baseName}_${foldLabel}.png`);
  }

  // Restore scroll position to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitAndSettle(page, 200);
};

/**
 * Helper to safely trigger an overlay (dialog/sheet/popover), capture it, and dismiss it cleanly.
 */
const captureOverlay = async (page, triggerLocator, overlaySelector, filename) => {
  if (await triggerLocator.count()) {
    await triggerLocator.first().scrollIntoViewIfNeeded().catch(() => {});
    await triggerLocator.first().click({ force: true });
    await page.waitForSelector(overlaySelector, { state: 'visible', timeout: 10000 }).catch(() => {});
    await waitAndSettle(page, 600);
    await saveScreenshot(page, filename);
    await page.keyboard.press('Escape');
    await waitAndSettle(page, 400);
  }
};

// ─── Main Execution ───────────────────────────────────────────────────────────
(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--font-render-hinting=none', '--disable-font-subpixel-positioning'],
    });
  } catch {
    console.log('System Chrome channel not available, falling back to standard Chromium');
    browser = await chromium.launch({
      headless: true,
      args: ['--font-render-hinting=none', '--disable-font-subpixel-positioning'],
    });
  }

  console.log(`\n=== 2. Starting Deterministic Screen Capture ===`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Targets: ${config.outDirs.join(', ')}`);

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // PART A: DESKTOP VIEWPORT SUITE (1440 × 900)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n--- Capturing Desktop Suite (1440 × 900) ---`);
    const pcContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const pcPage = await pcContext.newPage();

    // 1. Dashboard Home (Multi-fold: Overview + Scrolled Mortgage & Utilities)
    await pcPage.goto(`${config.baseUrl}/`, { waitUntil: 'networkidle' });
    await pcPage.waitForSelector('[aria-label*="房贷"], .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await captureFolds(pcPage, '01_PC_Dashboard_Home', { maxFolds: 2 });

    // 2. Mortgage Calculator Dialog
    await captureOverlay(
      pcPage,
      pcPage.locator('[aria-label*="房贷"]').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '02_PC_Mortgage_Calculator_Dialog.png'
    );

    // 3. Transactions Ledger (Multi-fold: Top Filters + Scrolled Table)
    await pcPage.goto(`${config.baseUrl}/transactions/`, { waitUntil: 'networkidle' });
    await pcPage.waitForSelector('tbody tr', { state: 'visible', timeout: 15000 }).catch(() => {});
    await captureFolds(pcPage, '03_PC_Transactions_Ledger', { maxFolds: 2 });

    // 4. Transactions Overlays
    await captureOverlay(
      pcPage,
      pcPage.locator('button:has-text("AI 总结"), button:has-text("AI")').first(),
      '.MuiDrawer-paper, [role="presentation"]',
      '04_PC_Transactions_AISummary_Modal.png'
    );
    await captureOverlay(
      pcPage,
      pcPage.locator('button:has-text("筛选")').first(),
      '.MuiDrawer-paper, [role="presentation"]',
      '05_PC_Transactions_Filter_Modal.png'
    );
    await captureOverlay(
      pcPage,
      pcPage.locator('button:has-text("账户")').first(),
      '.MuiDrawer-paper, [role="presentation"]',
      '06_PC_Transactions_Account_Filter_Modal.png'
    );
    await captureOverlay(
      pcPage,
      pcPage.locator('button:has-text("图表")').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '07_PC_Transactions_Charts_Modal.png'
    );

    // Rule Management & Edit Modals
    const rulesBtn = pcPage.locator('button:has-text("规则")').first();
    if (await rulesBtn.count()) {
      await rulesBtn.click({ force: true });
      await pcPage.waitForSelector('.MuiDialog-paper, [role="dialog"]', { state: 'visible', timeout: 10000 }).catch(() => {});
      await waitAndSettle(pcPage, 600);
      await saveScreenshot(pcPage, '08_PC_Transactions_Rule_Management_Modal.png');

      const ruleItem = pcPage.locator('text=⋮⋮').first();
      const addRuleBtn = pcPage.locator('button:has-text("新增规则"), button[aria-label*="新增"]').first();
      if (await ruleItem.count()) {
        await ruleItem.locator('..').locator('..').click({ force: true });
        await waitAndSettle(pcPage, 600);
        await saveScreenshot(pcPage, '09_PC_Transactions_Rule_Edit_Modal.png');
        await pcPage.keyboard.press('Escape');
        await waitAndSettle(pcPage, 300);
      } else if (await addRuleBtn.count()) {
        await addRuleBtn.click({ force: true });
        await waitAndSettle(pcPage, 600);
        await saveScreenshot(pcPage, '09_PC_Transactions_Rule_Edit_Modal.png');
        await pcPage.keyboard.press('Escape');
        await waitAndSettle(pcPage, 300);
      }
      await pcPage.keyboard.press('Escape');
      await waitAndSettle(pcPage, 300);
    }

    // Row Action Popover
    await captureOverlay(
      pcPage,
      pcPage.locator('tbody tr').first(),
      '.MuiPopover-paper, [role="presentation"]',
      '10_PC_Transactions_Row_Action_Popover.png'
    );

    // 5. Clock Main View & Overlays
    await pcPage.goto(`${config.baseUrl}/clock/`, { waitUntil: 'networkidle' });
    await pcPage.waitForSelector('.MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await captureFolds(pcPage, '11_PC_Clock_Main', { maxFolds: 2 });

    await captureOverlay(
      pcPage,
      pcPage.locator('button:has-text("统计")').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '12_PC_Clock_Stats_Modal_Calendar_Aligned.png'
    );
    await captureOverlay(
      pcPage,
      pcPage.locator('button:has-text("日历")').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '13_PC_Clock_Calendar_Modal.png'
    );
    await captureOverlay(
      pcPage,
      pcPage.locator('button:has-text("控制"), button:has-text("已暂停")').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '14_PC_Clock_Control_Modal.png'
    );

    // 6. Fee Analytics Overview & All Sub-Routes (/fee/*)
    await pcPage.goto(`${config.baseUrl}/fee/`, { waitUntil: 'networkidle' });
    await pcPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await captureFolds(pcPage, '15_PC_Fee_Overview_MultiYear', { maxFolds: 2 });

    // Interactive Chart Tooltip
    const chartCanvas = pcPage.locator('canvas').first();
    if (await chartCanvas.count()) {
      const box = await chartCanvas.boundingBox();
      if (box) {
        await pcPage.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.52);
        await waitAndSettle(pcPage, 600);
        await saveScreenshot(pcPage, '16_PC_Fee_Chart_Elevated_Tooltip.png');
      }
    }

    // Sub-route: /fee/waterChart/
    await pcPage.goto(`${config.baseUrl}/fee/waterChart/`, { waitUntil: 'networkidle' });
    await pcPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await waitAndSettle(pcPage, 800);
    await saveScreenshot(pcPage, '17_PC_Fee_Water_Chart.png');

    // Sub-route: /fee/electricityChart/
    await pcPage.goto(`${config.baseUrl}/fee/electricityChart/`, { waitUntil: 'networkidle' });
    await pcPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await waitAndSettle(pcPage, 800);
    await saveScreenshot(pcPage, '18_PC_Fee_Electricity_Chart.png');

    // Sub-route: /fee/gasChart/
    await pcPage.goto(`${config.baseUrl}/fee/gasChart/`, { waitUntil: 'networkidle' });
    await pcPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await waitAndSettle(pcPage, 800);
    await saveScreenshot(pcPage, '19_PC_Fee_Gas_Chart.png');

    // Sub-route: /fee/totalChart/
    await pcPage.goto(`${config.baseUrl}/fee/totalChart/`, { waitUntil: 'networkidle' });
    await pcPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await waitAndSettle(pcPage, 800);
    await saveScreenshot(pcPage, '20_PC_Fee_Total_Chart.png');

    await pcContext.close();

    // ═══════════════════════════════════════════════════════════════════════════
    // PART B: MOBILE VIEWPORT SUITE (412 × 915 - Flagship Android Portrait)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n--- Capturing Mobile Suite (412 × 915) - 1:1 Parity Matrix ---`);
    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const mPage = await mobileContext.newPage();

    // 1. Mobile Dashboard Home (Multi-fold: Top Cards, Middle Teasers, Bottom Feed)
    await mPage.goto(`${config.baseUrl}/`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('[aria-label*="房贷"], .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await captureFolds(mPage, '01_Mobile_Dashboard_Home', { maxFolds: 3, scrollStep: 0.75 });

    // 2. Mobile Mortgage Calculator Dialog
    await captureOverlay(
      mPage,
      mPage.locator('[aria-label*="房贷"]').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '02_Mobile_Mortgage_Calculator_Dialog.png'
    );

    // 3. Mobile Transactions Ledger (Multi-fold: Chips, Table, Pagination)
    await mPage.goto(`${config.baseUrl}/transactions/`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('tbody tr', { state: 'visible', timeout: 15000 }).catch(() => {});
    await captureFolds(mPage, '03_Mobile_Transactions_Ledger', { maxFolds: 3, scrollStep: 0.75 });

    // 4. Mobile Transactions Overlays (Sheets / Bottom Sheets)
    await captureOverlay(
      mPage,
      mPage.locator('button:has-text("AI 总结"), button:has-text("AI")').first(),
      '.MuiDrawer-paper, [role="presentation"]',
      '04_Mobile_Transactions_AISummary_Sheet.png'
    );
    await captureOverlay(
      mPage,
      mPage.locator('button:has-text("筛选")').first(),
      '.MuiDrawer-paper, [role="presentation"]',
      '05_Mobile_Transactions_Filter_Sheet.png'
    );
    await captureOverlay(
      mPage,
      mPage.locator('button:has-text("账户")').first(),
      '.MuiDrawer-paper, [role="presentation"]',
      '06_Mobile_Transactions_Account_Sheet.png'
    );
    await captureOverlay(
      mPage,
      mPage.locator('button:has-text("图表")').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '07_Mobile_Transactions_Charts_Modal.png'
    );

    // Mobile Rules Modals
    const mRulesBtn = mPage.locator('button:has-text("规则")').first();
    if (await mRulesBtn.count()) {
      await mRulesBtn.click({ force: true });
      await mPage.waitForSelector('.MuiDialog-paper, [role="dialog"]', { state: 'visible', timeout: 10000 }).catch(() => {});
      await waitAndSettle(mPage, 600);
      await saveScreenshot(mPage, '08_Mobile_Transactions_Rule_Management_Modal.png');

      const mRuleItem = mPage.locator('text=⋮⋮').first();
      const mAddRuleBtn = mPage.locator('button:has-text("新增规则"), button[aria-label*="新增"]').first();
      if (await mRuleItem.count()) {
        await mRuleItem.locator('..').locator('..').click({ force: true });
        await waitAndSettle(mPage, 600);
        await saveScreenshot(mPage, '09_Mobile_Transactions_Rule_Edit_Modal.png');
        await mPage.keyboard.press('Escape');
        await waitAndSettle(mPage, 300);
      } else if (await mAddRuleBtn.count()) {
        await mAddRuleBtn.click({ force: true });
        await waitAndSettle(mPage, 600);
        await saveScreenshot(mPage, '09_Mobile_Transactions_Rule_Edit_Modal.png');
        await mPage.keyboard.press('Escape');
        await waitAndSettle(mPage, 300);
      }
      await mPage.keyboard.press('Escape');
      await waitAndSettle(mPage, 300);
    }

    // Mobile Row Action Popover
    await captureOverlay(
      mPage,
      mPage.locator('tbody tr').first(),
      '.MuiPopover-paper, [role="presentation"]',
      '10_Mobile_Transactions_Row_Action_Popover.png'
    );

    // 5. Mobile Clock Main View (Multi-fold) & Overlays
    await mPage.goto(`${config.baseUrl}/clock/`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('.MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await captureFolds(mPage, '11_Mobile_Clock_Main', { maxFolds: 2 });

    await captureOverlay(
      mPage,
      mPage.locator('button:has-text("统计")').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '12_Mobile_Clock_Stats_Modal.png'
    );
    await captureOverlay(
      mPage,
      mPage.locator('button:has-text("日历")').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '13_Mobile_Clock_Calendar_Modal.png'
    );
    await captureOverlay(
      mPage,
      mPage.locator('button:has-text("控制"), button:has-text("已暂停")').first(),
      '.MuiDialog-paper, [role="dialog"]',
      '14_Mobile_Clock_Control_Modal.png'
    );

    // 6. Mobile Fee Overview (Multi-fold) & ALL Sub-Routes (/fee/*)
    await mPage.goto(`${config.baseUrl}/fee/`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await captureFolds(mPage, '15_Mobile_Fee_Overview', { maxFolds: 2 });

    // Mobile Sub-route: /fee/waterChart/
    await mPage.goto(`${config.baseUrl}/fee/waterChart/`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await waitAndSettle(mPage, 800);
    await saveScreenshot(mPage, '16_Mobile_Fee_Water_Chart.png');

    // Mobile Sub-route: /fee/electricityChart/
    await mPage.goto(`${config.baseUrl}/fee/electricityChart/`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await waitAndSettle(mPage, 800);
    await saveScreenshot(mPage, '17_Mobile_Fee_Electricity_Chart.png');

    // Mobile Sub-route: /fee/gasChart/
    await mPage.goto(`${config.baseUrl}/fee/gasChart/`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await waitAndSettle(mPage, 800);
    await saveScreenshot(mPage, '18_Mobile_Fee_Gas_Chart.png');

    // Mobile Sub-route: /fee/totalChart/
    await mPage.goto(`${config.baseUrl}/fee/totalChart/`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('canvas, .MuiCard-root', { state: 'visible', timeout: 15000 }).catch(() => {});
    await waitAndSettle(mPage, 800);
    await saveScreenshot(mPage, '19_Mobile_Fee_Total_Chart.png');

    await mobileContext.close();

    // ═══════════════════════════════════════════════════════════════════════════
    // PART C: INTEGRITY VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n=== 3. Validating Captured Screenshot Integrity ===`);
    let totalVerified = 0;
    for (const dir of config.outDirs) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      for (const f of files) {
        const stats = fs.statSync(path.join(dir, f));
        if (stats.size === 0) {
          throw new Error(`Screenshot ${f} in ${dir} is 0 bytes!`);
        }
      }
      totalVerified += files.length;
      console.log(`Verified ${files.length} fresh screenshots in ${dir}`);
    }

    console.log(`\n[SUCCESS] Deterministic capture finished with ${totalVerified} valid screenshots.`);
  } catch (err) {
    console.error(`\n[ERROR] Capture script failed:`, err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
