# Video demo PT Amsar Dashboard

Video demo ±5 menit (1920×1080, 30 fps) yang menunjukkan kelima role (Sales, Sales Manager,
Site Manager, Engineer, Administrator), dibuat dari screenshot asli aplikasi dengan Remotion.

Spec: `docs/superpowers/specs/2026-10-27-amsar-demo-video-design.md`

## Isi folder

| Path | Isi |
|---|---|
| `src/content/roles.ts` | Semua teks: caption, alur per role, warna, urutan screenshot |
| `src/scenes/`, `src/components/` | Tampilan video |
| `capture/` | Script untuk mengisi data demo dan mengambil screenshot dari aplikasi yang berjalan |
| `public/screens/` | Hasil screenshot + `manifest.json` (posisi highlight) |
| `audio/synth.ts` | Membuat musik latar dan efek whoosh dari nol (tanpa sampel, bebas hak cipta) |
| `public/music.mp3`, `public/whoosh.mp3` | Hasil `npm run audio`; dipakai otomatis kalau file-nya ada |

## Perintah

Jalankan dari folder `video/`.

```bash
npm test          # unit + integration test (butuh MySQL dan backend :8000 untuk test password)
npm run studio    # preview interaktif di browser
npm run render    # render ke out/amsar-demo.mp4
npm run capture   # ambil ulang screenshot (butuh backend :8000 dan frontend :5173)
npm run audio     # buat ulang public/music.mp3 dan public/whoosh.mp3
```

## Data demo

`capture/seed-demo.sh` mem-backup DB ke `capture/.backup/amsar_dashboard-before.sql`, lalu
menjalankan seeder demo. `capture/tidy-demo.sql` merapikan data seeder (teks uji, tanggal,
status proyek) dan aman dijalankan ulang. Kembalikan DB ke kondisi sebelum seeding dengan:

```bash
mysql -uroot amsar_dashboard < capture/.backup/amsar_dashboard-before.sql
```

`npm run capture` mengganti password kelima akun demo sementara (acak, hanya di memori) dan
selalu mengembalikan hash aslinya, termasuk saat capture gagal. Kalau proses mati paksa di
tengah jalan, kembalikan dengan `node capture/passwords.ts --restore`.
