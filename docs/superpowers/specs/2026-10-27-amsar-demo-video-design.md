# Video Demo PT Amsar Dashboard — Design Spec

Tanggal: 2026-10-27
Status: menunggu review

## 1. Tujuan

Satu video demo untuk **meyakinkan PT Amsar membeli sistem ini**. Penontonnya manajemen
PT Amsar (pengambil keputusan), jadi video harus:

- Menampilkan **kelima role** dan, untuk tiap role, **jelas apa saja yang dia kerjakan** di sistem.
- **Benar**: semua tampilan berasal dari aplikasi asli yang sedang berjalan, dan semua
  caption/flowchart diturunkan dari logika di kode. Tidak ada fitur karangan.
- Menunjukkan sistem sebagai **satu alur kerja yang nyambung** antar-role.

Kriteria sukses: orang yang tidak pernah melihat aplikasinya bisa menjelaskan, setelah menonton,
siapa melakukan apa dan bagaimana data mengalir dari Sales sampai Administrator.

## 2. Keputusan yang sudah disepakati

| Topik | Keputusan |
|---|---|
| Jumlah video | **Satu video utama** saja (tanpa versi per role) |
| Sumber visual | **Screenshot asli** aplikasi + animasi Remotion (zoom, highlight, caption) |
| Akun | **Akun yang sudah ada** di DB; password di-backup → diganti sementara → dikembalikan |
| Penjelasan | **Teks di layar** (Bahasa Indonesia) + musik latar opsional |
| Flowchart | Satu flowchart besar + satu flowchart mini per role, animasi di Remotion |
| Jeda antar-role | Kartu bab, warna khas role, penanda bab di pojok, transisi wipe, kilas balik |

## 3. Format

- MP4 H.264, 1920×1080, 30 fps, durasi target ±5 menit.
- Output: `video/out/amsar-demo.mp4`.
- Musik: jika `video/public/music.mp3` ada, dipakai dengan volume rendah + fade in/out;
  jika tidak ada, video tetap dirender tanpa audio.

## 4. Role, warna, dan cakupan (diambil dari kode)

Sumber: `frontend/src/components/layout/Sidebar.jsx`, `frontend/src/lib/permissions.js`,
`frontend/src/App.jsx`, controller di `backend/app/Http/Controllers/`.

| # | Role | Warna bab | Halaman yang di-capture |
|---|---|---|---|
| 01 | Sales | biru `#2563EB` | `/sales/dashboard`, `/attendance`, `/customers`, `/plan-visits`, `/realisasi-visits`, `/create-unplanned-visit`, `/funnels`, `/funnels/:id` |
| 02 | Sales Manager | ungu `#7C3AED` | `/manager/dashboard`, `/customers` (approval), `/plan-visits` (approval), `/realisasi-visits` (approval kunjungan dadakan), `/visit-reports`, `/warnings`, `/funnels` |
| 03 | Site Manager | oranye `#EA580C` | `/site/dashboard`, `/projects`, `/projects/:id` (proyek dari funnel WON + assign engineer), `/documents`, `/reports` |
| 04 | Engineer | teal `#0D9488` | `/engineer/dashboard`, `/engineer/projects`, `/engineer/projects/:id` (material/RAB), `/engineer/progress-reports` |
| 05 | Administrator | hijau `#15803D` | `/dashboard`, `/users` (approve akun), `/admin/attendance-monitor`, `/activity`, plus cuplikan bahwa admin bisa membuka semua modul |

Warna dipakai konsisten di kartu bab, flowchart mini, bingkai highlight, dan penanda bab.

## 5. Alur bisnis untuk flowchart besar (terverifikasi di kode)

1. **Sales** menambah **Customer** → disetujui **Sales Manager** (`CustomerController@approve`, hanya sales_manager/administrator).
2. **Sales** membuat **Plan Visit** → disetujui/ditolak **Sales Manager** (`PlanVisitController@approvePlan/rejectPlan`).
3. **Sales** melakukan **Realisasi Visit** (status `pending → done/missed`). Kunjungan **dadakan (unplanned)** butuh approval Sales Manager (`RealisasiVisitController@approveUnplanned`).
4. Visit yang **terlewat (missed)** otomatis membuat **Peringatan** prioritas tinggi + notifikasi ke Sales dan Sales Manager (`RealisasiVisitController`, ±baris 371–415).
5. **Absensi** Sales dengan GPS/kamera; status `present / late / absent / outside_area / gps_warning / no_gps`.
6. **Sales Funnel**: `prospek → qualified → proposal → negosiasi → closing`, hasil `won / lost`.
7. **Funnel WON → proyek otomatis dibuat** dan diberikan ke Site Manager aktif (atau Administrator bila tidak ada), dalam satu transaksi (`SalesFunnelController@markAsWon`).
8. **Site Manager** mengelola proyek dan **assign Engineer** (`ProjectController@assignEngineer`).
9. **Engineer** mengirim **laporan progress**, material, dokumen, RAB (`EngineerController@submitProgressReport`).
10. Status proyek: `on_track / at_risk / delayed / completed`; Site Manager menandai selesai (`markComplete`).
11. **Administrator** punya semua izin (`can()` → `true`), memantau dashboard, laporan, approve user baru (`pending → approved/rejected`), monitor absensi, log aktivitas.

Detail yang **tidak bisa dipastikan dari kode** tidak akan ditulis di caption.

## 6. Struktur video

Durasi dalam detik (frame = detik × 30).

| # | Scene | Durasi | Isi |
|---|---|---|---|
| 1 | Pembuka | 10 | Nama sistem, satu kalimat masalah, 5 ikon role |
| 2 | Flowchart besar | 30 | Alur §5, muncul bertahap, tiap node diberi warna role pemiliknya |
| 3 | Bab 01 — Sales | 55 | Kartu bab → flowchart mini → screenshot berurutan → kilas balik |
| 4 | Bab 02 — Sales Manager | 50 | idem |
| 5 | Bab 03 — Site Manager | 45 | idem |
| 6 | Bab 04 — Engineer | 40 | idem |
| 7 | Bab 05 — Administrator | 50 | idem |
| 8 | Ringkasan + penutup | 20 | Matriks role × fitur (dari `permissions.js`), penutup |

Total ±300 detik.

### Anatomi tiap bab

1. **Jeda hening** 0,5 dtk lalu **transisi wipe** warna role.
2. **Kartu bab** (4 dtk): nomor besar `02 / 05`, nama role, "Siapa" + "Tugas utama" satu baris.
3. **Flowchart mini** (5–6 dtk): 3–5 langkah kerja role itu.
4. **Scene screenshot** (±5–7 dtk per halaman): screenshot asli di dalam bingkai browser,
   Ken Burns ringan, zoom ke area penting, kotak highlight warna role di elemen asli,
   caption bawah, mis. "Sales Manager menyetujui plan visit".
5. **Kilas balik** (2 dtk): "Sales selesai → data masuk ke Sales Manager".

**Penanda bab** tampil di pojok kanan atas selama bab 01–05: 5 titik berlabel, titik aktif menyala.

## 7. Arsitektur teknis

```
video/
├── package.json            # remotion, @remotion/cli, react, playwright, typescript
├── remotion.config.ts
├── capture/
│   ├── capture.ts          # Playwright: login per role, buka halaman, screenshot + bbox
│   ├── shots.ts            # daftar halaman & selector highlight per role (data saja)
│   └── passwords.ts        # backup / set sementara / restore hash password
├── public/
│   ├── screens/<role>/<shot>.png
│   ├── screens/manifest.json   # ukuran + bounding box elemen highlight per shot
│   └── music.mp3 (opsional)
├── src/
│   ├── Root.tsx            # satu Composition "AmsarDemo"
│   ├── Video.tsx           # merangkai scene dengan <Series>
│   ├── content/roles.ts    # teks, warna, langkah flowchart, urutan shot per role
│   ├── scenes/             # Intro, BigFlowchart, ChapterCard, MiniFlowchart,
│   │                       #   ScreenshotScene, Recap, Matrix, Outro
│   └── components/         # BrowserFrame, Highlight, Caption, ChapterMarker, Wipe, FlowNode
└── out/amsar-demo.mp4      # di-.gitignore
```

- **Konten terpisah dari tampilan**: semua teks/urutan ada di `content/roles.ts`, scene hanya
  merender. Revisi caption tidak menyentuh komponen.
- **Highlight akurat**: `capture.ts` menyimpan `boundingBox()` elemen target ke `manifest.json`;
  `Highlight` membaca posisi itu, bukan koordinat yang ditebak.
- Capture viewport 1920×1080, `deviceScaleFactor` 1, jeda sampai network idle + animasi selesai.

## 8. Data demo

DB lokal saat ini **kosong** (0 proyek, customer, visit, funnel, absensi). Rencana:

- Jalankan seeder yang sudah ada di repo dan memang dibuat untuk kelima akun ini:
  `SalesPerformanceSeeder` (100 customer, plan visit, realisasi, 120 funnel) dan
  `PerformanceProjectSeeder` (proyek untuk Site Manager & Engineer).
- **Langkah ini menambah data ke DB lokal `amsar_dashboard` dan baru dijalankan setelah kamu setuju.**
- Sebelum seeding, DB di-dump ke `video/capture/.backup/amsar_dashboard-before.sql` supaya bisa dikembalikan.
- Teks seeder yang berbau uji (mis. "Skenario status uji: ...") akan terlihat di screenshot detail
  proyek; jika muncul, dilaporkan dulu sebelum diputuskan apakah teksnya dirapikan.

## 9. Penanganan password

1. Simpan `id, password` kelima akun ke `video/capture/.backup/passwords.json` (di-.gitignore).
2. Set password sementara yang sama untuk kelima akun (di-hash dengan bcrypt via `php artisan tinker`).
3. Capture.
4. **Restore** hash asli di blok `finally` — tetap berjalan walau capture gagal.
5. Verifikasi: hash di DB sama persis dengan backup; laporkan hasilnya.

Password sementara tidak ditulis di chat maupun di kode yang di-commit.

## 10. Efek samping & batasan

- Capture hanya **membuka halaman** (tanpa submit form). Login tetap membuat baris
  `activity_logs` dan token Sanctum; token dihapus lewat logout di akhir tiap role.
- Halaman absensi bisa meminta izin kamera/GPS; di-capture dalam keadaan awal tanpa check-in.
- Tidak ada perubahan pada kode `frontend/` atau `backend/`.
- Dependensi (`remotion`, `playwright` + Chromium ±150MB) hanya di dalam `video/`.

## 11. Verifikasi

- Script capture gagal keras (exit ≠ 0) bila halaman error, redirect ke login, atau selector
  highlight tidak ditemukan — tidak ada screenshot kosong yang lolos diam-diam.
- Cek visual: render still frame tiap scene (`npx remotion still`) dan periksa satu per satu.
- Cek konsistensi: setiap caption dicocokkan dengan sumbernya di §5; setiap halaman yang
  disebut ada di sidebar role itu.
- Render final, cek durasi dan ukuran file, tonton sekilas di browser pane.

## 12. Di luar cakupan

- Versi video per role, voiceover/TTS, subtitle bahasa lain.
- Perubahan pada aplikasi itu sendiri.
