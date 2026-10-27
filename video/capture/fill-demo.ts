// Fills the modules the seeders leave empty, through the app's own API, so the data is produced by
// the same business logic the UI uses. One storyline: a Sales deal is marked WON → the system
// creates the project → Site Manager adds materials, a document and assigns the engineer →
// the engineer reports progress. Safe to re-run: it reuses the [FUNNEL] project if it exists.
import { randomBytes } from 'node:crypto';
import type { Browser } from 'playwright';
import type { RoleId } from '../src/content/types.ts';
import { api } from './api.ts';
import { query } from './db.ts';

export interface DemoIds {
  funnelId: number;
  projectId: number;
}

const ENGINEER_EMAIL = 'starsszscor@gmail.com';
const OFFICE = { latitude: -6.322155, longitude: 106.675579 }; // work_locations #1, Kantor PT Amsar Prima Mandiri

const MATERIALS = [
  { name: 'Panel nurse call', unit: 'unit', qty_plan: 12 },
  { name: 'Kabel NYM 3x2.5 mm', unit: 'meter', qty_plan: 400 },
  { name: 'Pipa conduit 20 mm', unit: 'batang', qty_plan: 150 },
  { name: 'Bed head unit', unit: 'unit', qty_plan: 12 },
];

function existing(): DemoIds | null {
  const row = query(`select p.id, f.id from projects p join sales_funnels f
      on p.name = concat('[FUNNEL] ', f.customer_company, ' - ', upper(coalesce(f.segment, 'Umum')))
      where p.name like '[FUNNEL]%' and f.status = 'won' order by p.id desc limit 1`).trim();
  if (!row) return null;
  const [projectId, funnelId] = row.split(/\s+/).map(Number);
  return { projectId, funnelId };
}

/** A plainly labelled placeholder image (the API requires a photo; we don't fake a real site photo). */
async function placeholderPhoto(browser: Browser, label: string): Promise<string> {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent(`<body style="margin:0;display:grid;place-items:center;height:100vh;
    background:linear-gradient(135deg,#cbd5e1,#94a3b8);font:600 34px system-ui;color:#1e293b">
    <div style="text-align:center">${label}<div style="font-size:20px;margin-top:12px;opacity:.7">Foto contoh untuk demo</div></div></body>`);
  const jpg = await page.screenshot({ type: 'jpeg', quality: 80 });
  await page.close();
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

async function contractPdf(browser: Browser, projectName: string): Promise<Blob> {
  const page = await browser.newPage();
  await page.setContent(`<body style="font:14px system-ui;padding:48px">
    <h2>Surat Perintah Kerja</h2><p>Proyek: ${projectName}</p>
    <p>Dokumen contoh untuk video demo PT Amsar Dashboard.</p></body>`);
  const pdf = await page.pdf({ format: 'A4' });
  await page.close();
  return new Blob([new Uint8Array(pdf)], { type: 'application/pdf' });
}

/**
 * Does this role's part of the storyline with the role's own token. Called once per role, in
 * ROLES order, right after that role logs in. Returns the ids the capture needs for `:id` routes.
 */
export async function fillForRole(role: RoleId, token: string, browser: Browser, ids: DemoIds | null): Promise<DemoIds | null> {
  const done = existing();
  if (role === 'sales') {
    if (done) return done;
    const list = await api(token, 'GET', '/funnels?status=open&per_page=50');
    const funnels: { id: number; status: string }[] = list.data?.data ?? list.data ?? [];
    const funnel = funnels.find((f) => f.status === 'open');
    if (!funnel) throw new Error('Tidak ada funnel open milik Sales untuk ditandai WON');
    const res = await api(token, 'POST', `/funnels/${funnel.id}/mark-won`, {
      won_reason_category: 'relasi',
      won_notes: 'Customer setuju setelah demo produk dan negosiasi harga.',
      won_date: new Date().toISOString().slice(0, 10),
    });
    return { funnelId: funnel.id, projectId: res.project.id };
  }
  if (!ids) throw new Error(`fillForRole(${role}) butuh hasil langkah Sales`);

  if (role === 'sales_manager') {
    const today = query(`select 1 from attendances a join users u on u.id = a.user_id
        where u.role = 'sales_manager' and a.date = curdate()`).trim();
    if (!today) {
      await api(token, 'POST', '/attendance/check-in', { ...OFFICE, photo: await placeholderPhoto(browser, 'Absen masuk') });
    }
  }
  if (role === 'site_manager' && !query(`select 1 from materials where project_id = ${ids.projectId} limit 1`).trim()) {
    const engineerId = Number(query(`select id from users where email = '${ENGINEER_EMAIL}'`).trim());
    await api(token, 'POST', `/projects/${ids.projectId}/assign-engineer`, { engineer_id: engineerId });
    for (const m of MATERIALS) await api(token, 'POST', '/materials', { project_id: ids.projectId, ...m });
    const form = new FormData();
    form.append('project_id', String(ids.projectId));
    form.append('type', 'Kontrak');
    form.append('file', await contractPdf(browser, `Proyek #${ids.projectId}`), 'Surat Perintah Kerja.pdf');
    await api(token, 'POST', '/documents', form);
  }
  if (role === 'engineer' && !query(`select 1 from engineer_progress_reports where project_id = ${ids.projectId} limit 1`).trim()) {
    const materials = query(`select id from materials where project_id = ${ids.projectId} order by id`).trim().split(/\r?\n/).map(Number);
    await api(token, 'POST', '/engineer/progress-reports', {
      project_id: ids.projectId,
      progress_percentage: 15,
      notes: 'Instalasi jalur kabel lantai 1 dan pemasangan panel nurse call tahap awal.',
      photo: await placeholderPhoto(browser, 'Progres instalasi'),
      plan_updates: [
        { name: 'Instalasi jalur kabel', items: [{ material_id: materials[1], qty_terpasang: 120 }, { material_id: materials[2], qty_terpasang: 40 }] },
        { name: 'Pemasangan panel', items: [{ material_id: materials[0], qty_terpasang: 2 }] },
      ],
    });
  }
  if (role === 'administrator' && !query(`select 1 from users where status = 'pending' limit 1`).trim()) {
    await api(null, 'POST', '/auth/register', {
      name: 'Fajar Nugroho',
      email: 'fajar.nugroho@example.co.id',
      password: randomBytes(12).toString('base64url'),
      role: 'engineer',
    });
  }
  return ids;
}
