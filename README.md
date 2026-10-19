# POC Ditajaya: Modul Form Breakdown

Port prototype HTML Form Breakdown ke Next.js (App Router, TypeScript, Tailwind). Satu app, satu dashboard, dengan tombol switch role di header (Teknisi, Purchasing, Sales, Gudang). Tidak ada auth.

## Menjalankan

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # unit test domain dan store
npm run build
```

## Data

Semua data disimpan di `data/db.json` (di-gitignore) dan di-seed dari data mock prototype. Hapus file itu, atau klik tombol Reset di header, untuk mulai dari awal. Jam aplikasi adalah jam simulasi (mulai 15 Okt 2026 16:10) supaya data seed tetap konsisten.

## Cara kerja role

Role aktif disimpan di cookie `role` (default Sales). Ini hanya pemilih role, bukan auth. Aturan hak akses PRD B11 tetap ditegakkan di server: tiap aksi dicek terhadap role di cookie, dan aksi yang tidak diizinkan ditolak tanpa mengubah data.

## Peta kode

- `src/domain/` logika bisnis murni: `types`, `seed`, `derived` (status turunan, label customer), `permissions`.
- `src/domain/commands/` command per role: `teknisi`, `purchasing`, `sales` (termasuk quotation), `gudang`, ditambah `shared` dan `core`. Command yang gagal melempar `DomainError` dan tidak menyimpan apa pun.
- `src/server/` store file JSON, `runAs`/`run` (menjalankan command sebagai role), server actions.
- `src/roles/<role>/` UI khusus tiap role (kartu, tombol header, modal, server action).
- `src/components/` komponen bersama (shell, kartu detail form, quote, UI dasar).
- `docs/reference/` prototype HTML dan PRD sebagai rujukan.

## Sengaja tidak ada

Auth/login/RBAC, Bundling Product (TBC di PRD), email dan WhatsApp nyata (pengiriman quotation dan notifikasi disimulasikan dan dicatat di log), database sungguhan.

## Perbedaan prototype dan PRD

Daftar asumsi dan titik TBC ada di app: tombol **Asumsi PRD** di header (14 butir).
