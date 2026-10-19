'use client'

import { Tbc } from '@/components/ui/Badge'
import { useAction, useUi } from '@/components/ui/Providers'
import { decideAction, makeQuoteAction, reviseFormAction } from './actions'
import { Icon } from '@/components/ui/Icon'

export function DecisionButtons({ fid }: { fid: string }) {
  const { run, pending } = useAction()
  const { confirm } = useUi()
  const decide = async (res: 'Disetujui' | 'Batal') => {
    const ok = await confirm(
      res === 'Disetujui'
        ? { title: 'Tandai Disetujui?', text: 'Form masuk ke antrean pengadaan Purchasing. Isi form terkunci setelah keputusan.', okLabel: 'Disetujui' }
        : { title: 'Batalkan form?', text: 'Form ditutup dan tidak masuk antrean Purchasing.', okLabel: 'Batalkan form' },
    )
    if (ok) await run(decideAction(fid, res))
  }
  return (
    <>
      <button className="btn danger" disabled={pending} onClick={() => decide('Batal')}>Batal</button>
      <button className="btn" disabled={pending} onClick={() => decide('Disetujui')}>Disetujui</button>
    </>
  )
}

export function ReviseButton({ fid }: { fid: string }) {
  const { run, pending } = useAction()
  const { confirm } = useUi()
  return (
    <>
      <button
        className="btn"
        disabled={pending}
        onClick={async () => {
          if (await confirm({ title: 'Revisi form?', text: 'Form kembali ke Sales untuk direvisi, konfirmasi teknisi di-reset ke Menunggu. Aturan revisi ini masih TBC di PRD.', okLabel: 'Revisi form' })) await run(reviseFormAction(fid))
        }}
      >
        Revisi form
      </button>
      <Tbc t="Aturan revisi saat Tidak Sesuai masih TBC di PRD (jalur pengecualian)." />
    </>
  )
}

export function MakeQuoteButton({ fid }: { fid: string }) {
  const { run, pending } = useAction()
  return <button className="btn" disabled={pending} onClick={() => run(makeQuoteAction(fid))}><Icon name="file" />Buat Quotation</button>
}
