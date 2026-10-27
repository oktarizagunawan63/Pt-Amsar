-- Tidies the seeder output for the demo video: keeps the first 60 projects (by id, whatever the
-- id range is), strips test markers, and sets deadlines so each status matches
-- Project::statusFor(end_date, progress): past deadline => delayed, <=30 days and <80% => at_risk.
DROP TEMPORARY TABLE IF EXISTS keep_projects;
CREATE TEMPORARY TABLE keep_projects AS
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS n FROM projects;
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
