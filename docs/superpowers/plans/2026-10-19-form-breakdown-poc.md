# POC Form Breakdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memindahkan prototype HTML Form Breakdown (4 role, Quotation, Customer Labeling, Supplier) menjadi app Next.js dengan switch role tanpa auth, aturan alur PRD ditegakkan di server.

**Architecture:** Logika bisnis ada di `src/domain` sebagai fungsi murni di atas satu objek `Db` (types, derived, commands per role). `src/server/store.ts` menyimpan `Db` di satu file JSON (baca, mutasi serial, tulis atomik). Server action tipis membaca role dari cookie, memanggil command, lalu revalidate. UI mengikuti prototype (CSS dibawa apa adanya) dan kode UI per role dipisah di `src/roles/<role>/`.

**Tech Stack:** Next.js (App Router, versi terbaru dari `create-next-app`), TypeScript, Tailwind, Vitest, npm. Tanpa database, tanpa auth.

**Spec:** `docs/superpowers/specs/2026-10-19-form-breakdown-poc-design.md`. Rujukan perilaku detail: `docs/reference/prototype.html` (disalin di Task 1) dan PRD di `docs/reference/prd-draft-7.pdf`. Nomor baris `proto:NNN` di plan ini merujuk ke `docs/reference/prototype.html`.

## Global Constraints

- Next.js App Router + TypeScript + Tailwind. Penyimpanan: satu file JSON lokal (`data/db.json`, di-gitignore), di-seed dari data mock prototype (`proto:257-353`).
- Tanpa auth, login, RBAC, atau penjagaan akses per URL. Role aktif disimpan di cookie `role` (default `Sales`, seperti prototype).
- Aturan alur PRD B11 ditegakkan di command (server), bukan hanya disembunyikan di UI. Command yang gagal melempar `DomainError` dan tidak menyimpan apa pun.
- Log perubahan otomatis, tidak bisa diedit atau dihapus. Comment tidak masuk log.
- Bundling Product tidak dibuat (tidak ada menu, tidak ada halaman). Email dan notifikasi disimulasikan: tampil di UI dan tercatat di log, tidak ada pengiriman nyata.
- Teks UI memakai bahasa Indonesia persis seperti prototype. Tampilan mengikuti prototype.
- "Hari ini" adalah jam simulasi: `now = clock.sim + (Date.now() - clock.real)`, `clock.sim = new Date(2026, 9, 15, 16, 10)`. Semua perhitungan tanggal (kedaluwarsa quotation, label Active 6 bulan, follow up bulan ini) memakai jam ini.

## Review Focus

Input atau kondisi yang tidak disebut spec tapi paling mungkin kena pengguna, masing-masing punya test di task pemiliknya:

1. Aksi yang sama dikirim dua kali (klik ganda Disetujui, Kirim ke Sales): kedua harus ditolak dengan pesan jelas karena status sudah berubah (Task 5, 6).
2. Role di cookie berbeda dari role yang dipakai halaman saat dirender (tab lama): server menolak dengan `DomainError`, bukan mengeksekusi (Task 9).
3. `data/db.json` hilang, rusak, atau versinya beda: store seed ulang, tidak crash (Task 3).
4. Penerimaan melebihi sisa qty, qty 0 atau pecahan, atau barang yang belum berstatus Dibeli/Indent: ditolak (Task 8).
5. Mengubah quotation yang sudah Terkirim atau mengedit versi lama: edit pada yang terkirim membuat versi baru, versi lama tidak berubah dan tidak bisa diedit (Task 7).

---

### Task 1: Scaffold, rujukan, CSS, format

**Files:**
- Create: project Next.js di root repo (`package.json`, `tsconfig.json`, `src/app/…`), `vitest.config.ts`
- Create: `docs/reference/prototype.html` (salinan `/Users/ihsanaziz/.t3/userdata/attachments/…-html.html`), `docs/reference/prd-draft-7.pdf` (salinan PDF di folder attachments yang sama)
- Create: `src/styles/prototype.css` (isi `<style>` di `proto:9-183`, apa adanya), `src/lib/format.ts`, `src/lib/format.test.ts`
- Modify: `.gitignore` (tambah `/data`), `src/app/layout.tsx` (import `prototype.css`, `lang="id"`, font Inter via `next/font/google`)

**Interfaces:**
- Produces (`src/lib/format.ts`): `fd(d: number|string|Date): string` → `"15 Okt 2026"`; `fdt(d): string` → `"15 Okt 2026 16:10"`; `iso(d): string` → `"2026-10-15"`; `rp(n: number): string` → `"IDR 2,145,000.00"`; `rn(n: number): string` → `"2.145.000"`. Port dari `proto:197-203`. Bulan: `Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des`.

- [ ] **Step 1:** Scaffold dengan `npx create-next-app@latest` (TypeScript, Tailwind, App Router, `src/`, alias `@/*`, npm). Kalau menolak karena folder tidak kosong, scaffold di folder sementara lalu salin, jaga `README.md` dan `assets/` yang sudah ada. Tambah `vitest` sebagai devDependency, script `"test": "vitest run"`, dan alias `@` di `vitest.config.ts`.
- [ ] **Step 2:** Salin kedua file rujukan ke `docs/reference/`, pindahkan CSS prototype ke `src/styles/prototype.css`.
- [ ] **Step 3: Tulis test `format.test.ts`:** `fd(new Date(2026,9,15))==='15 Okt 2026'`, `fdt(new Date(2026,9,15,16,10))==='15 Okt 2026 16:10'`, `iso(new Date(2026,9,5))==='2026-10-05'`, `rp(2145000)==='IDR 2,145,000.00'`, `rp(0)==='IDR 0.00'`, `rn(2145000)==='2.145.000'`, `rn(undefined as never)==='0'`.
- [ ] **Step 4:** Jalankan `npm test`. Expected: FAIL (modul belum ada).
- [ ] **Step 5:** Implement `src/lib/format.ts` sesuai signature di atas.
- [ ] **Step 6:** Jalankan `npm test` dan `npm run build`. Expected: PASS, build sukses.
- [ ] **Step 7: Commit** `chore: scaffold next app, prototype reference, format helpers`

---

### Task 2: Types, seed, derived, permissions

**Files:**
- Create: `src/domain/types.ts`, `src/domain/seed.ts`, `src/domain/derived.ts`, `src/domain/permissions.ts`
- Test: `src/domain/seed.test.ts`, `src/domain/derived.test.ts`, `src/domain/permissions.test.ts`

**Interfaces:**
- Produces `types.ts`: `Role = 'Teknisi'|'Purchasing'|'Sales'|'Gudang'`; `ROLES: Role[]` (urutan itu); `PERSON: Record<Role,string>` (`Ari Dwi`, `Sari`, `Rully`, `Joko`); `FormStatus = 'Draft'|'Diajukan'|'Harga Terisi'|'Disetujui'|'Batal'`; `ProcStatus = 'In Stock'|'Dibeli'|'Indent'|'Perlu Follow Up'`; `Confirmation = 'Menunggu'|'Sesuai'|'Tidak Sesuai'`; `Item {id,name,qty,price,supplier,proc:ProcStatus|null,eta,pnote,good,bad,stock,struck}`; `LogEntry {t,user,role:Role|'—',act,o,n}`; `Comment {t,role,user,text}`; `Form {id,cust,tech,date,analysis,note,items,status,conf,confNote,done,log,comments}`; `Notif {id,roles:Role[],fid:string|null,cid?:string,link?:string,text,t,read:Partial<Record<Role,boolean>>}`; `Supplier {id,name,contact,cats:string[],active}`; `Customer {id,name,pic,email,addr,purchases:{date,type:'mesin'|'sparepart',what,qty}[],acts:{date,what}[]}`; `QuoteItem {iid,name,qty,price,disc}`; `QuoteVersion {ver,date,expiry,subject,desc,owner,pic,email,addr,lead,termin,estimasi,catatan,status:'Belum Dikirim'|'Terkirim'|'Gagal Kirim',sentTo,cc,sentAt:number|null,items}`; `Quote {id,number,formId:string|null,versions}`; `Db {version:1,clock:{sim:number,real:number},seq:{id:number,form:number,quote:number},forms,quotes,suppliers,customers,notifs}`.
- Produces `seed.ts`: `buildSeed(real: number): Db` (murni; `clock.sim = new Date(2026,9,15,16,10).getTime()`). Port data dan log persis dari `proto:257-353`, termasuk 6 form (BD-2610-001…006), 3 quote form (Q3001=F3, Q3002=F4, Q3003=F5) dan 2 quote legacy QL1/QL2. `seq = {id:100+jumlah id terpakai, form:6, quote:3003}`.
- Produces `derived.ts`: `now(db): number`; `today(db): Date` (tengah malam lokal dari `now`); `active(f): Item[]`; `total(f): number`; `calc(v: {items: QuoteItem[]}): {sub,disc,tax,grand}` (`tax = Math.round(max(sub-disc,0)*0.11)`); `isExpired(v, today): boolean`; `remain(i): number`; `allGood(f): boolean`; `procOf(f): ProcStatus|'Belum Diproses'|'—'`; `recvOf(f): 'Belum Diterima'|'Diterima Baik'|'Diterima Rusak'|'Tidak Perlu'|'—'`; `turnOf(f, viewer: Role): {role:Role,text:string}|null` (port `proto:361-373`, termasuk Gudang→Purchasing untuk viewer Sales); `stepOf(f, q?: Quote): {cur:number,stop?:boolean,warn?:boolean}` (`proto:374-386`); `STEPS` (`proto:387`); `labelOf(c, today): {last,cut,active,mesin,cls:'A'|'B'|'C'|'—'}` (`proto:835-840`); `hasFollowUp(c, today): boolean`.
- Produces `permissions.ts`: `canStruct(f, role)`, `canPrice(f, role)`, `canSup(f, role)` (`proto:388-390`).

- [ ] **Step 1: Tulis test** dengan nilai berikut (hari ini simulasi = 2026-10-15):
  - `seed.test.ts`: 6 form, 5 quote, 6 supplier, 8 customer, 8 notif, `seq.quote===3003`, `seq.form===6`; id form berurutan `BD-2610-001…006`, `BD-2609-005` adalah satu-satunya selesai (`done`), form 6 `Batal`.
  - `derived.test.ts`, per form seed (procOf / recvOf / turnOf untuk viewer Sales / stepOf dengan quote-nya): F1 `—`/`—`/Purchasing/cur 1; F2 `—`/`—`/Sales/cur 2; F3 `Perlu Follow Up`/`Diterima Rusak`/Purchasing/cur 4; F4 `Dibeli`/`Diterima Baik`/Teknisi/cur 6; F5 turn `null`/cur 8; F6 turn `null`/`{cur:3,stop:true}`. Tambahan: form Disetujui dengan semua item `Dibeli` dan `good=0` → `turnOf(f,'Teknisi').role==='Gudang'` tapi `turnOf(f,'Sales')` = Purchasing dengan teks `Pengadaan barang sedang berjalan.`; F2 dengan quote `Terkirim` → cur 3.
  - `calc`: Q3001 → sub 2145000, tax 235950, grand 2380950; Q3002 → 3500000/385000/3885000; Q3003 → 4460000/490600/4950600; dengan diskon 100000 pada satu item sub-disc dipakai untuk pajak. `isExpired`: Q3003 true, Q3001 false, Q3002 false.
  - `labelOf` untuk c1…c8: c1 Active B mesin 4; c2 Active A mesin 6; c3 Non Active C mesin 2; c4 Non Active C mesin 1; c5 Active B mesin 3; c6 Active `—` mesin 0; c7 Non Active B mesin 5; c8 Active C mesin 1. `hasFollowUp`: true untuk c1, c5, c6; false untuk c2, c3, c4, c7, c8.
  - `permissions.test.ts`: `canStruct(Draft,Teknisi)` true, `canStruct(Harga Terisi,Sales)` true, `canStruct(Diajukan,Purchasing)` false; `canPrice(Diajukan,Purchasing)` true, `canPrice(Diajukan,Sales)` false, `canPrice(Harga Terisi,Sales)` true; `canSup(Diajukan,Purchasing)` true, `canSup(Harga Terisi,Purchasing)` false.
- [ ] **Step 2:** `npm test`. Expected: FAIL (modul belum ada).
- [ ] **Step 3:** Implement keempat file sesuai Interfaces. `buildSeed` murni dan deterministik (tidak memakai `Date.now()` selain argumen `real`).
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(domain): types, seed data, derived state, permissions`

---

### Task 3: File store

**Files:**
- Create: `src/server/store.ts`
- Test: `src/server/store.test.ts`

**Interfaces:**
- Consumes: `buildSeed`, `Db`.
- Produces: `createStore(path: string): { read(): Promise<Db>; mutate<T>(fn: (db: Db) => T): Promise<T>; reset(): Promise<void> }` dan `store` (singleton di `globalThis` supaya aman terhadap hot reload, path `process.env.DB_PATH ?? 'data/db.json'`). `read` mengembalikan salinan dalam (deep clone). `mutate` menjalankan `fn` pada salinan, menyimpan hanya bila `fn` selesai tanpa melempar, antrean serial dalam proses, tulis atomik (file sementara lalu rename). File hilang, JSON rusak, atau `version !== 1` → seed ulang.

- [ ] **Step 1: Tulis test** (folder temp per test): `read` pertama membuat file berisi 6 form; `mutate(db => { db.forms.pop() })` lalu `read` → 5 form dan file di disk juga 5; `mutate` yang melempar meninggalkan file persis seperti sebelumnya; file diisi `{bad json` → `read` mengembalikan seed tanpa melempar; file dengan `version: 99` → seed ulang; dua `mutate` bersamaan yang masing-masing menaikkan `seq.id` → naik 2; `reset()` mengembalikan seed.
- [ ] **Step 2:** `npm test -- store`. Expected: FAIL.
- [ ] **Step 3:** Implement `store.ts` sesuai Interfaces.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(server): json file store with serialized mutations`

---

### Task 4: Command inti dan role Teknisi

**Files:**
- Create: `src/domain/commands/core.ts`, `src/domain/commands/quoteSync.ts`, `src/domain/commands/shared.ts`, `src/domain/commands/teknisi.ts`
- Test: `src/domain/commands/teknisi.test.ts`, `src/domain/commands/shared.test.ts`

**Interfaces:**
- Produces `core.ts`: `class DomainError extends Error { fields?: Record<string,string> }`; `type Ctx = { role: Role; now: number }`; `type CommandResult = { message?: string; kind?: 'ok'|'info'|'bad'; redirect?: string } | void`; helper `requireRole(ctx, ...roles)` (melempar `DomainError('Aksi ini hanya untuk <roles>')`); `getForm(db, fid)` (melempar bila tidak ada); `addLog(db, ctx, f, act, o?, n?, system?)` (port `proto:394`; `system=true` → user `Sistem`, role `—`); `notify(db, ctx, roles, fid, text)` (port `proto:395`, tanpa toast; kembalikan teks untuk `message`); `nextId(db)`.
- Produces `quoteSync.ts`: `newVersion(db, ctx, q, why): QuoteVersion` dan `syncQuote(db, ctx, f)` (port `proto:399-414`).
- Produces `shared.ts`: `editItem(db, ctx, fid, iid, field: 'name'|'qty'|'price'|'supplier', value: string|number)`, `addItem(db, ctx, fid, {name, qty})`, `deleteItem(db, ctx, fid, iid)`, `addComment(db, ctx, fid, text)`, `markNotifRead(db, ctx, id)`, `markAllNotifsRead(db, ctx)`. Aturan: edit `name`/`qty` hanya bila `canStruct`, `price` hanya `canPrice`, `supplier` hanya `canSup`; qty bilangan bulat ≥ 1 (`Qty minimal 1.`), harga ≥ 0 (`Harga tidak valid.`), nama tidak kosong (`Nama barang tidak boleh kosong.`); nilai sama = no-op tanpa log; label log `Ubah <Nama Barang|Qty|Harga|Supplier> — <nama>` dengan nilai lama/baru (`proto:396-397`); bila role Sales panggil `syncQuote`. `addItem` butuh `canStruct`, log `Tambah barang`. `deleteItem` hanya Teknisi pada Draft dan minimal 1 barang tersisa (`Form harus punya minimal satu barang.`). `addComment` semua role, teks tidak kosong, notif ke tiga role lain `Comment baru dari <Role>: <id>`, tidak masuk log.
- Produces `teknisi.ts`: `createForm(db, ctx, {cust,date,analysis,note,items:{name,qty}[],submit:boolean}): {redirect}` (validasi dan pesan dari `proto:444-462`, `DomainError.fields` berisi kunci `cust|date|analysis|items`; id `BD-<yy><mm>-<seq 3 digit>` dari jam simulasi); `submitDraft(db, ctx, fid)` (`proto:463-467`); `confirmItems(db, ctx, fid, res: 'Sesuai'|'Tidak Sesuai', note: string)` (hanya Teknisi, form Disetujui, `allGood`, belum `done`; Tidak Sesuai wajib catatan `Tulis catatan alasan Tidak Sesuai.`; notifikasi `proto:564-570`); `finishWork(db, ctx, fid)` (hanya bila `conf==='Sesuai'` dan belum `done`).

- [ ] **Step 1: Tulis test** di atas db hasil `buildSeed`: `createForm` oleh Sales ditolak; `createForm` submit tanpa customer/analisa/barang melempar dengan `fields`; draft hanya perlu customer; submit membuat form `BD-2610-007` berstatus Diajukan dengan 2 log (`Buat form` `—`→`Draft`, `Ubah status pengajuan` `Draft`→`Diajukan`) dan 1 notif ke Purchasing `Form Diajukan: BD-2610-007 <cust>`; `editItem` oleh Purchasing pada `name`/`qty` ditolak; qty `0`, `1.5`, harga `-1`, nama `''` ditolak dengan pesan di atas; edit nilai sama tidak menambah log; Gudang tidak bisa edit apa pun; Sales mengubah qty di F2 (Harga Terisi) saat quote sudah `Terkirim` membuat versi 2 dan versi 1 tetap utuh (pakai F3 yang punya Q3001 `Terkirim` setelah dikembalikan ke Harga Terisi secara manual di test); `addComment` menambah 3 notif tanpa log; `confirmItems` Tidak Sesuai tanpa catatan ditolak, dengan catatan men-notif Sales dan Purchasing; `finishWork` sebelum Sesuai ditolak, sesudahnya `done===true` dengan log `Ubah status pekerjaan` `Dikerjakan`→`Selesai`; `confirmItems` pada F3 (belum `allGood`) ditolak.
- [ ] **Step 2:** `npm test -- commands`. Expected: FAIL.
- [ ] **Step 3:** Implement kelima file sesuai Interfaces. Command mengubah `db` yang diberikan; kegagalan = `throw`, jadi store membuang perubahan.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(domain): core commands and teknisi commands`

---

### Task 5: Command Purchasing

**Files:**
- Create: `src/domain/commands/purchasing.ts`
- Test: `src/domain/commands/purchasing.test.ts`

**Interfaces:**
- Consumes: `core.ts`, `derived.ts`, `permissions.ts`.
- Produces: `sendToSales(db, ctx, fid)`, `setProc(db, ctx, fid, iid, v: 'In Stock'|'Dibeli'|'Indent')`, `setProcInfo(db, ctx, fid, iid, key: 'eta'|'pnote', value: string)`, `resolveFollowUp(db, ctx, fid, iid)`, `markAllBought(db, ctx, fid): CommandResult`, `saveSupplier(db, ctx, {id?: string, name, contact, cats: string[], active})`, `toggleSupplier(db, ctx, id)`.
- Aturan: semua hanya Purchasing. `sendToSales` hanya status Diajukan, semua barang wajib `price>0` dan `supplier`, bila tidak `DomainError('Harga dan supplier wajib terisi untuk semua barang.')` dengan `fields` berisi `item:<iid>` untuk yang kurang; sukses → status `Harga Terisi`, log, notif Sales `Harga Terisi: <id> <cust>` (`proto:501-505`). `setProc`/`setProcInfo`/`resolveFollowUp`/`markAllBought` hanya pada form Disetujui yang belum `done`, hanya barang tidak dicoret; `setProc` ditolak bila barang sedang `Perlu Follow Up` (harus lewat `resolveFollowUp`), dan bila `allGood` sesudahnya → notif Teknisi `Barang siap: <id> bisa dikonfirmasi` (`proto:522-534`). `resolveFollowUp` log `Follow up retur selesai — <nama> ×<bad> dikembalikan ke <supplier>`, `bad=0`, `proc='Dibeli'`. `saveSupplier` nama wajib (`Nama supplier wajib diisi.`).

- [ ] **Step 1: Tulis test:** Sales/Teknisi/Gudang memanggil `sendToSales` ditolak; `sendToSales` pada F1 (belum ada harga) ditolak dengan `fields` berisi 8 kunci `item:…`; setelah harga dan supplier diisi lewat `editItem` sukses dan memberi notif Sales; memanggil `sendToSales` kedua kali ditolak (status sudah `Harga Terisi`) (Review Focus 1); `setProc` pada F1 (belum Disetujui) ditolak; `setProc` pada barang `Perlu Follow Up` di F3 ditolak; `resolveFollowUp` di F3 mengembalikan Bearing ke `Dibeli` dengan `bad===0` dan log berformat di atas; `markAllBought` pada form dengan 2 barang tanpa proc menandai keduanya dan mengembalikan pesan `2 barang ditandai Dibeli`, panggilan kedua mengembalikan `Semua barang sudah punya status pengadaan`; `saveSupplier` tanpa nama ditolak, dengan `id` mengubah yang ada, tanpa `id` menambah di depan daftar; `toggleSupplier` oleh Sales ditolak.
- [ ] **Step 2:** `npm test -- purchasing`. Expected: FAIL.
- [ ] **Step 3:** Implement `purchasing.ts` sesuai Interfaces.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(domain): purchasing commands`

---

### Task 6: Command Sales (form)

**Files:**
- Create: `src/domain/commands/sales.ts`
- Test: `src/domain/commands/sales.test.ts`

**Interfaces:**
- Consumes: `core.ts`, `quoteSync.ts`.
- Produces: `toggleStrike(db, ctx, fid, iid)`, `decide(db, ctx, fid, res: 'Disetujui'|'Batal')`, `reviseForm(db, ctx, fid)`. (Command quotation dan follow up ditambahkan ke file ini di Task 7 dan Task 15.)
- Aturan: hanya Sales. `toggleStrike` hanya status Harga Terisi, barang aktif terakhir tidak boleh dicoret (`Minimal satu barang harus tetap aktif.`), log `Coret barang — <nama>` / `Batal coret barang — <nama>` (`Aktif`↔`Dicoret`), lalu `syncQuote`. `decide` hanya dari Harga Terisi, log `Ubah status pengajuan`, notif Purchasing dan Teknisi `<res>: <id> <cust>`. `reviseForm` hanya bila Disetujui, `conf==='Tidak Sesuai'`, belum `done`: status → `Harga Terisi`, `conf` → `Menunggu`, dua entri log (`proto:515-519`).

- [ ] **Step 1: Tulis test:** non-Sales ditolak di ketiganya; `decide(F2,'Disetujui')` mengubah status dan membuat notif untuk Purchasing dan Teknisi; `decide` kedua pada form yang sama ditolak (Review Focus 1); `decide` pada F1 (Diajukan) ditolak; `toggleStrike` pada form 2 barang aktif mencoret satu, mencoret yang kedua ditolak; `toggleStrike` lagi membatalkan coret; barang dicoret tidak masuk `quote.versions.at(-1).items` setelah `syncQuote`; `reviseForm` pada F4 yang `conf` diset `Tidak Sesuai` mengembalikan ke `Harga Terisi` dan `Menunggu` dengan 2 log; `reviseForm` pada F4 ber-`conf` `Menunggu` ditolak.
- [ ] **Step 2:** `npm test -- sales`. Expected: FAIL.
- [ ] **Step 3:** Implement tiga command di `sales.ts`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(domain): sales form commands`

---

### Task 7: Command Quotation

**Files:**
- Modify: `src/domain/commands/sales.ts`
- Test: `src/domain/commands/quotation.test.ts`

**Interfaces:**
- Consumes: `newVersion`, `calc`, `PERSON`.
- Produces: `makeQuote(db, ctx, fid): {redirect: string}`, `setQuoteField(db, ctx, qid, key: 'subject'|'desc'|'owner'|'expiry'|'pic'|'email'|'addr'|'termin'|'estimasi'|'catatan', value: string)`, `setQuoteDiscount(db, ctx, qid, iid, value: number|string)`, `sendQuote(db, ctx, qid, {to, cc, fail}: {to: string; cc: string; fail: boolean}): CommandResult`.
- Aturan: hanya Sales. `makeQuote` hanya bila form berstatus Harga Terisi dan belum punya quote; nomor `DMP/U/2026/X/QT<seq 4 digit>` dari `seq.quote` yang dinaikkan; default versi 1 persis `proto:583-590` (kedaluwarsa hari ini + 14 hari, termin dan estimasi default, data PIC dari customer); log `Buat Quotation v1` `—`→`Belum Dikirim`; hasil `redirect: '/quotes/<id>'`. `setQuoteField`/`setQuoteDiscount` selalu menyunting versi terbaru; bila versi terbaru `Terkirim`, dibuat versi baru lebih dulu (alasan `revisi isi quotation` / `revisi diskon`), nilai sama = no-op; diskon `Math.max(Number(v)||0,0)`. `sendQuote`: email `to` harus lolos `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (`Email tujuan belum valid. Email PIC wajib untuk pengiriman.`); set `sentTo/cc/sentAt`, status `fail ? 'Gagal Kirim' : 'Terkirim'`; log di form terkait `Kirim|Kirim ulang Quotation v<n> ke <to>[ (CC <cc>)]` dengan nilai lama→baru status (kirim ulang bila `sentAt` ada atau status `Gagal Kirim`); quote legacy tanpa `formId` tidak mencatat log. Pesan hasil: `Quotation v<n> terkirim ke <to>` (kind ok) atau `Pengiriman gagal ke <to>. Kirim ulang dari halaman quote.` (kind bad).

- [ ] **Step 1: Tulis test:** `makeQuote(F2)` oleh Sales membuat `Q3004` bernomor `DMP/U/2026/X/QT3004`, kedaluwarsa `2026-10-29`, 7 item aktif; kedua kali ditolak; pada F1 (Diajukan) dan F3 (Disetujui) ditolak; oleh Purchasing ditolak. `sendQuote` dengan email `abc` ditolak dan tidak mengubah status; kirim sukses → `Terkirim` + log `Kirim Quotation v1 ke …`; kirim ulang → log `Kirim ulang …`; `fail:true` → `Gagal Kirim` dan kirim berikutnya berlabel kirim ulang. Review Focus 5: `setQuoteField(Q3001,'termin','x')` (versi 1 `Terkirim`) membuat versi 2 `Belum Dikirim` berisi `x` sementara versi 1 tidak berubah dan log form memuat `Buat Quotation v2 (revisi isi quotation)`; `setQuoteField` kedua pada versi 2 yang belum terkirim tidak membuat versi 3; `setQuoteDiscount(Q3001, iid, -5)` menghasilkan diskon 0; tidak ada fungsi yang menerima indeks versi, jadi versi lama tidak bisa diedit.
- [ ] **Step 2:** `npm test -- quotation`. Expected: FAIL.
- [ ] **Step 3:** Implement keempat command di `sales.ts`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(domain): quotation commands with versioning`

---

### Task 8: Command Gudang dan test alur penuh

**Files:**
- Create: `src/domain/commands/gudang.ts`
- Test: `src/domain/commands/gudang.test.ts`, `src/domain/flow.test.ts`

**Interfaces:**
- Produces: `receive(db, ctx, fid, iid, {date, qty, cond, note}: {date: string; qty: number; cond: 'Baik'|'Rusak'; note: string})`, `receiveAll(db, ctx, fid): CommandResult`.
- Aturan: hanya Gudang, form Disetujui, belum `done`, barang tidak dicoret. `receive` ditolak dengan alasan `Barang dari stok` (In Stock), `Menunggu follow up Purchasing`, `Menunggu Purchasing mengecek barang`, atau `Sudah lengkap` bila barang bukan `Dibeli`/`Indent` atau `remain===0`; tanggal wajib dan qty bilangan bulat ≥ 1 (`Isi tanggal terima dan qty minimal 1.`); `qty > remain` → `Qty melebihi sisa pesanan (<remain>).`. Baik: `good += qty`, `stock += qty`, bila `allGood` notif Teknisi `Barang Diterima Baik: <id> siap dikonfirmasi`. Rusak: `bad += qty`, `proc → 'Perlu Follow Up'` dengan entri log sistem `Ubah status pengadaan — <nama>`, notif Purchasing `Barang Diterima Rusak: <nama> ×<qty> (Supplier <supplier>)`. Log `Stock In <nama> ×<qty> — <cond> (Supplier: <supplier>)[ · <note>]`, nilai baru `<qty> <cond>`. `receiveAll` menerima Baik sisa semua barang `Dibeli`/`Indent` (juga menaikkan `stock`; prototype tidak menaikkannya, ini keputusan builder agar konsisten dengan `receive`), kosong → `Tidak ada barang yang siap diterima (harus berstatus Dibeli atau Indent).`

- [ ] **Step 1: Tulis `gudang.test.ts`:** non-Gudang ditolak; di F3 `receive` Oil filter qty 2 Baik → `good===2`, `stock` naik 2, log berformat benar; `receive` Rusak pada barang `Dibeli` mengubah proc ke `Perlu Follow Up`, ada notif Purchasing dan entri log `Sistem`; Review Focus 4: qty `0`, `1.5`, `99` (melebihi sisa), barang In Stock (Grease), barang `Perlu Follow Up` (Bearing) dan barang proc `null` semuanya ditolak dengan pesan yang sesuai; `receiveAll` di form tanpa barang siap ditolak; di F3 menerima Oil filter dan V-belt sisa saja.
- [ ] **Step 2: Tulis `flow.test.ts`** (satu cerita lewat command, role berganti): Teknisi `createForm` submit 2 barang → Purchasing mengisi harga/supplier lalu `sendToSales` → Sales `makeQuote`, `sendQuote`, `decide Disetujui` → Purchasing `markAllBought` → Gudang `receive` satu barang Rusak, Purchasing `resolveFollowUp`, Gudang menerima ulang dan sisanya Baik → Teknisi `confirmItems Sesuai` lalu `finishWork`. Assert: status akhir `done`, urutan status pengajuan di log, setiap role punya notif sesuai PRD B10, `log` tidak pernah berkurang di antara langkah, dan log tidak memuat entri `Comment`.
- [ ] **Step 3:** `npm test`. Expected: FAIL.
- [ ] **Step 4:** Implement `gudang.ts`.
- [ ] **Step 5:** `npm test`. Expected: PASS semua.
- [ ] **Step 6: Commit** `feat(domain): gudang commands and end-to-end flow test`

---

### Task 9: Server action, role cookie, shell

**Files:**
- Create: `src/lib/role.ts`, `src/server/run.ts`, `src/server/actions/app.ts`, `src/domain/assumptions.ts`, `src/components/ui/{Icon,Badge,PageHead,Modal,ConfirmDialog,Toaster}.tsx`, `src/components/shell/{Shell,Sidebar,Header,RoleSwitcher,Bell,ThemeToggle,ResetButton,AssumptionsModal}.tsx`, `src/app/page.tsx` (redirect `/breakdown`)
- Modify: `src/app/layout.tsx`
- Test: `src/server/run.test.ts`

**Interfaces:**
- Produces `role.ts`: `ROLE_COOKIE = 'role'`; `getRole(): Promise<Role>` (cookie, default `Sales`, nilai tidak valid → `Sales`).
- Produces `run.ts`: `type ActionResult = {ok: true; message?: string; kind?: 'ok'|'info'|'bad'; redirect?: string} | {ok: false; error: string; fields?: Record<string,string>}`; `runAs(role: Role, fn: (db: Db, ctx: Ctx) => CommandResult | void, s = store): Promise<ActionResult>` (murni terhadap cookie, dipakai test; `DomainError` → `{ok:false}`, error lain dilempar ulang); `run(fn): Promise<ActionResult>` (baca role dari cookie, `runAs`, lalu `revalidatePath('/', 'layout')`).
- Produces `actions/app.ts` (`'use server'`): `setRoleAction(role: Role)`, `resetDemoAction()`, `markNotifReadAction(id)`, `markAllNotifsReadAction()`.
- Produces `assumptions.ts`: `ASSUME: [string,string][]` — 14 pasang, salin persis `proto:881-895`.
- UI: `useToast()` (`toast(msg, kind?)`, durasi bad 5200 ms lainnya 3600 ms, `proto:393`), `useAction()` yang menjalankan server action, menampilkan toast dari `ActionResult`, dan mengikuti `redirect`. `ConfirmDialog` meniru `A.ask` (`proto:433-434`). `Shell` meniru `proto:897-910`: sidebar (menu aktif: Quotes, Organizations, Form Breakdown, Data Supplier; menu lain memunculkan toast `Menu <nama> sudah live di app dan tidak dibuat ulang di prototype ini.`), header dengan RoleSwitcher, reset data demo, tombol Asumsi PRD (jumlah `ASSUME.length`), lonceng notifikasi per role (maks 12 terbaru, titik jumlah belum dibaca), tema gelap/terang (`data-theme` di `<html>`, disimpan di `localStorage`), avatar. Bundling tidak ada di sidebar.

- [ ] **Step 1: Tulis `run.test.ts`** dengan store sementara: `runAs('Sales', decide(F2,'Disetujui'))` → `ok:true` dan status berubah; `runAs('Purchasing', decide(...))` pada form lain → `{ok:false}` dan db tidak berubah (Review Focus 2: role di cookie berbeda dari role halaman); dua `runAs` bersamaan dengan command yang sama → satu `ok`, satu `ok:false`; error non-`DomainError` dilempar ulang.
- [ ] **Step 2:** `npm test -- run`. Expected: FAIL.
- [ ] **Step 3:** Implement `role.ts`, `run.ts`, `actions/app.ts`, `assumptions.ts`.
- [ ] **Step 4:** Implement komponen UI dan shell, ubah `layout.tsx` agar membungkus `Shell` + `Toaster`, buat redirect di `src/app/page.tsx`. Port CSS class dan markup dari prototype, jangan menyusun ulang tampilan.
- [ ] **Step 5:** `npm test && npm run build`. Expected: PASS dan build sukses. Jalankan `npm run dev` dan cek `/breakdown`: shell tampil, klik tiap pill role mengganti highlight dan nama avatar, reload tetap di role terakhir, Reset data demo mengembalikan seed, tombol Asumsi PRD membuka tabel 14 baris, lonceng Sales menampilkan notif follow up customer.
- [ ] **Step 6: Commit** `feat: server actions, role switcher shell, notifications bell`

---

### Task 10: Daftar Form Breakdown dan Buat Form

**Files:**
- Create: `src/domain/listing.ts`, `src/app/breakdown/page.tsx`, `src/app/breakdown/new/page.tsx`, `src/roles/teknisi/NewForm.tsx`, `src/roles/teknisi/actions.ts`
- Test: `src/domain/listing.test.ts`

**Interfaces:**
- Produces `listing.ts`: `filterForms(forms: Form[], opts: {q?: string; status?: string; mine?: boolean}, role: Role): Form[]` (pencarian pada `id + ' ' + cust` huruf kecil, `status` mencocokkan `Form.status`, `mine` memakai `turnOf(f, role)?.role === role`; port `proto:637-640`).
- Produces `roles/teknisi/actions.ts` (`'use server'`): `createFormAction(input)` yang membungkus `createForm` lewat `run`.
- Halaman: `/breakdown` meniru `proto:637-651` (filter lewat `searchParams` `q`, `lst`, `mine`; kolom, badge, tombol Buat Form, empty state `Tidak ada form yang cocok dengan filter.`; kolom Penerimaan disembunyikan untuk Sales). `/breakdown/new` meniru `proto:652-670`: untuk selain Teknisi tampil banner `Form baru hanya bisa dibuat oleh Teknisi` dengan tombol `Masuk sebagai Teknisi` (memanggil `setRoleAction`); untuk Teknisi form dengan tombol Simpan draft dan Ajukan form, galat per field dari `fields`, toast, lalu redirect ke detail.

- [ ] **Step 1: Tulis test `filterForms`:** tanpa opsi 6 form; `q: 'dunia'` → hanya BD-2610-002; `q: 'bd-2610-00'` hampir semua; `status: 'Disetujui'` → F3 dan F4 dan F5; `mine` untuk Purchasing → F1 dan F3; `mine` untuk Teknisi → F4; kombinasi tanpa hasil → `[]`.
- [ ] **Step 2:** `npm test -- listing`. Expected: FAIL. Implement `listing.ts`, jalankan lagi. Expected: PASS.
- [ ] **Step 3:** Implement kedua halaman dan `NewForm`.
- [ ] **Step 4:** `npm run build`. Di browser: sebagai Teknisi buat form dengan satu barang kosong dan Ajukan → galat per field; isi lengkap dan Ajukan → redirect ke detail (404 sementara sampai Task 11 selesai, itu wajar); sebagai Purchasing, `/breakdown` kini memuat form baru di kolom Giliran Purchasing; sebagai Sales `/breakdown/new` menampilkan banner penolakan.
- [ ] **Step 5: Commit** `feat: form breakdown list and create form`

---

### Task 11: Detail Form Breakdown (bagian bersama)

**Files:**
- Create: `src/app/breakdown/[id]/page.tsx`, `src/components/breakdown/{Banner,Stepper,InfoCard,StatusChips,ItemsCard,CommentsCard,LogCard}.tsx`, `src/server/actions/shared.ts`

**Interfaces:**
- Consumes: `turnOf`, `stepOf`, `procOf`, `recvOf`, `canStruct/canPrice/canSup`, `editItem/addItem/deleteItem/toggleStrike/addComment`.
- Produces `actions/shared.ts` (`'use server'`): `editItemAction(fid, iid, field, value)`, `addItemAction(fid, {name, qty})`, `deleteItemAction(fid, iid)`, `toggleStrikeAction(fid, iid)`, `addCommentAction(fid, text)`.
- Produces: halaman detail menyusun, berurutan, kepala (judul `<id> · <cust>`, slot aksi header), `Banner` (`proto:695-699`), kartu status + `Stepper` (`proto:672-681`, Sales tidak melihat langkah Penerimaan), `InfoCard` (`proto:766`), `ItemsCard` (`proto:700-715`, sel edit hanya bila `canStruct`/`canPrice`/`canSup` untuk role aktif, Sales mencoret bukan menghapus, pilihan supplier hanya yang aktif atau yang sedang dipakai), `CommentsCard`, `LogCard` (urut terbaru di atas, Sales tidak melihat entri berawalan `Stock In`). Slot untuk kartu pengadaan, penerimaan, konfirmasi, quotation dan aksi header diisi di Task 12 dan 14. Form tak ditemukan → `Form tidak ditemukan` seperti `proto:684`.

- [ ] **Step 1:** Implement actions dan komponen. Semua edit lewat `useAction`; hapus barang memakai `ConfirmDialog` (`proto:496`).
- [ ] **Step 2:** `npm run build`. Di browser: sebagai Purchasing di BD-2610-007 (form hasil Task 10) harga dan supplier bisa diisi, nama/qty read-only dengan hint `Purchasing hanya mengisi harga dan supplier. Nama dan qty barang tidak bisa diubah.`; sebagai Sales di BD-2610-002 coret barang bekerja dan coret barang terakhir ditolak toast `Minimal satu barang harus tetap aktif.`; kirim comment memunculkan notif di lonceng role lain; log Sales pada BD-2610-003 tidak memuat `Stock In`.
- [ ] **Step 3: Commit** `feat: form breakdown detail shared sections`

---

### Task 12: Panel Purchasing dan Gudang di detail

**Files:**
- Create: `src/roles/purchasing/{ProcurementCard,SendToSalesButton}.tsx`, `src/roles/purchasing/actions.ts`, `src/roles/gudang/{ReceivingCard,ReceiveModal}.tsx`, `src/roles/gudang/actions.ts`
- Modify: `src/app/breakdown/[id]/page.tsx`

**Interfaces:**
- Produces: `roles/purchasing/actions.ts` (`sendToSalesAction`, `setProcAction`, `setProcInfoAction`, `resolveFollowUpAction`, `markAllBoughtAction`), `roles/gudang/actions.ts` (`receiveAction`, `receiveAllAction`) — semua membungkus command lewat `run`.
- `ProcurementCard({form, role})` meniru `proto:716-724` (tampil bila status Disetujui; hanya Purchasing yang bisa mengubah, tombol `Tandai semua Dibeli`, `Selesai follow up`, tanggal estimasi dan catatan). `SendToSalesButton` tampil di slot aksi header bila Purchasing dan status Diajukan; galat `fields` `item:<iid>` menandai baris yang kurang (`proto:503`). `ReceivingCard({form, role})` meniru `proto:725-735` (tidak dirender untuk Sales; tombol Stock In nonaktif dengan `title` alasan; `Stock In semua (Baik)` hanya Gudang) dan `ReceiveModal` meniru `proto:916-921`.

- [ ] **Step 1:** Implement kedua folder role dan sambungkan ke halaman detail.
- [ ] **Step 2:** `npm run build`. Di browser: sebagai Purchasing di BD-2610-007 (Diajukan, hasil Task 10) isi harga dan supplier lalu `Kirim ke Sales` → status `Harga Terisi`, kolom Giliran jadi Sales. Lalu pakai form seed BD-2610-003: sebagai Purchasing klik `Selesai follow up` pada Bearing → status `Dibeli`; sebagai Gudang `Stock In` Bearing qty 2 Baik → Penerimaan jadi `Diterima Baik`; coba qty 99 → pesan `Qty melebihi sisa pesanan (2).`; sebagai Sales kartu Penerimaan tidak ada.
- [ ] **Step 3: Commit** `feat: purchasing and gudang panels on form detail`

---

### Task 13: Halaman Quotes

**Files:**
- Create: `src/app/quotes/page.tsx`, `src/app/quotes/[id]/page.tsx`, `src/components/quote/{QuoteDocument,PreviewModal,SendQuoteModal,QuoteEditor,VersionBar}.tsx`, `src/roles/sales/actions.ts`

**Interfaces:**
- Produces `roles/sales/actions.ts` (`'use server'`): `makeQuoteAction`, `setQuoteFieldAction`, `setQuoteDiscountAction`, `sendQuoteAction`. File ini diisi bertahap: `decideAction` dan `reviseFormAction` ditambah di Task 14, `recordFollowUpAction` di Task 15. `toggleStrikeAction` ada di `server/actions/shared.ts` (Task 11).
- `/quotes` meniru `proto:771-780` (pencarian `q` lewat `searchParams`, kolom Versi/Status Kirim/Form Breakdown, badge Kedaluwarsa, tombol Create Quote memunculkan toast `proto:774`). `/quotes/[id]` meniru `proto:782-818` (versi lewat `?v=`, tab lewat `?tab=info|items`, versi lama hanya baca, hanya Sales pada versi terbaru yang bisa mengedit, banner `Versi ini sudah terkirim`, riwayat versi). `QuoteDocument` meniru `proto:820-832` (stempel KEDALUWARSA). `SendQuoteModal` meniru `proto:924-932` (Subject dan Isi email dapat diedit tapi tidak disimpan, kotak `Simulasikan Gagal Kirim`).

- [ ] **Step 1:** Implement halaman, komponen, dan action. Edit field memakai `onBlur`/`onChange` ke `setQuoteFieldAction`; tombol `Save Quote` hanya toast `Quote disimpan.`.
- [ ] **Step 2:** `npm run build`. Di browser: sebagai Sales buka Q3001, ubah Termin → muncul v2 dan banner/riwayat berubah, v1 hanya bisa dilihat dengan isi lama; Preview PDF menampilkan total `2.380.950` di versi 1; kirim dengan email `abc` ditolak, dengan `Simulasikan Gagal Kirim` status `Gagal Kirim` lalu kirim ulang `Terkirim`; sebagai Purchasing semua input nonaktif dengan banner `Hanya Sales yang bisa membuat dan mengirim quotation`; Q3003 dan Q-LIVE tampil `Kedaluwarsa`.
- [ ] **Step 3: Commit** `feat: quotes list, editor, preview and send`

---

### Task 14: Panel Teknisi dan Sales di detail

**Files:**
- Create: `src/roles/teknisi/{ConfirmationCard,SubmitDraftButton,FinishButton}.tsx`, `src/roles/sales/{QuotationCard,DecisionButtons,ReviseButton}.tsx`, `src/roles/index.tsx`
- Modify: `src/roles/teknisi/actions.ts`, `src/roles/sales/actions.ts`, `src/app/breakdown/[id]/page.tsx`

**Interfaces:**
- Produces `roles/index.tsx`: `headerActionsFor(role: Role, form: Form, quote?: Quote): ReactNode` yang memilih tombol header per role sesuai `proto:688-693` (Teknisi: Ajukan form pada Draft, Kerjakan breakdown bila `conf==='Sesuai'`; Purchasing: Kirim ke Sales; Sales: Batal/Disetujui pada Harga Terisi, Revisi form pada Tidak Sesuai), dengan konfirmasi `ConfirmDialog` untuk keputusan dan revisi (`proto:508-518`) dan tombol Kerjakan breakdown (`proto:571`).
- `ConfirmationCard({form, role})` meniru `proto:736-743` (tampil bila `allGood`; hanya Teknisi yang bisa mengonfirmasi; textarea catatan wajib untuk Tidak Sesuai). `QuotationCard({form, quote, role})` meniru `proto:744-756` (Buat Quotation hanya Sales pada Harga Terisi tanpa quote; Buka quote, Preview PDF, Kirim email memakai komponen Task 13).

- [ ] **Step 1:** Implement dan sambungkan ke halaman detail lewat `headerActionsFor`.
- [ ] **Step 2:** `npm run build`. Di browser, jalankan alur utuh dengan UI: Teknisi Ajukan form baru → Purchasing isi harga/supplier dan Kirim ke Sales → Sales Buat Quotation, kirim email, Disetujui (konfirmasi) → Purchasing Tandai semua Dibeli → Gudang Stock In semua (Baik) → Teknisi konfirmasi Tidak Sesuai tanpa catatan ditolak, dengan catatan sukses → Sales Revisi form → status kembali Harga Terisi → bandingkan log dengan cerita `flow.test.ts`.
- [ ] **Step 3: Commit** `feat: teknisi and sales panels, header actions per role`

---

### Task 15: Organizations (Customer Labeling) dan Data Supplier

**Files:**
- Create: `src/app/organizations/page.tsx`, `src/app/suppliers/page.tsx`, `src/roles/purchasing/SupplierModal.tsx`, `src/roles/sales/FollowUpButton.tsx`
- Modify: `src/domain/commands/sales.ts` (tambah `recordFollowUp`), `src/server/actions/shared.ts` atau `src/roles/sales/actions.ts` (tambah action)
- Test: `src/domain/commands/followup.test.ts`

**Interfaces:**
- Produces: `recordFollowUp(db, ctx, cid)` — hanya Sales; menambah activity `{date: iso(today(db)), what: 'Follow up (demo)'}` dan menghapus notif dengan `cid` itu (`proto:430`); `recordFollowUpAction(cid)`.
- `/organizations` meniru `proto:842-858` (filter `q`, status, class, follow up lewat `searchParams`; banner jumlah belum follow up; baris bisa dibuka menampilkan riwayat pembelian dan activities; kolom Status, Class, Total Mesin, Pembelian Terakhir dihitung otomatis lewat `labelOf`, tidak ada kontrol edit). `/suppliers` meniru `proto:861-872` dan `proto:933-934` (hanya Purchasing yang bisa tambah, edit, nonaktifkan; role lain tombol nonaktif dengan hint `Akses penuh hanya untuk Purchasing. Role <Role> hanya melihat.`).

- [ ] **Step 1: Tulis test:** `recordFollowUp` oleh Purchasing ditolak; oleh Sales pada c2 menambah activity bertanggal `2026-10-15`, menghapus notif `Belum follow up bulan ini: PT Dunia Mega Raya`, dan `hasFollowUp(c2, today)` menjadi true; pada customer yang sudah follow up tetap sukses tanpa duplikasi notif.
- [ ] **Step 2:** `npm test -- followup`. Expected: FAIL. Implement command, jalankan lagi. Expected: PASS.
- [ ] **Step 3:** Implement kedua halaman dan komponen.
- [ ] **Step 4:** `npm run build`. Di browser: `/organizations` menampilkan label yang sama dengan tabel di Task 2 (c1 Active Class B, c3 Non Active Class C, c6 Active `—`); filter Non Active + Class C → c3 dan c4; Sales klik `Catat follow up` pada PT Dunia Mega Raya → baris jadi `Sudah`, banner turun menjadi 4; `/suppliers` sebagai Purchasing tambah supplier tanpa nama ditolak, nonaktifkan CV Sumber Teknik Udara → di form Diajukan tidak muncul di pilihan supplier.
- [ ] **Step 5: Commit** `feat: organizations labeling and supplier master`

---

### Task 16: README dan penelusuran akhir

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Tulis README singkat (Bahasa Indonesia): cara menjalankan (`npm install`, `npm run dev`, `npm test`), lokasi data (`data/db.json`, hapus file atau tombol Reset untuk mulai ulang), cara kerja switch role (cookie, tanpa auth), peta kode per role (`src/roles/*`, `src/domain/commands/*`), daftar yang sengaja tidak ada (auth, Bundling, email nyata), dan tautan ke tabel asumsi di app (tombol Asumsi PRD) sebagai daftar perbedaan prototype dan PRD.
- [ ] **Step 2:** Jalankan `npm test && npm run build && npm run lint`. Expected: semua lulus.
- [ ] **Step 3:** Hapus `data/db.json`, jalankan `npm run dev`, dan telusuri satu kali empat role di enam form seed: tiap form tampil di status yang sama dengan prototype (F1 Diajukan, F2 Harga Terisi, F3 Disetujui dengan barang rusak, F4 siap konfirmasi, F5 Selesai, F6 Batal), nomor, total, dan label Active/Class sama dengan yang diuji di Task 2.
- [ ] **Step 4: Commit** `docs: readme and final walkthrough`

---

## Self-Review

- **Spec coverage:** semua halaman prototype (Form Breakdown list/buat/detail/stepper/log/comment, Quotation, Organizations, Supplier, notifikasi) → Task 9–15; switch role tanpa auth → Task 9; aturan server-side B11 → Task 4–8 dan 9; kode per role terpisah → `src/domain/commands/*` dan `src/roles/*`; penyimpanan JSON dari seed → Task 2–3; email/notif simulasi → Task 7, 9, 13; Bundling dilewati → Global Constraints; tampilan mengikuti prototype → Task 1 (CSS) dan tiap task UI; jam simulasi → Global Constraints dan Task 2.
- **Konsistensi nama:** `DomainError`, `Ctx`, `CommandResult`, `runAs`/`run`, `ActionResult`, `createStore`/`store`, `newVersion`/`syncQuote`, `turnOf(f, viewer)`, `labelOf(c, today)` dipakai sama di semua task. `toggleStrikeAction` didefinisikan di `server/actions/shared.ts` (Task 11) dan dipakai Task 14; `roles/sales/actions.ts` (Task 13) hanya memuat action quotation lalu menerima `decideAction`, `reviseFormAction` di Task 14 dan `recordFollowUpAction` di Task 15.
- **Review Focus:** lima butir punya test di Task 3, 5/6, 7, 8, 9.
- **Proporsi:** plan memutuskan nama, signature, nilai dan aturan; badan fungsi dan markup tidak ditulis ulang, dirujuk ke `proto:NNN`.
