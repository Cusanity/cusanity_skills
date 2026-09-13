/**
 * Reusable Deterministic Screenshot Capture Script (capture-all-screenshots.mjs)
 * 
 * Captures fresh, deterministic Desktop (1440x900) and Mobile (412x915) screenshots using Playwright.
 * Key Capabilities:
 * - Forces Freshness: Automatically purges stale screenshots in the destination directory before running
 * - Cache-Free Execution: Uses a clean browser context with no persisted cache/storage
 * - High-DPI Fidelity: Always uses `scale: 'css'` to eliminate font measurement timeouts and blur
 * - Animation Settling: Enforces network idle + settling delays after modal triggers and page changes
 * - Integrity Verification: Verifies all captured PNGs exist and have non-zero file sizes
 * 
 * Usage:
 *   node capture-all-screenshots.mjs [--baseUrl http://localhost:3000] [--outDir C:/Users/.../Desktop/Review_Signoff]
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
      path.resolve(process.env.USERPROFILE || '', 'Desktop/UI_UX_Review_Signoff'),
    ],
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--baseUrl' && args[i + 1]) config.baseUrl = args[++i];
    if (args[i] === '--outDir' && args[i + 1]) config.outDirs = [args[++i]];
    if (args[i] === '--extraOutDir' && args[i + 1]) config.outDirs.push(args[++i]);
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

const saveScreenshot = async (page, filename) => {
  const buf = await page.screenshot({ scale: 'css' });
  for (const dir of config.outDirs) {
    const fullPath = path.join(dir, filename);
    fs.writeFileSync(fullPath, buf);
    console.log(`  [CAPTURED FRESH] ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
  }
};

const waitAndSettle = async (page, delayMs = 400) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, delayMs));
};

// ─── Main Execution ───────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Clean, isolated browser context to prevent stale session data
  const context = await browser.newContext({
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log(`\n=== 2. Starting Deterministic Screen Capture ===`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Targets: ${config.outDirs.join(', ')}`);

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // PART A: DESKTOP VIEWPORT (1440 × 900)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n--- Capturing Desktop Suite (1440x900) ---`);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Home / Dashboard
    await page.goto(`${config.baseUrl}/`, { waitUntil: 'networkidle' });
    await waitAndSettle(page);
    await saveScreenshot(page, '01_PC_Home_Dashboard.png');

    // Example Modal / Dialog interaction:
    // const filterBtn = page.locator('button:has-text("Filter")').first();
    // if (await filterBtn.isVisible()) {
    //   await filterBtn.click();
    //   await waitAndSettle(page);
    //   await saveScreenshot(page, '02_PC_Filter_Modal.png');
    //   await page.keyboard.press('Escape');
    //   await waitAndSettle(page);
    // }

    // ═══════════════════════════════════════════════════════════════════════════
    // PART B: MOBILE VIEWPORT (412 × 915 - Modern Flagship Portrait)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n--- Capturing Mobile Suite (412x915) ---`);
    await page.setViewportSize({ width: 412, height: 915 });

    // Mobile Home
    await page.goto(`${config.baseUrl}/`, { waitUntil: 'networkidle' });
    await waitAndSettle(page);
    await saveScreenshot(page, '01_Mobile_Home_Dashboard.png');

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
