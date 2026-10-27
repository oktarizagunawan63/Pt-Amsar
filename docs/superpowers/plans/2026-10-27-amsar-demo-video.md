# Video Demo PT Amsar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render `video/out/amsar-demo.mp4`, a ±5-minute demo of all five roles built from real screenshots of the running app.

**Architecture:** A standalone Remotion project in `video/`. A Playwright script logs in as each existing account (passwords swapped temporarily and restored), screenshots each page and records highlight bounding boxes in `manifest.json`. Remotion scenes read only `src/content/roles.ts` (copy, colors, shot order) and the manifest.

**Tech Stack:** Node 22 (built-in `node --test` with type stripping), TypeScript, Remotion 4 (`remotion`, `@remotion/cli`, `@remotion/google-fonts`), Playwright (Chromium), MySQL 8.4 CLI and PHP 8.3 from Laragon.

**Spec:** `docs/superpowers/specs/2026-10-27-amsar-demo-video-design.md`

## Global Constraints

- Output 1920×1080, 30 fps, H.264 MP4 at `video/out/amsar-demo.mp4`, total length 300 s ± 15 s.
- All on-screen text in Bahasa Indonesia. Every caption must be traceable to spec §5 or to a visible element on the captured page; nothing invented.
- Role order and colors are fixed: Sales `#2563EB`, Sales Manager `#7C3AED`, Site Manager `#EA580C`, Engineer `#0D9488`, Administrator `#15803D`.
- Scene durations (s): Intro 10, BigFlowchart 30, Sales 55, Sales Manager 50, Site Manager 45, Engineer 40, Administrator 50, Outro (matrix + closing) 20.
- Chapter anatomy (s): silence 0.5 → wipe 1 → chapter card 4 → mini flowchart 6 → screenshots (remaining time split evenly) → recap 2.
- Music only if `video/public/music.mp3` exists; otherwise render silent.
- No changes to `frontend/` or `backend/` source. Dependencies only inside `video/`.
- Temporary passwords are generated at runtime, kept in memory only, never printed, logged or written to disk.
- Original password hashes are always restored (`finally`), and restoration is verified byte-for-byte.
- Pure modules (`video/src/lib/*.ts`, `video/src/content/*.ts`, `video/capture/manifest.ts`) import other local files only with `import type`, so `node --test` can load them directly.
- DB/PHP binaries: `C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe`, `.../mysqldump.exe`, `C:/laragon/bin/php/php-8.3.26-Win32-vs16-x64/php.exe`; DB `amsar_dashboard`, user `root`, empty password.
- App URLs: frontend `http://localhost:5173`, API `http://127.0.0.1:8000/api`. Login form: `input[type=email]`, `input[type=password]`, `button[type=submit]`. Logout: `POST /api/auth/logout`. Auth token in `localStorage['amsar-auth']` → `state.token`.
- Work on branch `feat/demo-video`; commit after each task.

## Review Focus

1. **Login silently fails for a role** (wrong password swap, inactive account) → the capture must stop with a clear error naming the role, not save five screenshots of the login page. Pinned in Task 4 (`assertNotLoginPage`).
2. **A page renders empty because the seeded data doesn't cover it** (engineer progress reports, documents, pending approvals) → reported to the user at the Task 2 checkpoint before any capture, not discovered in the final video.
3. **Capture crashes mid-run** → original password hashes are still restored. Pinned in Task 3 (`withTemporaryPasswords` restores when the callback throws).
4. **A highlight selector matches nothing or a hidden element** → capture fails for that shot; no highlight box drawn at (0,0). Pinned in Task 4 (`validateManifest` rejects zero-size or out-of-viewport boxes).
5. **Content drift between `roles.ts` and the manifest** (shot id in content but not captured) → caught before render. Pinned in Task 6 (`every shot in roles.ts exists in manifest`).

---

### Task 1: Scaffold the Remotion project and the content model

**Files:**
- Create: `video/package.json`, `video/tsconfig.json`, `video/remotion.config.ts`, `video/src/index.ts`, `video/src/Root.tsx`
- Create: `video/src/content/types.ts`, `video/src/content/roles.ts`
- Create: `video/src/lib/timing.ts`
- Test: `video/test/content.test.ts`, `video/test/timing.test.ts`
- Modify: `.gitignore` (add `video/node_modules/`, `video/out/`, `video/capture/.backup/`)

**Interfaces:**
- Produces (`types.ts`):
  - `type RoleId = 'sales' | 'sales_manager' | 'site_manager' | 'engineer' | 'administrator'`
  - `interface Shot { id: string; route: string; caption: string; highlight: string /* Playwright locator */; zoom?: number }`
  - `interface Role { id: RoleId; number: string /* '01'..'05' */; name: string; color: string; who: string; mainTask: string; flow: string[] /* 3–5 steps */; shots: Shot[]; recap: string; durationSec: number; menu: string[] /* sidebar labels */ }`
- Produces (`roles.ts`): `export const ROLES: Role[]` in spec order; `export const INTRO_SEC = 10, BIG_FLOW_SEC = 30, OUTRO_SEC = 20`; `export const BIG_FLOW: { label: string; role: RoleId }[]` (the 11 steps of spec §5).
- Produces (`timing.ts`): `export const FPS = 30`; `chapterSegments(role: Role): { silence: number; wipe: number; card: number; flow: number; shot: number; recap: number }` (frames; `shot` = per-shot frames); `totalFrames(roles: Role[]): number`.

- [ ] **Step 1: Create branch and scaffold** — `git switch -c feat/demo-video`; in `video/` run `npm init -y`, `npm i -E remotion@4 @remotion/cli@4 @remotion/google-fonts@4 react@18.3.1 react-dom@18.3.1`, `npm i -DE typescript @types/react@18 playwright`, `npx playwright install chromium`. Scripts: `"test": "node --test test/"`, `"studio": "remotion studio src/index.ts"`, `"render": "remotion render src/index.ts AmsarDemo out/amsar-demo.mp4"`, `"capture": "node capture/capture.ts"`.

- [ ] **Step 2: Write the failing tests**

```ts
// test/content.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { ROLES, BIG_FLOW } from '../src/content/roles.ts';
test('five roles in spec order with spec colors', () => {
  assert.deepEqual(ROLES.map(r => [r.id, r.color, r.durationSec]), [
    ['sales', '#2563EB', 55], ['sales_manager', '#7C3AED', 50], ['site_manager', '#EA580C', 45],
    ['engineer', '#0D9488', 40], ['administrator', '#15803D', 50]]);
});
test('numbers are 01..05', () => assert.deepEqual(ROLES.map(r => r.number), ['01','02','03','04','05']));
test('each role has 3–5 flow steps and at least 4 shots', () => {
  for (const r of ROLES) { assert.ok(r.flow.length >= 3 && r.flow.length <= 5, r.id); assert.ok(r.shots.length >= 4, r.id); }
});
test('shot ids unique per role', () => { for (const r of ROLES) assert.equal(new Set(r.shots.map(s => s.id)).size, r.shots.length); });
test('big flowchart has the 11 steps of spec §5 and ends with administrator', () => {
  assert.equal(BIG_FLOW.length, 11); assert.equal(BIG_FLOW.at(-1)!.role, 'administrator');
});
// test/timing.test.ts
import { chapterSegments, totalFrames, FPS } from '../src/lib/timing.ts';
test('per-shot time between 5 and 7.5 s for every role', () => {
  for (const r of ROLES) { const s = chapterSegments(r).shot / FPS; assert.ok(s >= 5 && s <= 7.5, `${r.id}: ${s}`); }
});
test('chapter segments sum to role duration', () => {
  for (const r of ROLES) { const g = chapterSegments(r);
    assert.equal(g.silence + g.wipe + g.card + g.flow + g.shot * r.shots.length + g.recap, r.durationSec * FPS); }
});
test('total is 300 s', () => assert.equal(totalFrames(ROLES), 300 * FPS));
```

- [ ] **Step 3: Run `npm test`** — Expected: FAIL (modules missing).

- [ ] **Step 4: Implement `types.ts`, `roles.ts`, `timing.ts`.** `chapterSegments` gives any rounding remainder to the last shot via `recap` staying fixed: compute `shot = floor(rest / n)` and add `rest - shot*n` to `recap`. Shots per role (route — caption — highlight target):
  - **Sales** (`menu`: Dashboard, Customer, Plan Visit, Realisasi Visit, Laporan Visit, Sales Funnel, Absensi): `dashboard` /sales/dashboard — "Dashboard pribadi: target, kunjungan, dan funnel milik Sales" — KPI cards; `attendance` /attendance — "Absensi harian dengan GPS dan kamera" — check-in panel; `customers` /customers — "Sales menambah customer baru (disetujui Sales Manager)" — add button; `plan-visits` /plan-visits — "Rencana kunjungan ke customer" — table; `realisasi` /realisasi-visits — "Realisasi kunjungan: selesai atau terlewat" — status column; `unplanned` /create-unplanned-visit — "Kunjungan dadakan, menunggu persetujuan manager" — form; `funnels` /funnels — "Sales funnel: prospek → qualified → proposal → negosiasi → closing" — stage area; `funnel-detail` /funnels/:id (first won funnel) — "Riwayat aktivitas sampai deal WON" — activity list.
  - **Sales Manager** (`menu`: Dashboard, Customer, Plan Visit, Realisasi Visit, Laporan Visit, Peringatan, Sales Funnel, Absensi): `dashboard` /manager/dashboard — "Kinerja seluruh tim sales" — team chart; `customers` /customers — "Menyetujui atau menolak customer baru" — approve control; `plan-visits` /plan-visits — "Menyetujui rencana kunjungan" — approve control; `realisasi` /realisasi-visits — "Menyetujui kunjungan dadakan" — unplanned row; `visit-reports` /visit-reports — "Laporan kunjungan tim" — report table; `warnings` /warnings — "Peringatan otomatis saat kunjungan terlewat" — warning list; `funnels` /funnels — "Memantau funnel seluruh tim" — funnel table.
  - **Site Manager** (`menu`: Dashboard, Proyek, Dokumen, Laporan): `dashboard` /site/dashboard — "Status semua proyek: on track, at risk, delayed, completed" — status cards; `projects` /projects — "Daftar proyek, termasuk yang otomatis dibuat dari deal WON" — project list; `project-detail` /projects/:id — "Assign engineer ke proyek" — engineer section; `documents` /documents — "Dokumen proyek terpusat" — document list; `reports` /reports — "Laporan proyek dan RAB" — chart.
  - **Engineer** (`menu`: Dashboard, Proyek Saya, Laporan Progress): `dashboard` /engineer/dashboard — "Ringkasan proyek yang ditugaskan" — summary cards; `projects` /engineer/projects — "Hanya proyek yang di-assign ke engineer ini" — list; `project-detail` /engineer/projects/:id — "Material dan RAB proyek" — material/RAB section; `progress` /engineer/progress-reports — "Mengirim laporan progress ke Site Manager" — submit control.
  - **Administrator** (`menu`: Dashboard, Proyek, Dokumen, Laporan, Customer, Plan Visit, Realisasi Visit, Laporan Visit, Peringatan, Sales Funnel, Manajemen User, Monitor Absensi, Log Aktivitas): `dashboard` /dashboard — "Ringkasan seluruh perusahaan" — KPI cards; `users` /users — "Menyetujui akun baru dan mengatur role" — status column; `attendance-monitor` /admin/attendance-monitor — "Memantau absensi semua karyawan" — table; `activity` /activity — "Log aktivitas: siapa melakukan apa" — log list; `all-access` /dashboard with sidebar — "Akses penuh ke semua modul" — sidebar nav.
  `who`/`mainTask`/`recap` copy: Sales "Tim lapangan" / "Kunjungi customer dan cetak deal" / "Data kunjungan & funnel → Sales Manager"; Sales Manager "Pemimpin tim sales" / "Menyetujui, memantau, dan menjaga target" / "Deal WON → proyek otomatis ke Site Manager"; Site Manager "Penanggung jawab proyek" / "Kelola proyek dan tugaskan engineer" / "Proyek ditugaskan → Engineer"; Engineer "Pelaksana di lapangan" / "Kerjakan proyek dan laporkan progress" / "Progress & dokumen → dipantau Administrator"; Administrator "Manajemen perusahaan" / "Memantau dan mengatur seluruh sistem" / "Semua data dalam satu dashboard".

- [ ] **Step 5: Implement `Root.tsx`** registering `<Composition id="AmsarDemo" width={1920} height={1080} fps={30} durationInFrames={totalFrames(ROLES)} component={() => null} />` (real component wired in Task 6).

- [ ] **Step 6: Verify** — `npm test` PASS; `npx remotion compositions src/index.ts` lists `AmsarDemo 1920x1080 30fps 9000 frames`.

- [ ] **Step 7: Commit** — `git add .gitignore video/ && git commit -m "feat(video): scaffold Remotion project and role content"`

### Task 2: Back up the DB, seed demo data, checkpoint with the user

**Files:**
- Create: `video/capture/seed-demo.sh`

- [ ] **Step 1: Write `seed-demo.sh`** — `set -euo pipefail`; refuses to run if `video/capture/.backup/amsar_dashboard-before.sql` already exists (no double seeding); runs `mysqldump --single-transaction amsar_dashboard > .backup/amsar_dashboard-before.sql`; then `php backend/artisan db:seed --class=SalesPerformanceSeeder --force` and `--class=PerformanceProjectSeeder --force`; then prints row counts for projects, project_assignments, customers, plan_visits, realisasi_visits, sales_funnels, funnel_activities, attendances, warnings, engineer_progress_reports, documents, materials, users where status='pending'.

- [ ] **Step 2: Run it** — Expected: dump file > 0 bytes; projects, customers, plan_visits, realisasi_visits, sales_funnels, attendances, warnings all > 0.

- [ ] **Step 3: Inventory empty pages** — log in manually via the browser pane is not possible yet (passwords), so derive from counts: list every shot from Task 1 whose data table has 0 rows (expected candidates: engineer progress reports, documents, materials, pending users, pending/unplanned approvals, a funnel-created `[FUNNEL]` project).

- [ ] **Step 4: CHECKPOINT — stop and report to the user** the counts and the list of shots that would render empty, with options per shot (create a small amount of extra demo data through the app's own UI as that role, drop the shot, or keep the empty state). Do not continue until the user decides. Record the decision in `roles.ts` (drop/keep shots) and, if extra data is approved, add the steps to create it to Task 4 Step 5.

- [ ] **Step 5: Commit** — `git add video/capture/seed-demo.sh && git commit -m "chore(video): demo data seeding script"`

### Task 3: Temporary password swap with guaranteed restore

**Files:**
- Create: `video/capture/db.ts`, `video/capture/passwords.ts`
- Test: `video/test/passwords.test.ts`

**Interfaces:**
- Produces (`db.ts`): `query(sql: string): string` (runs `mysql -N -B -uroot amsar_dashboard -e`, returns stdout, throws on non-zero exit); `bcrypt(plain: string): string` (runs `php -r "echo password_hash(stream_get_contents(STDIN), PASSWORD_BCRYPT);"` with the password on stdin, never on the command line).
- Produces (`passwords.ts`): `ACCOUNTS: { role: RoleId; email: string }[]` (the five emails from the users table); `withTemporaryPasswords<T>(fn: (password: string) => Promise<T>): Promise<T>` — backs up `id,password` for the five accounts to `.backup/passwords.json`, generates `crypto.randomBytes(18).toString('base64url')`, sets the bcrypt hash for all five, runs `fn`, and in `finally` restores each original hash then re-reads and asserts equality; deletes `passwords.json` only after successful verification.

- [ ] **Step 1: Write the failing tests** (integration, hits the local DB)

```ts
test('restores original hashes after success', async () => {
  const before = query("select id,password from users order by id");
  await withTemporaryPasswords(async pw => {
    assert.notEqual(query("select id,password from users order by id"), before);
    const r = await fetch('http://127.0.0.1:8000/api/auth/login', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@ptamsar.co.id', password: pw }) });
    assert.equal(r.status, 200);
  });
  assert.equal(query("select id,password from users order by id"), before);
});
test('restores original hashes when the callback throws', async () => {
  const before = query("select id,password from users order by id");
  await assert.rejects(withTemporaryPasswords(async () => { throw new Error('boom'); }), /boom/);
  assert.equal(query("select id,password from users order by id"), before);
});
```

(Check the login route path in `backend/routes/api.php` and adjust the URL if it differs; log out the returned token with `POST /api/auth/logout`.)

- [ ] **Step 2: Run** `node --test test/passwords.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement `db.ts` and `passwords.ts`** per Interfaces.
- [ ] **Step 4: Run** — Expected: PASS; `video/capture/.backup/passwords.json` does not exist afterwards.
- [ ] **Step 5: Commit** — `git commit -m "feat(video): temporary password swap with verified restore"`

### Task 4: Capture screenshots and highlight boxes

**Files:**
- Create: `video/capture/manifest.ts`, `video/capture/capture.ts`
- Test: `video/test/manifest.test.ts`
- Output: `video/public/screens/<role>/<shot>.png`, `video/public/screens/manifest.json`

**Interfaces:**
- Consumes: `ROLES` (Task 1), `withTemporaryPasswords`, `ACCOUNTS` (Task 3).
- Produces (`manifest.ts`): `interface Box { x: number; y: number; width: number; height: number }`; `type Manifest = Record<RoleId, Record<string, { file: string; box: Box }>>`; `validateManifest(m: Manifest, roles: Role[]): string[]` (list of problems, empty when valid); `assertNotLoginPage(url: string, role: RoleId): void` (throws `Error("Login gagal untuk role <role>: masih di /login")` when the path is `/login`).

- [ ] **Step 1: Write the failing tests**

```ts
test('rejects zero-size and out-of-viewport boxes', () => {
  const m = manifestWith({ x: 0, y: 0, width: 0, height: 0 });
  assert.match(validateManifest(m, ROLES).join('\n'), /ukuran nol/);
  assert.match(validateManifest(manifestWith({ x: 1900, y: 10, width: 200, height: 50 }), ROLES).join('\n'), /di luar layar/);
});
test('reports shots in roles.ts missing from manifest', () => {
  assert.match(validateManifest({} as Manifest, ROLES).join('\n'), /sales\/dashboard tidak ada/);
});
test('assertNotLoginPage throws with role name', () => {
  assert.throws(() => assertNotLoginPage('http://localhost:5173/login', 'engineer'), /engineer/);
});
```
(`manifestWith(box)` is a local helper building a full manifest from `ROLES` with every box set to `box`.)

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement `manifest.ts`.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Implement `capture.ts`** — inside `withTemporaryPasswords`: for each role, new context (viewport 1920×1080, `deviceScaleFactor: 1`, permissions none), log in through the form, `assertNotLoginPage`, then per shot: resolve `:id` routes by clicking the first row link on the parent list page, `goto`, wait for `networkidle` plus 800 ms, fail if a toast/error text "gagal"/"error" is visible, locate `shot.highlight` (must be visible, `boundingBox()` non-null), screenshot full viewport, record box. Log out via `POST /api/auth/logout` with the token from `localStorage['amsar-auth']`. After all roles, write the manifest and exit non-zero if `validateManifest` returns problems. Pick each `highlight` locator by inspecting the page in the browser pane; prefer `getByRole`/`getByText` over CSS classes.
- [ ] **Step 6: Run `npm run capture`** (backend + frontend running) — Expected: exit 0, 29 PNGs (minus any shots dropped at the Task 2 checkpoint), manifest valid, final log line confirms hashes restored.
- [ ] **Step 7: Look at every PNG** (Read tool) — no login page, no empty tables except ones the user accepted, no test-sounding text left unreported (report e.g. "Skenario status uji" to the user).
- [ ] **Step 8: Commit** — `git add video/capture video/public/screens video/test && git commit -m "feat(video): capture real screenshots per role"`

### Task 5: Visual building blocks

**Files:**
- Create: `video/src/lib/zoom.ts`, `video/src/theme.ts`, `video/src/components/{BrowserFrame,Highlight,Caption,ChapterMarker,Wipe,Flowchart}.tsx`
- Test: `video/test/zoom.test.ts`

**Interfaces:**
- Produces (`zoom.ts`): `zoomTransform(box: Box, viewport: { width: number; height: number }, scale: number): { scale: number; translateX: number; translateY: number }` — translation that centers `box` at `scale`, clamped so no area outside the screenshot is shown.
- Produces components: `BrowserFrame({ src, url, children })`, `Highlight({ box, color, appearAt })`, `Caption({ text, color })`, `ChapterMarker({ activeIndex })` (labels: Sales, Sales Mgr, Site Mgr, Engineer, Admin), `Wipe({ color })`, `Flowchart({ nodes: { label: string; color: string }[], layout: 'row' | 'snake', stagger: number })`. `theme.ts`: font family loaded via `@remotion/google-fonts/Inter`, neutral background `#0B1220`, text `#F8FAFC`.

- [ ] **Step 1: Write the failing tests**

```ts
test('centers a box in the middle of the viewport', () => {
  const t = zoomTransform({ x: 860, y: 490, width: 200, height: 100 }, { width: 1920, height: 1080 }, 2);
  assert.deepEqual(t, { scale: 2, translateX: 0, translateY: 0 });
});
test('clamps at the top-left edge', () => {
  const t = zoomTransform({ x: 0, y: 0, width: 100, height: 50 }, { width: 1920, height: 1080 }, 2);
  assert.deepEqual(t, { scale: 2, translateX: 480, translateY: 270 });
});
test('scale 1 never translates', () => {
  assert.deepEqual(zoomTransform({ x: 0, y: 0, width: 10, height: 10 }, { width: 1920, height: 1080 }, 1), { scale: 1, translateX: 0, translateY: 0 });
});
```
(Translate values are in screenshot pixels applied after `transform-origin: center`.)

- [ ] **Step 2: Run** — FAIL. **Step 3:** implement `zoom.ts`. **Step 4:** run — PASS.
- [ ] **Step 5: Implement the components**; check each in `npm run studio` with a temporary test composition, then remove it.
- [ ] **Step 6: Commit** — `git commit -m "feat(video): frame, highlight, caption, marker, wipe, flowchart"`

### Task 6: Scenes and full timeline

**Files:**
- Create: `video/src/scenes/{Intro,BigFlowchart,ChapterCard,MiniFlowchart,ScreenshotScene,Recap,Chapter,Outro}.tsx`, `video/src/Video.tsx`
- Modify: `video/src/Root.tsx` (use `Video`)
- Test: `video/test/coverage.test.ts`

**Interfaces:**
- Consumes: `ROLES`, `BIG_FLOW`, `INTRO_SEC`, `BIG_FLOW_SEC`, `OUTRO_SEC`, `chapterSegments`, `FPS`, `validateManifest`, all Task 5 components, `public/screens/manifest.json` (via `staticFile`).
- `Chapter({ role, manifest })` lays out silence → wipe → card → mini flow → shots → recap with `<Series>` using `chapterSegments(role)`. `ScreenshotScene` eases from scale 1 to `shot.zoom ?? 1.6` centered on the manifest box using `zoomTransform`, shows `Highlight` at 40% of the shot, `Caption` from the start.
- `Outro` shows the role × menu matrix built from `ROLES[i].menu` (union of labels as rows, roles as columns, a check mark in the role color), then the closing line "PT Amsar Prima Mandiri — Proyek & Penjualan dalam satu dashboard".
- `Video` = `<Series>` Intro → BigFlowchart → 5× Chapter → Outro; `<Audio>` from `staticFile('music.mp3')` only when the file exists (check at bundle time via `getStaticFiles()`), volume 0.25 with 2 s fades.

- [ ] **Step 1: Write the failing test**

```ts
import manifest from '../public/screens/manifest.json' with { type: 'json' };
test('every shot in roles.ts exists in the captured manifest and is valid', () => {
  assert.deepEqual(validateManifest(manifest, ROLES), []);
});
```
- [ ] **Step 2: Run** — FAIL only if Task 4 output drifted from `roles.ts`; if it passes immediately, confirm by temporarily renaming one shot id and seeing it fail, then revert.
- [ ] **Step 3: Implement scenes and `Video.tsx`; wire into `Root.tsx`.**
- [ ] **Step 4: Verify** — `npm test` PASS; `npx remotion compositions src/index.ts` shows 9000 frames.
- [ ] **Step 5: Render stills** — `npx remotion still src/index.ts AmsarDemo out/still-<n>.png --frame=<n>` at the midpoint of: intro, big flowchart (end), each chapter card, each mini flowchart, one screenshot per role at highlight time, each recap, outro matrix. Read every still; fix overlaps, clipped text, wrong colors, highlights off-target.
- [ ] **Step 6: Commit** — `git commit -m "feat(video): scenes and full timeline"`

### Task 7: Render and final check

- [ ] **Step 1: Render** — `npm run render`. Expected: `out/amsar-demo.mp4` exists.
- [ ] **Step 2: Verify format** — `npx remotion ffprobe out/amsar-demo.mp4` (or bundled ffprobe): 1920×1080, 30 fps, duration 300 s ± 15 s; audio stream present only if `music.mp3` exists.
- [ ] **Step 3: Watch** — open the file in the browser pane, scrub through each chapter boundary, and confirm the chapter breaks (silence, wipe, card, marker) are obvious.
- [ ] **Step 4: Confirm password restore** — the capture log from Task 4 reported restored hashes; re-run `select id, left(password, 7) from users` and compare with `.backup` absence (no leftover file).
- [ ] **Step 5: Report to the user** — file path, duration, size, the list of any shots dropped or empty states kept, and that the seeded demo data is still in the local DB with the dump at `video/capture/.backup/amsar_dashboard-before.sql` for restoring.
- [ ] **Step 6: Commit** — `git commit -m "docs(video): render instructions"` (add a short `video/README.md`: capture, studio, render commands).
