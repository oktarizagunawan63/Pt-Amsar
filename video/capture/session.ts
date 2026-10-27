import type { Page } from 'playwright';
import type { RoleId } from '../src/content/types.ts';
import { assertNotLoginPage } from './manifest.ts';
import { ACCOUNTS } from './passwords.ts';

export const APP = 'http://localhost:5173';

/** Logs in through the real login form and returns the API token the app stored. */
export async function login(page: Page, role: RoleId, password: string): Promise<string> {
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
      // /api/auth/login allows 5 attempts per minute per account; wait it out once before giving up.
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
