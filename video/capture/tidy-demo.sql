-- Tidies the seeder output for the demo video: keeps the first 60 seeded projects (by id, whatever the
-- id range is; projects the app created from a WON funnel are never touched), strips test markers, and sets deadlines so each status matches
-- Project::statusFor(end_date, progress): past deadline => delayed, <=30 days and <80% => at_risk.
DROP TEMPORARY TABLE IF EXISTS keep_projects;
CREATE TEMPORARY TABLE keep_projects AS
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS n FROM projects WHERE name NOT LIKE '[FUNNEL]%';
DELETE p FROM projects p JOIN keep_projects k ON k.id = p.id WHERE k.n > 60;

UPDATE projects SET
  name = REGEXP_REPLACE(name, '^PRF-[0-9]+ ', ''),
  description = REGEXP_REPLACE(REPLACE(description, '[PERF_TEST_500_PROJECTS] ', ''), 'Skenario status uji: [^.]*\\. ', ''),
  description = REPLACE(description, ' Dataset ini dibuat untuk uji dashboard, pagination, search, filter tanggal, chart bulanan, update, delete, dan akses role.', '');

UPDATE projects p JOIN keep_projects k ON k.id = p.id SET
  p.progress = 100, p.status = 'completed', p.end_date = CURDATE() - INTERVAL (k.n * 2) DAY,
  p.completed_at = COALESCE(p.completed_at, NOW() - INTERVAL (k.n * 2) DAY)
  WHERE k.n % 10 = 0;
UPDATE projects p JOIN keep_projects k ON k.id = p.id SET
  p.status = 'delayed', p.end_date = CURDATE() - INTERVAL 9 DAY, p.progress = LEAST(p.progress, 85), p.completed_at = NULL
  WHERE k.n % 10 <> 0 AND k.n % 15 = 1;
UPDATE projects p JOIN keep_projects k ON k.id = p.id SET
  p.status = 'at_risk', p.end_date = CURDATE() + INTERVAL 20 DAY, p.progress = LEAST(GREATEST(p.progress, 35), 70), p.completed_at = NULL
  WHERE k.n % 10 <> 0 AND k.n % 15 <> 1 AND k.n % 7 = 3;
UPDATE projects p JOIN keep_projects k ON k.id = p.id SET
  p.status = 'on_track', p.end_date = CURDATE() + INTERVAL (45 + k.n * 3) DAY, p.progress = LEAST(GREATEST(p.progress, 10), 95), p.completed_at = NULL
  WHERE k.n % 10 <> 0 AND k.n % 15 <> 1 AND k.n % 7 <> 3;

-- Seeded customer contacts are "PIC <company> 001" / customer001@example.co.id; give them
-- plausible (fictional) contact names and keep copies in funnels and visits in sync.
UPDATE customers SET
  name = ELT(1 + id % 12, 'Andi Pratama', 'Siti Rahmawati', 'Budi Santoso', 'Dewi Lestari', 'Rizky Hidayat', 'Nur Aini',
                          'Agus Setiawan', 'Maya Sari', 'Hendra Wijaya', 'Fitri Handayani', 'Yoga Saputra', 'Ratna Kusuma')
  WHERE name LIKE 'PIC %';
UPDATE customers SET email = CONCAT(LOWER(REPLACE(name, ' ', '.')), id, '@example.co.id')
  WHERE email REGEXP '^customer[0-9]+@example\.co\.id$';
UPDATE sales_funnels f JOIN customers c ON c.id = f.customer_id SET f.customer_name = c.name, f.customer_email = c.email;
UPDATE realisasi_visits r JOIN customers c ON c.id = r.customer_id SET r.customer_name = c.name
  WHERE r.customer_name LIKE 'PIC %';

-- Strip the sales seeder's test markers from visible text.
UPDATE customers SET address = REPLACE(address, '[SALES_PERF_TEST] ', ''),
  rejection_reason = REPLACE(rejection_reason, ' untuk kebutuhan testing approval', '');
UPDATE funnel_activities SET notes = REPLACE(notes, '[SALES_PERF_TEST] ', '');
UPDATE plan_visits SET tujuan = REPLACE(tujuan, '[SALES_PERF_TEST] ', ''),
  keterangan = REPLACE(REPLACE(keterangan, '[SALES_PERF_TEST] ', ''), 'Jadwal visit sales performance.', 'Jadwal kunjungan rutin.');
UPDATE realisasi_visits SET
  catatan = REPLACE(REPLACE(catatan, '[SALES_PERF_TEST] ', ''), 'Data dummy sales visit.', 'Kunjungan rutin ke customer.'),
  catatan = REPLACE(catatan, 'Data dummy unplanned visit.', 'Kunjungan dadakan atas permintaan customer.'),
  meeting_notes = REPLACE(meeting_notes, '[SALES_PERF_TEST] ', ''),
  notes = REPLACE(notes, '[SALES_PERF_TEST] ', ''),
  visit_purpose = REPLACE(visit_purpose, '[SALES_PERF_TEST] ', '');
UPDATE sales_funnels SET
  initial_notes = REPLACE(REPLACE(initial_notes, '[SALES_PERF_TEST] ', ''),
    'Funnel dummy untuk test pipeline sales, filter, stats, won/lost, dan pagination.', 'Peluang pengadaan alat kesehatan dari kunjungan sales.'),
  won_notes = REPLACE(won_notes, 'Deal dimenangkan dari data dummy.', 'Deal dimenangkan setelah negosiasi harga.');

-- The sales seeder dates visits January–June 2026, so dashboards read "telat 294 hari". Shift the
-- seeded history forward as one block (relationships between dates are kept) so it ends today.
-- Guarded: only runs while the latest visit is more than 30 days old, so re-running is a no-op.
SELECT IF(MAX(tanggal_visit) < CURDATE() - INTERVAL 30 DAY, DATEDIFF(CURDATE(), MAX(tanggal_visit)), 0) INTO @shift FROM plan_visits;
UPDATE plan_visits SET tanggal_visit = tanggal_visit + INTERVAL @shift DAY, approved_at = approved_at + INTERVAL @shift DAY,
  created_at = created_at + INTERVAL @shift DAY;
UPDATE realisasi_visits SET visit_date = visit_date + INTERVAL @shift DAY, visited_at = visited_at + INTERVAL @shift DAY,
  approved_at = approved_at + INTERVAL @shift DAY, created_at = created_at + INTERVAL @shift DAY;
UPDATE customers SET created_at = created_at + INTERVAL @shift DAY, approved_at = approved_at + INTERVAL @shift DAY;
UPDATE sales_funnels SET created_at = created_at + INTERVAL @shift DAY, target_close_date = target_close_date + INTERVAL @shift DAY,
  deadline_date = deadline_date + INTERVAL @shift DAY;
UPDATE funnel_activities SET activity_date = activity_date + INTERVAL @shift DAY, created_at = created_at + INTERVAL @shift DAY
  WHERE activity_date < '2026-07-01';
UPDATE warnings w JOIN plan_visits p ON p.id = w.plan_visit_id SET
  w.created_at = w.created_at + INTERVAL @shift DAY,
  w.message = REGEXP_REPLACE(REGEXP_REPLACE(REPLACE(w.message, '[SALES_PERF_TEST] ', ''), 'PIC (.*) [0-9]{3} pada', '$1 pada'),
                             'pada [0-9]{2}/[0-9]{2}/[0-9]{4}', CONCAT('pada ', DATE_FORMAT(p.tanggal_visit, '%d/%m/%Y')));

-- Unrealised visits without a "terlewat" warning become the upcoming two weeks' schedule, so the
-- Sales dashboard shows a live agenda; visits that already raised a warning stay overdue (they are
-- the automatic-warning part of the story). Re-running is a no-op: moved visits are in the future.
UPDATE plan_visits p SET p.tanggal_visit = CURDATE() + INTERVAL (p.id % 14) DAY
  WHERE p.status IN ('pending', 'approved') AND p.tanggal_visit < CURDATE() - INTERVAL 7 DAY
    AND NOT EXISTS (SELECT 1 FROM warnings w WHERE w.plan_visit_id = p.id);

-- Overdue visits that raised a warning are moved into the last three weeks (warning text and
-- timestamp follow), so they read "telat 3–22 hari" instead of months. Re-running is a no-op.
DROP TEMPORARY TABLE IF EXISTS overdue_visits;
CREATE TEMPORARY TABLE overdue_visits AS
  SELECT p.id, CURDATE() - INTERVAL (3 + p.id % 20) DAY AS new_date FROM plan_visits p
  WHERE p.status IN ('pending', 'approved') AND p.tanggal_visit < CURDATE() - INTERVAL 30 DAY
    AND EXISTS (SELECT 1 FROM warnings w WHERE w.plan_visit_id = p.id);
UPDATE plan_visits p JOIN overdue_visits o ON o.id = p.id SET p.tanggal_visit = o.new_date;
UPDATE warnings w JOIN overdue_visits o ON o.id = w.plan_visit_id SET
  w.created_at = o.new_date + INTERVAL 1 DAY + INTERVAL 12 HOUR,
  w.message = REGEXP_REPLACE(w.message, 'pada [0-9]{2}/[0-9]{2}/[0-9]{4}', CONCAT('pada ', DATE_FORMAT(o.new_date, '%d/%m/%Y')));
