// Logs in to the running app as each role, fills that role's part of the demo storyline, and
// screenshots every shot in src/content/roles.ts. Writes public/screens/<role>/<shot>.png and
// public/screens/manifest.json. Needs the backend (:8000) and frontend (:5173) running.
//
//   node capture/capture.ts             → capture, fail on any problem
//   node capture/capture.ts --explore   → also dump each page's headings/buttons to EXPLORE_DIR,
//                                         and don't fail on highlight locators that don't resolve
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { ROLES } from '../src/content/roles.ts';
import type { RoleId } from '../src/content/types.ts';
import { api } from './api.ts';
import { fillForRole, type DemoIds } from './fill-demo.ts';
import { assertNotLoginPage, clipToViewport, validateManifest, VIEWPORT, type Box, type Manifest } from './manifest.ts';
import { ACCOUNTS, withTemporaryPasswords } from './passwords.ts';

const APP = 'http://localhost:5173';
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCREENS = join(ROOT, 'public', 'screens');
const explore = process.argv.includes('--explore');
const EXPLORE_DIR = process.env.EXPLORE_DIR ?? join(ROOT, 'out', 'explore');

async function login(page: Page, role: RoleId, password: string): Promise<string> {
  const email = ACCOUNTS.find((a) => a.role === role)!.email;
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto(`${APP}/login`);
    await page.fill('input[type=email]', email);
    await page.fill('input[type=password]', password);
    await page.click('button[type=submit]');
    try {
      await page.waitForURL((u) => u.pathname !== '/login', { timeout: 15000 });
      break;
    } catch {
      // /api/auth/login allows 5 attempts per minute; wait it out once before giving up.
      if (attempt === 2) break;
      console.log(`  login ${role} tertahan, tunggu 61 detik…`);
      await page.waitForTimeout(61000);
    }
  }
  assertNotLoginPage(page.url(), role);
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('amsar-auth') ?? '{}').state?.token);
  if (!token) throw new Error(`Token tidak ditemukan setelah login ${role}`);
  return token;
}

function resolveRoute(route: string, role: RoleId, shotId: string, ids: DemoIds | null): string {
  if (!route.includes(':id')) return route;
  const id = role === 'sales' ? ids?.funnelId : ids?.projectId;
  if (!id) throw new Error(`Tidak ada id untuk ${role}/${shotId}`);
  return route.replace(':id', String(id));
}

async function dumpPage(page: Page, file: string): Promise<void> {
  const info = await page.evaluate(() => {
    const texts = (sel: string) =>
      [...document.querySelectorAll(sel)].map((e) => (e as HTMLElement).innerText.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 40);
    return { url: location.pathname, headings: texts('h1,h2,h3'), buttons: texts('button,a[role=button]'), th: texts('th'), tabs: texts('[role=tab]') };
  });
  writeFileSync(file, JSON.stringify(info, null, 2));
}

async function main(): Promise<void> {
  mkdirSync(SCREENS, { recursive: true });
  if (explore) mkdirSync(EXPLORE_DIR, { recursive: true });
  const manifest = {} as Manifest;
  const browser = await chromium.launch();
  try {
    await withTemporaryPasswords(async (password) => {
      let ids: DemoIds | null = null;
      for (const role of ROLES) {
        console.log(`[${role.number}] ${role.name}`);
        const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'id-ID' });
        const page = await context.newPage();
        const token = await login(page, role.id, password);
        try {
          ids = await fillForRole(role.id, token, browser, ids);
          manifest[role.id] = {};
          mkdirSync(join(SCREENS, role.id), { recursive: true });
          for (const shot of role.shots) {
            const path = resolveRoute(shot.route, role.id, shot.id, ids);
            await page.goto(`${APP}${path}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(800);
            assertNotLoginPage(page.url(), role.id);
            if (new URL(page.url()).pathname !== path) throw new Error(`${role.id}/${shot.id}: dialihkan ke ${page.url()}`);
            const errorToast = page.locator('[role=status]').filter({ hasText: /gagal|error/i });
            if (await errorToast.count()) throw new Error(`${role.id}/${shot.id}: ${await errorToast.first().innerText()}`);

            let box: Box | null = null;
            const target = page.locator(shot.highlight).first();
            if (await target.isVisible().catch(() => false)) {
              const raw = await target.boundingBox();
              box = raw && clipToViewport(raw);
            }
            if (!box && !explore) throw new Error(`${role.id}/${shot.id}: highlight "${shot.highlight}" tidak terlihat`);

            const file = `screens/${role.id}/${shot.id}.png`;
            await page.screenshot({ path: join(ROOT, 'public', file) });
            manifest[role.id][shot.id] = { file, box: box ?? { x: 0, y: 0, width: 0, height: 0 } };
            if (explore) await dumpPage(page, join(EXPLORE_DIR, `${role.id}--${shot.id}.json`));
            console.log(`  ✓ ${shot.id}${box ? '' : ' (highlight belum ketemu)'}`);
          }
        } finally {
          await api(token, 'POST', '/auth/logout').catch(() => {});
          await context.close();
        }
      }
    });
    console.log('Password asli sudah dikembalikan dan diverifikasi.');
  } finally {
    await browser.close();
  }

  writeFileSync(join(SCREENS, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const problems = validateManifest(manifest, ROLES);
  if (problems.length && !explore) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`Selesai: ${Object.values(manifest).reduce((n, r) => n + Object.keys(r).length, 0)} screenshot.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
