// Smoke test of the running app: logs in as each of the five roles and opens every page in that
// role's sidebar (plus profile, notifications and detail pages). Reports JavaScript errors,
// console errors, API responses with status 403 / 5xx, and unexpected redirects.
// Needs the backend (:8000) and frontend (:5173) running.   Run: npm run smoke
import { chromium, type Page } from 'playwright';
import type { RoleId } from '../src/content/types.ts';
import { api } from './api.ts';
import { query } from './db.ts';
import { assertNotLoginPage, VIEWPORT } from './manifest.ts';
import { withTemporaryPasswords } from './passwords.ts';
import { APP, login } from './session.ts';

const projectId = query(`select id from projects where name like '[FUNNEL]%' order by id desc limit 1`).trim()
  || query('select id from projects order by id limit 1').trim();
// Funnels are only visible to their own salesperson (and managers), so use ones owned by the Sales account.
const salesId = query(`select id from users where email = 'ramaatteriza17@gmail.com'`).trim();
const funnelId = query(`select id from sales_funnels where status = 'won' and assigned_to = ${salesId} order by id desc limit 1`).trim();
const openFunnelId = query(`select id from sales_funnels where status = 'open' and assigned_to = ${salesId} order by id limit 1`).trim();

// Routes per role, from frontend/src/components/layout/Sidebar.jsx and App.jsx.
const ROUTES: Record<RoleId, string[]> = {
  sales: ['/sales/dashboard', '/customers', '/plan-visits', '/realisasi-visits', '/visit-reports', '/funnels',
    '/funnels/create', `/funnels/${funnelId}`, '/attendance', '/create-unplanned-visit', '/notifications', '/profile'],
  sales_manager: ['/manager/dashboard', '/customers', '/plan-visits', '/realisasi-visits', '/visit-reports', '/warnings',
    '/funnels', `/funnels/${funnelId}`, '/attendance', '/notifications', '/profile'],
  site_manager: ['/site/dashboard', '/projects', `/projects/${projectId}`, '/documents', '/reports', '/notifications', '/profile'],
  engineer: ['/engineer/dashboard', '/engineer/projects', `/engineer/projects/${projectId}`, '/engineer/progress-reports',
    '/notifications', '/profile'],
  administrator: ['/dashboard', '/projects', `/projects/${projectId}`, '/documents', '/reports', '/customers', '/plan-visits',
    '/realisasi-visits', '/visit-reports', '/warnings', '/funnels', `/funnels/${funnelId}`, '/users',
    '/admin/attendance-monitor', '/activity', '/notifications', '/profile'],
};

interface Problem { role: RoleId; route: string; kind: string; detail: string }

async function visit(page: Page, role: RoleId, route: string, problems: Problem[]): Promise<void> {
  const seen: Problem[] = [];
  const onError = (e: Error) => seen.push({ role, route, kind: 'js-error', detail: e.message });
  const onConsole = (m: { type(): string; text(): string }) => {
    if (m.type() === 'error') seen.push({ role, route, kind: 'console', detail: m.text().slice(0, 200) });
  };
  const onResponse = (r: { url(): string; status(): number; request(): { method(): string } }) => {
    if (r.url().includes('/api/') && (r.status() === 403 || r.status() >= 500)) {
      seen.push({ role, route, kind: `api-${r.status()}`, detail: `${r.request().method()} ${r.url().replace(/^.*\/api/, '/api')}` });
    }
  };
  page.on('pageerror', onError);
  page.on('console', onConsole);
  page.on('response', onResponse);
  try {
    await page.goto(`${APP}${route}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    assertNotLoginPage(page.url(), role);
    const path = new URL(page.url()).pathname;
    if (path !== route) seen.push({ role, route, kind: 'redirect', detail: `→ ${path}` });
  } catch (e) {
    seen.push({ role, route, kind: 'navigation', detail: e instanceof Error ? e.message : String(e) });
  } finally {
    page.off('pageerror', onError);
    page.off('console', onConsole);
    page.off('response', onResponse);
  }
  problems.push(...seen);
  console.log(`  ${seen.length ? '✗' : '✓'} ${route}${seen.length ? `  (${seen.length} masalah)` : ''}`);
}

/** The "Tandai Menang" dialog must offer the active site managers (it does not submit). */
async function checkWonDialog(page: Page, problems: Problem[]): Promise<void> {
  const route = `/funnels/${openFunnelId}`;
  await visit(page, 'sales', route, problems);
  await page.getByRole('button', { name: 'Menang', exact: true }).click();
  const select = page.locator('select').filter({ has: page.locator('option', { hasText: 'Pilih Site Manager' }) });
  await page.waitForTimeout(800);
  const options = await select.locator('option').count();
  if (options < 2) problems.push({ role: 'sales', route, kind: 'won-dialog', detail: `pilihan Site Manager kosong (${options} option)` });
  console.log(`  ${options >= 2 ? '✓' : '✗'} dialog Tandai Menang: ${options - 1} Site Manager`);
}

async function main(): Promise<void> {
  const problems: Problem[] = [];
  let pages = 0;
  const browser = await chromium.launch();
  try {
    await withTemporaryPasswords(async (password) => {
      for (const role of Object.keys(ROUTES) as RoleId[]) {
        console.log(`[${role}]`);
        const context = await browser.newContext({ viewport: VIEWPORT, locale: 'id-ID' });
        const page = await context.newPage();
        const token = await login(page, role, password);
        try {
          for (const route of ROUTES[role]) {
            await visit(page, role, route, problems);
            pages++;
          }
          if (role === 'sales') await checkWonDialog(page, problems);
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

  console.log(`\n${pages} halaman dibuka, ${problems.length} masalah.`);
  for (const p of problems) console.log(`- [${p.role}] ${p.route} ${p.kind}: ${p.detail}`);
  if (problems.length) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
