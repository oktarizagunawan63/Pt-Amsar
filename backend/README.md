# PT Amsar Dashboard — backend (Laravel 11)

## Tugas terjadwal

Jadwal ada di `routes/console.php`:

| Perintah | Jam | Isi |
|---|---|---|
| `projects:refresh-status` | 00:05 | Hitung ulang status proyek yang belum selesai (on track / at risk / delayed) |
| `visits:mark-missed` | 00:15 | Tandai terlewat visit yang sudah disetujui, lewat harinya, dan belum direalisasi (peringatan + notifikasi) |
| `projects:check-deadlines` | 08:00 | Notifikasi proyek yang deadline-nya ≤ 7 hari dengan progress < 80% |
| `projects:check-budget` | 09:00 | Notifikasi proyek yang realisasi anggarannya melebihi RAB |

Notifikasi deadline dan over budget dikirim paling banyak sekali per proyek per user per hari.

Jadwal ini **hanya berjalan kalau server memanggil scheduler setiap menit**:

- Linux (cron): `* * * * * cd /path/ke/backend && php artisan schedule:run >> /dev/null 2>&1`
- Windows: buat tugas di Task Scheduler yang menjalankan `php artisan schedule:run` dari folder `backend` setiap 1 menit,
  atau biarkan `php artisan schedule:work` berjalan terus.

Setiap perintah juga bisa dijalankan manual, mis. `php artisan visits:mark-missed`.
Cek jadwal: `php artisan schedule:list`.

## Test

```bash
php artisan test
```

Test memakai database `amsar_dashboard_test` (lihat `phpunit.xml`) dan butuh `mysql` client di PATH.
