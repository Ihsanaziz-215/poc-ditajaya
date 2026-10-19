/** PRD assumptions and TBC points, copied from the prototype (proto:881-895). */
export const ASSUME: [string, string][] = [
  ['Channel notifikasi', 'Trigger notifikasi dari PRD B10 disimulasikan di app (lonceng dan toast). Channel in app, email, atau WhatsApp masih TBC.'],
  ['Posisi quotation di alur', 'Quotation dibuat setelah Sales edit harga dan qty, sebelum keputusan Disetujui atau Batal (PRD D, TBC nomor 5).'],
  ['Aturan Tidak Sesuai', 'Form kembali ke Sales untuk direvisi. Aturan detail revisi masih TBC. Di prototype, revisi mengembalikan form ke status Harga Terisi.'],
  ['Class hanya hitung mesin', 'Status Active memakai semua jenis barang, Class hanya mesin (PRD A, TBC).'],
  ['Coret barang oleh Sales', 'Daftar teknisi tetap utuh. Sales mencoret barang yang tidak dibutuhkan customer, barang dicoret tidak ikut dibeli, tidak masuk quotation, dan tidak dihitung di total.'],
  ['Status pengadaan tanpa Dicari', 'Setelah Disetujui, tiap barang berstatus Belum Diproses sampai Purchasing memilih In Stock, Dibeli, atau Indent. Nama "Belum Diproses" adalah usulan.'],
  ['Stock In dari app existing', 'Tampilan Stock In di app live belum dilihat. Modal di prototype adalah placeholder.'],
  ['Labeling di Organizations', 'Status, Class, dan Follow Up jadi kolom di menu Organizations. Tampilan asli menu Organizations belum dilihat.'],
  ['Notifikasi follow up', 'Customer tanpa Activity di bulan berjalan memicu notifikasi ke Sales. Berlaku ke semua customer, termasuk Non Active. Perlu dipastikan.'],
  ['Template quotation', 'Satu template standar perusahaan (PRD D2, TBC). Preview PDF mengacu pada contoh penawaran Ditajaya.'],
  ['PPN', 'PRD D1 menambahkan PPN 11% ke total. Contoh Ditajaya menulis harga excl. PPN. Perlu dipastikan.'],
  ['Field supplier dan field quotation', 'Usulan di PRD, belum final.'],
  ['Field dari form kertas teknisi', 'Data mesin (merk, model, SN/tahun, varian), Part No, Satuan, dan spesifikasi per barang ditambahkan dari form kertas lapangan. Semuanya opsional dan belum ada di PRD B2. Hasil analisa tidak wajib karena form kertas tidak punya kolom itu.'],
  ['Barang datang sebagian', 'Tidak diatur di PRD. Prototype mengizinkan penerimaan per barang dan per qty, status form baru Diterima Baik bila semua barang lengkap.'],
]
