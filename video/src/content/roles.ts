import type { Role, RoleId } from './types.ts';

// Every caption here must trace back to spec §5 or to something visible on the captured page.
// Highlight locators are checked against the live app by capture/capture.ts (it fails if one
// doesn't resolve to a visible element).

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasClass = (name: string): string => `contains(concat(" ", normalize-space(@class), " "), " ${name} ")`;
// The app's panels are either Tailwind `rounded-*` boxes or its own `.card` / `.project-card` classes.
const CONTAINER = `ancestor::*[contains(@class, "rounded") or ${hasClass('card')} or ${hasClass('project-card')}][1]`;

/** Locator for the nearest card/panel around the first visible element with this text. */
const card = (text: string, partial = false): string =>
  `main >> text=${partial ? `/${escapeRegex(text)}/` : `"${text}"`} >> visible=true >> nth=0 >> xpath=${CONTAINER}`;

export const ROLES: Role[] = [
  {
    id: 'sales',
    number: '01',
    name: 'Sales',
    color: '#2563EB',
    who: 'Tim lapangan',
    mainTask: 'Kunjungi customer dan cetak deal',
    flow: ['Absen dengan GPS & foto', 'Tambah customer', 'Rencanakan & lakukan kunjungan', 'Kelola funnel sampai deal'],
    recap: 'Data kunjungan & funnel → Sales Manager',
    durationSec: 55,
    menu: ['Dashboard', 'Customer', 'Plan Visit', 'Realisasi Visit', 'Laporan Visit', 'Sales Funnel', 'Absensi'],
    shots: [
      { id: 'dashboard', route: '/sales/dashboard', caption: 'Dashboard pribadi: target, jadwal kunjungan, dan customer', highlight: card('Target bulan ini') },
      { id: 'attendance', route: '/attendance', caption: 'Absensi harian dengan GPS dan foto', highlight: card('Lokasi Check-in Hari Ini') },
      { id: 'customers', route: '/customers', caption: 'Sales menambah customer baru (disetujui Sales Manager)', highlight: 'role=button[name="Tambah Customer"]' },
      { id: 'plan-visits', route: '/plan-visits', caption: 'Rencana kunjungan ke customer', highlight: 'role=button[name="Tambah Plan Visit"]' },
      { id: 'realisasi', route: '/realisasi-visits', caption: 'Realisasi kunjungan: mulai visit atau tandai terlewat', highlight: 'xpath=(//main//button[contains(., "Mulai Visit")])[1]/ancestor::tr[1]' },
      { id: 'unplanned', route: '/create-unplanned-visit', caption: 'Kunjungan dadakan, menunggu persetujuan manager', highlight: card('2. Detail Kunjungan') },
      { id: 'funnels', route: '/funnels', caption: 'Sales funnel: prospek → qualified → proposal → negosiasi → closing', highlight: 'xpath=(//main//table)[1]' },
      { id: 'funnel-detail', route: '/funnels/:id', caption: 'Deal WON tercatat lengkap: nilai, alasan, dan tanggal', highlight: card('Deal Menang!') },
    ],
  },
  {
    id: 'sales_manager',
    number: '02',
    name: 'Sales Manager',
    color: '#7C3AED',
    who: 'Pemimpin tim sales',
    mainTask: 'Menyetujui, memantau, dan menjaga target',
    flow: ['Setujui customer & rencana kunjungan', 'Setujui kunjungan dadakan', 'Pantau laporan & peringatan', 'Pantau funnel tim'],
    recap: 'Deal WON → proyek otomatis ke Site Manager',
    durationSec: 50,
    menu: ['Dashboard', 'Customer', 'Plan Visit', 'Realisasi Visit', 'Laporan Visit', 'Peringatan', 'Sales Funnel', 'Absensi'],
    shots: [
      { id: 'dashboard', route: '/manager/dashboard', caption: 'Kinerja tim dan kunjungan yang menunggu persetujuan', highlight: card('Menunggu persetujuan') },
      { id: 'customers', route: '/customers', caption: 'Melihat dan mengelola customer seluruh tim', highlight: 'xpath=(//main//table)[1]' },
      { id: 'plan-visits', route: '/plan-visits', caption: 'Memantau rencana kunjungan tim per status', highlight: 'main >> text=/Belum Direalisasi/ >> visible=true >> nth=0 >> xpath=..' },
      { id: 'realisasi', route: '/realisasi-visits', caption: 'Antrian persetujuan kunjungan dadakan', highlight: 'main >> text=/Unplanned Approval/ >> visible=true >> nth=0' },
      { id: 'visit-reports', route: '/visit-reports', caption: 'Laporan kunjungan tim per periode, bisa diekspor', highlight: card('Data Per Periode') },
      { id: 'warnings', route: '/warnings', caption: 'Peringatan otomatis saat kunjungan terlewat', highlight: 'main >> article >> nth=0' },
      { id: 'funnels', route: '/funnels', caption: 'Memantau funnel seluruh tim', highlight: 'xpath=(//main//table)[1]' },
    ],
  },
  {
    id: 'site_manager',
    number: '03',
    name: 'Site Manager',
    color: '#EA580C',
    who: 'Penanggung jawab proyek',
    mainTask: 'Kelola proyek dan tugaskan engineer',
    flow: ['Terima proyek dari deal WON', 'Tugaskan engineer', 'Pantau status & dokumen', 'Tandai proyek selesai'],
    recap: 'Proyek ditugaskan → Engineer',
    durationSec: 45,
    menu: ['Dashboard', 'Proyek', 'Dokumen', 'Laporan'],
    shots: [
      { id: 'dashboard', route: '/site/dashboard', caption: 'Kesehatan semua proyek: tepat waktu, berisiko, terlambat', highlight: card('Proyek berjalan') },
      { id: 'projects', route: '/projects', caption: 'Daftar proyek, termasuk yang otomatis dibuat dari deal WON', highlight: card('[FUNNEL]', true) },
      { id: 'project-detail', route: '/projects/:id', caption: 'Site Manager menugaskan engineer dan merencanakan material', highlight: card('Material Terpasang') },
      { id: 'documents', route: '/documents', caption: 'Dokumen proyek terpusat', highlight: card('Surat Perintah Kerja', true) },
      { id: 'reports', route: '/reports', caption: 'Laporan & analitik: progress dan RAB per proyek', highlight: card('Progress per Proyek (%)') },
    ],
  },
  {
    id: 'engineer',
    number: '04',
    name: 'Engineer',
    color: '#0D9488',
    who: 'Pelaksana di lapangan',
    mainTask: 'Kerjakan proyek dan laporkan progress',
    flow: ['Lihat proyek yang ditugaskan', 'Catat material & RAB', 'Kirim laporan progress'],
    recap: 'Progress & dokumen → dipantau Administrator',
    durationSec: 40,
    menu: ['Dashboard', 'Proyek Saya', 'Laporan Progress'],
    shots: [
      { id: 'dashboard', route: '/engineer/dashboard', caption: 'Ringkasan proyek yang ditugaskan', highlight: card('Proyek saya') },
      { id: 'projects', route: '/engineer/projects', caption: 'Hanya proyek yang di-assign ke engineer ini', highlight: card('Daftar Proyek') },
      { id: 'project-detail', route: '/engineer/projects/:id', caption: 'Material terpasang dan RAB proyek', highlight: card('Material Terpasang') },
      { id: 'progress', route: '/engineer/progress-reports', caption: 'Riwayat laporan progress lengkap dengan foto', highlight: card('Riwayat Laporan') },
    ],
  },
  {
    id: 'administrator',
    number: '05',
    name: 'Administrator',
    color: '#15803D',
    who: 'Manajemen perusahaan',
    mainTask: 'Memantau dan mengatur seluruh sistem',
    flow: ['Pantau dashboard perusahaan', 'Setujui akun & atur role', 'Pantau absensi', 'Telusuri log aktivitas'],
    recap: 'Semua data dalam satu dashboard',
    durationSec: 50,
    menu: [
      'Dashboard', 'Proyek', 'Dokumen', 'Laporan', 'Customer', 'Plan Visit', 'Realisasi Visit', 'Laporan Visit',
      'Peringatan', 'Sales Funnel', 'Manajemen User', 'Monitor Absensi', 'Log Aktivitas',
    ],
    shots: [
      { id: 'dashboard', route: '/dashboard', caption: 'Ringkasan perusahaan dan hal yang perlu perhatian', highlight: card('Perlu perhatian') },
      { id: 'users', route: '/users', caption: 'Kelola semua akun dan role pengguna', highlight: 'xpath=(//main//tr[contains(., "Fajar Nugroho")])[1]' },
      { id: 'attendance-monitor', route: '/admin/attendance-monitor', caption: 'Memantau absensi semua karyawan', highlight: card('Data Kehadiran', true) },
      { id: 'activity', route: '/activity', caption: 'Log aktivitas: siapa melakukan apa, kapan', highlight: 'xpath=(//main//table)[1]' },
      { id: 'all-access', route: '/dashboard', caption: 'Akses penuh ke semua modul', highlight: 'nav' },
    ],
  },
];

/** The 11 steps of spec §5; each node is drawn in the color of the role that owns it. */
export const BIG_FLOW: { label: string; role: RoleId }[] = [
  { label: 'Sales menambah customer', role: 'sales' },
  { label: 'Manager menyetujui customer & visit', role: 'sales_manager' },
  { label: 'Kunjungan dengan GPS & foto', role: 'sales' },
  { label: 'Terlewat → peringatan otomatis', role: 'sales_manager' },
  { label: 'Absensi harian GPS & foto', role: 'sales' },
  { label: 'Funnel: prospek → closing', role: 'sales' },
  { label: 'Deal WON → proyek dibuat otomatis', role: 'site_manager' },
  { label: 'Site Manager menugaskan engineer', role: 'site_manager' },
  { label: 'Engineer lapor progress & material', role: 'engineer' },
  { label: 'Status: on track → completed', role: 'site_manager' },
  { label: 'Administrator memantau semuanya', role: 'administrator' },
];
