#!/usr/bin/env bash
# Backs up amsar_dashboard, then fills it with the repo's demo seeders for the five existing accounts.
# Restore with: mysql -uroot amsar_dashboard < video/capture/.backup/amsar_dashboard-before.sql
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MYSQL_BIN="C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin"
PHP="C:/laragon/bin/php/php-8.3.26-Win32-vs16-x64/php.exe"
BACKUP_DIR="$ROOT/video/capture/.backup"
DUMP="$BACKUP_DIR/amsar_dashboard-before.sql"

if [[ -e "$DUMP" ]]; then
  echo "Sudah pernah di-seed (ada $DUMP). Restore dulu dari dump itu kalau mau seeding ulang." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
"$MYSQL_BIN/mysqldump.exe" -uroot --single-transaction --routines amsar_dashboard > "$DUMP"
echo "Backup: $DUMP ($(wc -c < "$DUMP") bytes)"

"$PHP" "$ROOT/backend/artisan" db:seed --class=SalesPerformanceSeeder --force
"$PHP" "$ROOT/backend/artisan" db:seed --class=PerformanceProjectSeeder --force

"$MYSQL_BIN/mysql.exe" -uroot amsar_dashboard -e "
select 'projects' tbl, count(*) n from projects union all
select 'project_assignments', count(*) from project_assignments union all
select 'customers', count(*) from customers union all
select 'customers_pending', count(*) from customers where approval_status='pending' union all
select 'plan_visits', count(*) from plan_visits union all
select 'realisasi_visits', count(*) from realisasi_visits union all
select 'unplanned_pending', count(*) from realisasi_visits where type='unplanned' and approval_status='pending' union all
select 'sales_funnels', count(*) from sales_funnels union all
select 'funnels_won', count(*) from sales_funnels where status='won' union all
select 'funnel_activities', count(*) from funnel_activities union all
select 'attendances', count(*) from attendances union all
select 'warnings', count(*) from warnings union all
select 'engineer_progress_reports', count(*) from engineer_progress_reports union all
select 'progress_reports', count(*) from progress_reports union all
select 'documents', count(*) from documents union all
select 'materials', count(*) from materials union all
select 'users_pending', count(*) from users where status='pending' union all
select 'funnel_projects', count(*) from projects where name like '[FUNNEL]%'"
