import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import { fd, rn } from '@/lib/format'
import { calc } from './derived'
import type { Quote } from './types'

export const quotePdfName = (q: Quote, ver: number): string => `Quotation-${q.number.replace(/\//g, '-')}-v${ver}.pdf`

const W = 595
const H = 842
const M = 48
const INK = rgb(0.1, 0.1, 0.12)
const MUTED = rgb(0.42, 0.42, 0.46)
const LINE = rgb(0.8, 0.8, 0.84)

/** Standard PDF fonts only cover Latin-1: replace anything else so drawText never throws. */
const clean = (s: string) => s.replace(/[\r\t]/g, ' ').replace(/[^\n\x20-\x7e\xa0-\xff—–•]/g, '?')

/**
 * Builds the quotation PDF (PRD D2) from one quote version: customer data, item list
 * (name, qty, unit price, line total), discount, PPN, terms and validity.
 */
export async function buildQuotePdf(o: { quote: Quote; vi: number; cust: string | null; formId: string | null; expired: boolean }): Promise<Uint8Array> {
  const { quote: q, vi, cust, formId, expired } = o
  const v = q.versions[vi]
  const c = calc(v)
  const doc = await PDFDocument.create()
  doc.setTitle(`Quotation ${q.number} v${v.ver}`)
  doc.setAuthor('PT Ditajaya Mitra Perkasa')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page: PDFPage
  let y = 0
  const newPage = () => {
    page = doc.addPage([W, H])
    y = H - M
    if (expired) {
      page.drawText('KEDALUWARSA', { x: 130, y: 330, size: 70, font: bold, color: rgb(0.85, 0.1, 0.1), opacity: 0.18, rotate: degrees(30) })
    }
  }
  const text = (s: string, x: number, size = 10, f: PDFFont = font, color = INK) => page.drawText(clean(s), { x, y, size, font: f, color })
  const right = (s: string, xr: number, size = 10, f: PDFFont = font) => text(s, xr - f.widthOfTextAtSize(clean(s), size), size, f)
  const wrap = (s: string, width: number, size = 10, f: PDFFont = font): string[] => {
    const out: string[] = []
    for (const para of clean(s).split('\n')) {
      let line = ''
      for (const word of para.split(' ')) {
        const next = line ? `${line} ${word}` : word
        if (f.widthOfTextAtSize(next, size) <= width || !line) line = next
        else {
          out.push(line)
          line = word
        }
      }
      out.push(line)
    }
    return out
  }
  const rule = (gap = 6) => {
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.7, color: LINE })
    y -= gap
  }
  const need = (h: number) => {
    if (y - h < M + 30) newPage()
  }

  newPage()
  text('PT. DITAJAYA MITRA PERKASA', M, 15, bold)
  y -= 14
  text('Rukan Grand Aries Niaga, Jl. Taman Aries Blok E1 No. 5R', M, 9, font, MUTED)
  y -= 11
  text('Jakarta Barat 11620 INDONESIA', M, 9, font, MUTED)
  y -= 10
  rule(18)

  const meta: [string, string, string, string][] = [
    ['Kepada', cust || '-', 'No. Penawaran', q.number],
    ['Up.', v.pic || '-', 'Tanggal', fd(v.date)],
    ['Alamat', v.addr || '-', 'Marketing', v.owner],
    ['Perihal', v.subject, 'Versi', `v${v.ver}`],
  ]
  const colR = M + 290
  for (const [a, b, c2, d] of meta) {
    const left = wrap(b, 175)
    const rows = Math.max(left.length, 1)
    need(rows * 13 + 4)
    text(a, M, 10, bold)
    text(':', M + 52)
    left.forEach((l, i) => {
      page.drawText(l, { x: M + 62, y: y - i * 13, size: 10, font, color: INK })
    })
    text(c2, colR, 10, bold)
    text(`: ${d}`, colR + 78)
    y -= rows * 13 + 3
  }
  y -= 8
  text('Dengan hormat, bersama ini kami sampaikan penawaran harga untuk kebutuhan Bapak/Ibu sebagai berikut:', M, 10)
  y -= 22

  // right edges of the numeric columns
  const R = { qty: W - M - 235, price: W - M - 160, disc: W - M - 90, total: W - M - 4 }
  const nameX = M + 26
  const nameW = R.qty - 40 - nameX
  const head = () => {
    need(30)
    page.drawRectangle({ x: M, y: y - 5, width: W - 2 * M, height: 19, color: rgb(0.93, 0.94, 0.96) })
    text('No', M + 4, 9, bold)
    text('Keterangan', nameX, 9, bold)
    right('Qty', R.qty, 9, bold)
    right('Harga/Unit', R.price, 9, bold)
    right('Diskon', R.disc, 9, bold)
    right('Jumlah', R.total, 9, bold)
    y -= 22
  }
  head()
  v.items.forEach((i, k) => {
    const name = wrap(i.name, nameW)
    const h = (name.length - 1) * 12 + 24
    if (y - h < M + 30) {
      newPage()
      head()
    }
    text(String(k + 1), M + 4)
    name.forEach((l, n) => page.drawText(l, { x: nameX, y: y - n * 12, size: 10, font, color: INK }))
    right(String(i.qty), R.qty)
    right(rn(i.price), R.price)
    right(rn(i.disc || 0), R.disc)
    right(rn(Math.max(i.qty * i.price - (i.disc || 0), 0)), R.total)
    y -= h - 10
    rule(10)
  })
  need(70)
  y -= 4
  const sum = (label: string, val: string, f: PDFFont = font) => {
    right(label, R.disc, 10, f)
    right(val, R.total, 10, f)
    y -= 15
  }
  sum('Subtotal', rn(c.sub - c.disc))
  sum('PPN 11%', rn(c.tax))
  sum('TOTAL (IDR)', rn(c.grand), bold)

  y -= 8
  need(120)
  text('Syarat dan kondisi', M, 10, bold)
  y -= 15
  const terms = [`Masa berlaku penawaran sampai ${fd(v.expiry)}`, `Termin pembayaran: ${v.termin || '-'}`, `Estimasi pengiriman: ${v.estimasi || '-'}`]
  if (v.catatan) terms.push(v.catatan)
  terms.forEach((t, i) => {
    const lines = wrap(t, W - 2 * M - 20)
    need(lines.length * 13)
    text(`${i + 1}.`, M + 2)
    lines.forEach((l, n) => page.drawText(l, { x: M + 20, y: y - n * 13, size: 10, font, color: INK }))
    y -= lines.length * 13
  })
  need(80)
  y -= 14
  text('Hormat kami,', M)
  y -= 44
  text(v.owner, M, 10, bold)
  y -= 13
  text('PT Ditajaya Mitra Perkasa', M)

  const pages = doc.getPages()
  pages.forEach((p, i) => {
    p.drawText(clean(`Dibuat otomatis dari ${formId ? `Form Breakdown ${formId}` : 'data quote'}. ${q.number} v${v.ver}`), { x: M, y: 24, size: 8, font, color: MUTED })
    const label = `${i + 1} / ${pages.length}`
    p.drawText(label, { x: W - M - font.widthOfTextAtSize(label, 8), y: 24, size: 8, font, color: MUTED })
  })
  return doc.save()
}
