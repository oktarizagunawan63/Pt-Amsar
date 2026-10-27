/**
 * Indonesian display labels for sales funnel values (the API stores the keys).
 * One place for the list, detail and form pages so they always agree.
 */
export const STAGE_LABELS = {
  prospek: 'Prospek',
  qualified: 'Kualifikasi',
  proposal: 'Proposal',
  negosiasi: 'Negosiasi',
  closing: 'Closing',
}

export const PROBABILITY_LABELS = {
  low: 'Rendah',
  middle: 'Sedang',
  high: 'Tinggi',
  very_high: 'Sangat Tinggi',
}

export const STATUS_LABELS = {
  open: 'Berjalan',
  won: 'Menang',
  lost: 'Kalah',
}

export const WON_REASON_LABELS = {
  harga_kompetitif: 'Harga Kompetitif',
  relasi: 'Relasi / Kedekatan dengan Customer',
  spesifikasi: 'Spesifikasi Produk Sesuai',
  after_sales: 'Pelayanan After Sales Baik',
  pengiriman: 'Pengiriman Cepat',
  lainnya: 'Lainnya',
}

export const LOST_REASON_LABELS = {
  kalah_harga: 'Kalah Harga',
  kalah_spesifikasi: 'Kalah Spesifikasi Produk',
  kalah_kompetitor: 'Kalah dari Kompetitor',
  budget_dipotong: 'Budget Customer Dipotong',
  proyek_ditunda: 'Proyek Ditunda',
  customer_batal: 'Customer Tidak Jadi Beli',
  lainnya: 'Lainnya',
}
