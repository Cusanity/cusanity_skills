import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const MOBILE_VIEWPORT = Object.freeze({ id: 'Mobile', width: 440, height: 956 });

const parseArgs = () => {
  const values = {
    baseUrl: 'http://localhost:3000',
    plan: 'capture-plan.json',
    outDir: 'review',
    captureId: null,
  };

  for (let index = 2; index < process.argv.length; index += 1) {
    const flag = process.argv[index];
    if (!flag.startsWith('--') || !process.argv[index + 1]) continue;
    const key = flag.slice(2);
    if (key in values) values[key] = process.argv[++index];
  }

  values.captureId ||= `capture-${Date.now()}-${process.pid}`;
  return values;
};

const args = parseArgs();
const startedAtMs = Date.now();
const outputDir = path.resolve(args.outDir);
const manifestPath = path.join(outputDir, 'screenshot-capture-manifest.json');
const artifacts = [];
const captures = [];

const portablePath = (value) => value.split(path.sep).join('/');

const collectSourceFiles = (planDir, roots) => {
  const files = new Set();

  const visit = (absolutePath) => {
    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      for (const child of fs.readdirSync(absolutePath).sort()) {
        visit(path.join(absolutePath, child));
      }
      return;
    }
    if (stats.isFile()) files.add(portablePath(path.relative(planDir, absolutePath)));
  };

  for (const root of roots) {
    const absoluteRoot = path.resolve(planDir, root);
    const relativeRoot = path.relative(planDir, absoluteRoot);
    if (relativeRoot.startsWith('..') || path.isAbsolute(relativeRoot)) {
      throw new Error(`Source root escapes the plan directory: ${root}`);
    }
    if (!fs.existsSync(absoluteRoot)) throw new Error(`Source root not found: ${root}`);
    visit(absoluteRoot);
  }

  return [...files].sort();
};

const validateSourceReview = (plan, planPath) => {
  const review = plan.sourceReview;
  if (!review || !Array.isArray(review.roots) || review.roots.length === 0) {
    throw new Error('Capture plan requires sourceReview.roots');
  }
  if (!Array.isArray(review.files) || review.files.length === 0) {
    throw new Error('Capture plan requires sourceReview.files');
  }

  const planDir = path.dirname(planPath);
  if (review.roots.some((root) => typeof root !== 'string' || !root.trim())) {
    throw new Error('sourceReview.roots requires non-empty paths');
  }
  const discoveredFiles = collectSourceFiles(planDir, review.roots);
  const reviewedFiles = new Map();
  for (const entry of review.files) {
    const normalizedPath = typeof entry?.path === 'string' ? portablePath(entry.path) : null;
    if (
      !entry
      || !normalizedPath
      || !/^[a-f0-9]{64}$/i.test(entry.sha256 ?? '')
      || reviewedFiles.has(normalizedPath)
    ) {
      throw new Error('Each reviewed source file requires a unique path and SHA-256 hash');
    }
    reviewedFiles.set(normalizedPath, entry.sha256.toLowerCase());
  }

  const missingReviews = discoveredFiles.filter((file) => !reviewedFiles.has(file));
  const staleReviews = [...reviewedFiles.keys()].filter((file) => !discoveredFiles.includes(file));
  if (missingReviews.length || staleReviews.length) {
    throw new Error(`Source review is incomplete or stale. Missing: ${missingReviews.join(', ') || 'none'}; stale: ${staleReviews.join(', ') || 'none'}`);
  }

  for (const file of discoveredFiles) {
    const contents = fs.readFileSync(path.resolve(planDir, file));
    const actualHash = createHash('sha256').update(contents).digest('hex');
    if (actualHash !== reviewedFiles.get(file)) {
      throw new Error(`Source changed after review: ${file}`);
    }
  }

  return { roots: review.roots, files: discoveredFiles.map((file) => ({ path: file, sha256: reviewedFiles.get(file) })) };
};

const readPlan = () => {
  const planPath = path.resolve(args.plan);
  if (!fs.existsSync(planPath)) throw new Error(`Capture plan not found: ${planPath}`);

  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const sourceReview = validateSourceReview(plan, planPath);
  if (!Array.isArray(plan.viewports) || plan.viewports.length === 0) {
    throw new Error('Capture plan requires a non-empty viewports array');
  }
  if (!Array.isArray(plan.views) || plan.views.length === 0) {
    throw new Error('Capture plan requires a non-empty views array');
  }

  if (plan.viewports.some((viewport) => viewport.id?.toLowerCase() === 'mobile')) {
    throw new Error('Do not configure Mobile in the plan; the runner hardcodes Mobile at 440x956');
  }
  plan.viewports.push(MOBILE_VIEWPORT);

  const viewportIds = new Set();
  for (const viewport of plan.viewports) {
    if (
      !viewport.id
      || !Number.isInteger(viewport.width)
      || !Number.isInteger(viewport.height)
      || viewport.width <= 0
      || viewport.height <= 0
    ) {
      throw new Error('Each viewport requires id, positive integer width, and positive integer height');
    }
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(viewport.id)) {
      throw new Error(`Viewport id is not filesystem-safe: ${viewport.id}`);
    }
    if (viewportIds.has(viewport.id)) throw new Error(`Duplicate viewport id: ${viewport.id}`);
    viewportIds.add(viewport.id);
  }

  if (!Array.isArray(plan.coverageInventory) || plan.coverageInventory.length === 0) {
    throw new Error('Capture plan requires a non-empty coverageInventory');
  }
  const coverageEntries = plan.coverageInventory.map((entry) => (
    typeof entry === 'string' ? { id: entry } : entry
  ));
  const coverageIds = new Set(coverageEntries.map((entry) => entry?.id));
  if (
    coverageIds.size !== coverageEntries.length
    || coverageEntries.some((entry) => !entry || typeof entry.id !== 'string' || !entry.id.trim())
  ) {
    throw new Error('coverageInventory requires unique, non-empty IDs');
  }
  for (const entry of coverageEntries) {
    if (entry.viewports) {
      if (!Array.isArray(entry.viewports) || entry.viewports.length === 0) {
        throw new Error(`Coverage ${entry.id} has invalid viewport applicability`);
      }
      const applicableIds = new Set(entry.viewports);
      if (applicableIds.size !== entry.viewports.length || entry.viewports.some((id) => !viewportIds.has(id))) {
        throw new Error(`Coverage ${entry.id} has invalid viewport applicability`);
      }
      if (entry.viewports.length < viewportIds.size && (typeof entry.reason !== 'string' || !entry.reason.trim())) {
        throw new Error(`Coverage ${entry.id} requires a reason for limited viewport applicability`);
      }
    }
  }
  plan.coverageInventory = coverageEntries;

  const viewIds = new Set();
  const validActionTypes = new Set(['click', 'hover', 'focus']);
  for (const view of plan.views) {
    if (!view.id || typeof view.path !== 'string') {
      throw new Error('Each view requires id and path');
    }
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(view.id)) {
      throw new Error(`View id is not filesystem-safe: ${view.id}`);
    }
    if (viewIds.has(view.id)) throw new Error(`Duplicate view id: ${view.id}`);
    viewIds.add(view.id);
    if (!Array.isArray(view.covers) || view.covers.length === 0) {
      throw new Error(`View ${view.id} requires a non-empty covers array`);
    }
    if (view.covers.some((id) => !coverageIds.has(id))) {
      throw new Error(`View ${view.id} references an unknown coverage ID`);
    }
    if (view.only) {
      if (!Array.isArray(view.only) || view.only.length === 0) {
        throw new Error(`View ${view.id} only must be a non-empty array`);
      }
      if (view.only.some((id) => !viewportIds.has(id))) {
        throw new Error(`View ${view.id} references an unknown viewport in only`);
      }
    }
    if (view.folds !== undefined && (!Number.isInteger(view.folds) || view.folds < 1 || view.folds > 10)) {
      throw new Error(`View ${view.id} folds must be an integer from 1 to 10`);
    }
    if (view.waitFor !== undefined && (typeof view.waitFor !== 'string' || !view.waitFor.trim())) {
      throw new Error(`View ${view.id} waitFor must be a non-empty selector`);
    }
    if (view.action) {
      if (
        !validActionTypes.has(view.action.type)
        || typeof view.action.selector !== 'string'
        || !view.action.selector.trim()
      ) {
        throw new Error(`View ${view.id} has an invalid action`);
      }
    }
    const hasRequiredApi = Array.isArray(view.requiredApi) && view.requiredApi.length > 0;
    const hasDataIndependentReason = typeof view.dataIndependentReason === 'string' && view.dataIndependentReason.trim();
    if (hasRequiredApi === Boolean(hasDataIndependentReason)) {
      throw new Error(`View ${view.id} requires either requiredApi or dataIndependentReason, but not both`);
    }
    if (hasRequiredApi) {
      for (const pattern of view.requiredApi) {
        if (typeof pattern !== 'string' || !pattern.trim()) throw new Error(`View ${view.id} has an invalid requiredApi pattern`);
        if (['.*', '^.*$', '.+', '^.+$'].includes(pattern.replaceAll(' ', ''))) {
          throw new Error(`View ${view.id} requiredApi pattern is too broad: ${pattern}`);
        }
        try {
          new RegExp(pattern);
        } catch {
          throw new Error(`View ${view.id} has an invalid requiredApi regex: ${pattern}`);
        }
      }
    }
  }

  for (const entry of coverageEntries) {
    const applicableViewports = entry.viewports ?? [...viewportIds];
    for (const viewportId of applicableViewports) {
      const covered = plan.views.some((view) => (
        view.covers.includes(entry.id)
        && (!view.only || view.only.includes(viewportId))
      ));
      if (!covered) throw new Error(`Coverage ${entry.id} is missing for viewport ${viewportId}`);
    }
  }

  return { plan, planPath, sourceReview };
};

const prepareOutput = () => {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const filename of fs.readdirSync(outputDir)) {
    if (filename.toLowerCase().endsWith('.png')) fs.unlinkSync(path.join(outputDir, filename));
  }
  if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
};

const safeId = (value) => value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '');

const redactUrl = (value) => {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
};

const settle = async (page, delayMs = 500) => {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(delayMs);
};

const runAction = async (page, action) => {
  if (!action) return;
  const target = page.locator(action.selector).first();
  await target.waitFor({ state: 'visible', timeout: 10000 });
  await target.scrollIntoViewIfNeeded();

  if (action.type === 'click') await target.click();
  else if (action.type === 'hover') await target.hover();
  else if (action.type === 'focus') await target.focus();
  else throw new Error(`Unsupported action type: ${action.type}`);
};

const saveScreenshot = async (page, metadata) => {
  const filename = `${metadata.baseName}_${metadata.label}.png`;
  const filePath = path.join(outputDir, filename);
  await page.screenshot({ path: filePath, scale: 'css' });

  const stats = fs.statSync(filePath);
  if (stats.size === 0 || stats.mtimeMs < startedAtMs - 1000) {
    throw new Error(`Invalid screenshot artifact: ${filename}`);
  }

  artifacts.push({
    file: filename,
    bytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
    viewId: metadata.viewId,
    viewportId: metadata.viewportId,
    fold: metadata.label,
    scrollY: metadata.scrollY,
  });
};

const captureView = async (page, view, viewportId, sequence) => {
  const url = new URL(view.path, args.baseUrl).toString();
  const responses = [];
  const recordResponse = (response) => {
    const resourceType = response.request().resourceType();
    if (resourceType === 'fetch' || resourceType === 'xhr') {
      responses.push({ url: response.url(), status: response.status(), ok: response.ok() });
    }
  };
  page.on('response', recordResponse);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await runAction(page, view.action);
    if (view.waitFor) {
      await page.locator(view.waitFor).first().waitFor({
        state: 'visible',
        timeout: 15000,
      });
    }
    await settle(page);
  } finally {
    page.off('response', recordResponse);
  }

  const successfulResponses = responses.filter((response) => response.ok);
  const matchedResponses = [];
  for (const pattern of view.requiredApi ?? []) {
    const matcher = new RegExp(pattern);
    const matches = successfulResponses.filter((response) => matcher.test(response.url));
    if (matches.length === 0) {
      throw new Error(`View ${view.id} did not receive a successful real API response matching: ${pattern}`);
    }
    matchedResponses.push(...matches);
  }
  const dataEvidence = view.requiredApi
    ? {
        mode: 'real-api',
        requiredPatterns: view.requiredApi,
        responses: [...new Map(matchedResponses.map((response) => [
          `${response.status}:${redactUrl(response.url)}`,
          { url: redactUrl(response.url), status: response.status },
        ])).values()],
      }
    : { mode: 'source-verified-data-independent', reason: view.dataIndependentReason };

  const baseName = `${String(sequence).padStart(2, '0')}_${safeId(viewportId)}_${safeId(view.id)}`;
  const metrics = await page.evaluate(() => ({
    height: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  const isLong = metrics.scrollHeight > metrics.height * 1.2;
  const requestedFolds = Math.max(1, Math.min(view.folds ?? 3, 10));

  if (!isLong || requestedFolds === 1) {
    await saveScreenshot(page, {
      baseName,
      label: 'Overview',
      scrollY: 0,
      viewId: view.id,
      viewportId,
    });
    captures.push({ viewId: view.id, viewportId, covers: view.covers, dataEvidence });
    return;
  }

  const totalScroll = metrics.scrollHeight - metrics.height;
  const positions = Array.from({ length: requestedFolds }, (_, index) => (
    Math.round((totalScroll * index) / (requestedFolds - 1))
  ));

  for (let index = 0; index < positions.length; index += 1) {
    const scrollY = positions[index];
    await page.evaluate((position) => window.scrollTo(0, position), scrollY);
    await page.waitForTimeout(300);

    const label = index === 0
      ? 'Fold1_Top'
      : index === positions.length - 1
        ? `Fold${index + 1}_Bottom`
        : `Fold${index + 1}_Middle`;
    await saveScreenshot(page, { baseName, label, scrollY, viewId: view.id, viewportId });
  }
  captures.push({ viewId: view.id, viewportId, covers: view.covers, dataEvidence });
};

const validateRuntimeCoverage = (plan) => {
  for (const entry of plan.coverageInventory) {
    const applicableViewports = entry.viewports ?? plan.viewports.map(({ id }) => id);
    for (const viewportId of applicableViewports) {
      if (!captures.some((capture) => capture.viewportId === viewportId && capture.covers.includes(entry.id))) {
        throw new Error(`Captured evidence is missing coverage ${entry.id} for viewport ${viewportId}`);
      }
    }
  }
};

const writeManifest = (planPath, plan, sourceReview) => {
  const completedAt = new Date();
  for (const artifact of artifacts) {
    const stats = fs.statSync(path.join(outputDir, artifact.file));
    if (stats.size === 0 || stats.mtimeMs < startedAtMs - 1000 || stats.mtimeMs > completedAt.getTime() + 1000) {
      throw new Error(`Artifact failed final integrity validation: ${artifact.file}`);
    }
  }
  const manifest = {
    schemaVersion: 1,
    captureRunId: args.captureId,
    baseUrl: args.baseUrl,
    planPath,
    captureStartedAt: new Date(startedAtMs).toISOString(),
    captureCompletedAt: completedAt.toISOString(),
    sourceReview,
    coverage: {
      inventory: plan.coverageInventory,
      covered: plan.coverageInventory.length,
      total: plan.coverageInventory.length,
      percent: 100,
    },
    plannedViewports: plan.viewports.map(({ id, width, height }) => ({ id, width, height })),
    plannedViews: plan.views.map(({ id, covers, only }) => ({ id, covers, only: only ?? null })),
    captures,
    screenshotCount: artifacts.length,
    files: artifacts,
  };

  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(temporaryPath, manifestPath);
};

const main = async () => {
  const { plan, planPath } = readPlan();
  prepareOutput();

  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of plan.viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
      });

      let sequence = 1;
      for (const view of plan.views) {
        if (!view.only || view.only.includes(viewport.id)) {
          const page = await context.newPage();
          try {
            await captureView(page, view, viewport.id, sequence);
          } finally {
            await page.close();
          }
        }
        sequence += 1;
      }
      await context.close();
    }

    validateRuntimeCoverage(plan);
    const currentSourceReview = validateSourceReview(plan, planPath);
    writeManifest(planPath, plan, currentSourceReview);
    console.log(`Captured ${artifacts.length} screenshots to ${outputDir}`);
    console.log(`Manifest: ${manifestPath}`);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
