# POC Ditajaya: Modul Form Breakdown (design)

Tanggal: 2026-10-19
Sumber: `Prototype Modul Form Breakdown.html` (prototype vanilla JS satu file) dan `PRD Ditajaya Phase 4 (1).pdf` (PRD Draft 7).

## Intent

Prototype HTML sudah menunjukkan alur Form Breakdown lintas role (Teknisi, Purchasing, Sales, Gudang), tapi semuanya satu file dengan data mock di memori. Tujuan POC ini: memindahkan prototype ke code yang rapi (Next.js), dengan logika per role dipisah di kode, supaya bisa didemokan dan jadi dasar kalau POC dilanjutkan.

## Goals

- Semua halaman prototype hidup sebagai app Next.js: Form Breakdown (list, buat, detail dengan stepper, log, comment), Quotation (versi, preview PDF, kirim), Customer Labeling (Organizations), Supplier, notifikasi.
- Satu dashboard dengan tombol switch role di header. Role aktif menentukan menu, tombol aksi, dan banner "giliran siapa".
- Aturan alur PRD tetap ditegakkan oleh logika di server (bukan cuma disembunyikan di UI), mengikuti B11 Hak Akses Ringkas: Purchasing tidak bisa ubah nama/qty, Gudang hanya catat penerimaan, hanya Sales yang putuskan Disetujui/Batal dan buat/kirim quotation, log otomatis dan tidak bisa diedit.
- Kode per role dipisah rapi per folder, supaya gampang dipecah ke RBAC atau area terpisah nanti.
- Tampilan mengikuti prototype.

## Non-goals

- Auth, login, RBAC, penjagaan akses per URL. Switch role hanya pemilih role aktif (disimpan di browser). Ini sengaja, bukan kekurangan.
- Bundling Product (TBC di PRD, hanya placeholder di prototype).
- Email dan notifikasi beneran (WhatsApp, SMTP). Pengiriman quotation dan notifikasi disimulasikan, tampil di UI, dan dicatat di log.
- Database beneran, multi-user real-time, deploy production.

## Anti-goals

- Jangan sampai hanya "tampilan mirip" tapi aturan alur hilang: tiap aturan PRD di atas harus ditegakkan di logika data, bukan cuma di UI.
- Jangan membawa teks/perilaku yang tidak ada di PRD atau prototype sebagai fitur baru.

## Constraints dan keputusan

Keputusan dari user:
- Satu dashboard dengan tombol switch role. Tanpa auth dan tanpa RBAC.
- Simple, ini POC.

Keputusan gue (pilihan builder, belum dikonfirmasi user):
- Next.js (App Router) + TypeScript + Tailwind.
- Penyimpanan: satu file JSON lokal, di-seed dari data mock prototype. Akses lewat satu lapisan data supaya gampang diganti ke DB.
- Aturan alur (state machine status pengajuan, pengadaan, penerimaan, konfirmasi) dikode sebagai fungsi murni yang menerima role aktif, dipakai oleh UI dan oleh server action.

## Diserahkan ke builder

- Struktur folder, pemecahan komponen, dan penamaan.
- Cara pemodelan data dan seed, selama perilaku prototype (angka, status, log, versi quotation) sama.
- Test seperlunya untuk aturan alur dan perhitungan label customer (Active/Non Active, Class A/B/C).

## Rujukan perilaku

Rujukan utama untuk perilaku detail adalah file prototype HTML. Bila prototype dan PRD berbeda, catat perbedaannya dan ikuti prototype untuk tampilan, PRD untuk aturan bisnis.
