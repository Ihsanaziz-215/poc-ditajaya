import { calc } from '@/domain/derived'
import type { Quote } from '@/domain/types'
import { fd, rn } from '@/lib/format'

/** Simulated PDF of the quotation (proto:820-832). */
export function QuoteDocument({ quote: q, vi, cust, formId }: { quote: Quote; vi: number; cust: string | null; formId: string | null }) {
  const v = q.versions[vi]
  const c = calc(v)
  return (
    <div className="paper">
      <div className="hd">
        <div className="lg">dp</div>
        <div>
          <h2>PT. DITAJAYA MITRA PERKASA</h2>
          <div>Rukan Grand Aries Niaga, Jl. Taman Aries Blok E1 No. 5R<br />Jakarta Barat 11620 INDONESIA</div>
        </div>
      </div>
      <div className="meta">
        <div><b>Kepada</b> : {cust || '—'}</div><div><b>No. Penawaran</b> : {q.number}</div>
        <div><b>Up.</b> : {v.pic || '—'}</div><div><b>Tanggal</b> : {fd(v.date)}</div>
        <div><b>Alamat</b> : {v.addr || '—'}</div><div><b>Marketing</b> : {v.owner}</div>
        <div><b>Perihal</b> : {v.subject}</div><div><b>Versi</b> : v{v.ver}</div>
      </div>
      <div>Dengan hormat, bersama ini kami sampaikan penawaran harga untuk kebutuhan Bapak/Ibu sebagai berikut:</div>
      <table>
        <thead><tr><th>No</th><th>Keterangan</th><th className="r">Qty</th><th className="r">Harga/Unit</th><th className="r">Diskon</th><th className="r">Jumlah</th></tr></thead>
        <tbody>
          {v.items.map((i, k) => (
            <tr key={i.iid}>
              <td>{k + 1}</td><td>{i.name}{i.partNo && <div style={{ color: '#777', fontSize: 11 }}>Part No: {i.partNo}</div>}</td><td className="r">{i.qty}{i.unit ? ` ${i.unit}` : ''}</td><td className="r">{rn(i.price)}</td><td className="r">{rn(i.disc || 0)}</td>
              <td className="r">{rn(Math.max(i.qty * i.price - (i.disc || 0), 0))}</td>
            </tr>
          ))}
          <tr><td colSpan={5} className="r">Subtotal</td><td className="r">{rn(c.sub - c.disc)}</td></tr>
          <tr><td colSpan={5} className="r">PPN 11%</td><td className="r">{rn(c.tax)}</td></tr>
          <tr><td colSpan={5} className="r"><b>TOTAL</b></td><td className="r"><b>{rn(c.grand)}</b></td></tr>
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <b>Syarat dan kondisi</b>
        <ol>
          <li>Termin pembayaran: {v.termin || '—'}</li>
          <li>Estimasi pengiriman: {v.estimasi || '—'}</li>
          {v.catatan && <li>{v.catatan}</li>}
        </ol>
      </div>
      <div style={{ marginTop: 16 }}>Hormat kami,<br /><b>{v.owner}</b><br />PT Ditajaya Mitra Perkasa</div>
      <div style={{ marginTop: 12, color: '#777', fontSize: 11 }}>
        Dokumen dibuat otomatis dari {formId ? `Form Breakdown ${formId}` : 'data quote'}. Tata letak mengacu pada contoh penawaran Ditajaya, syarat dan kondisi lengkap menyusul di putaran berikutnya.
      </div>
    </div>
  )
}
