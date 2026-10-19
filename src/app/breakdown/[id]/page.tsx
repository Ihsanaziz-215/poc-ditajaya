import { Badge } from '@/components/ui/Badge'
import { PageHead } from '@/components/ui/PageHead'
import { Banner } from '@/components/breakdown/Banner'
import { CommentsCard } from '@/components/breakdown/CommentsCard'
import { FormUiProvider } from '@/components/breakdown/FormUi'
import { InfoCard } from '@/components/breakdown/InfoCard'
import { ItemsCard } from '@/components/breakdown/ItemsCard'
import { LogCard } from '@/components/breakdown/LogCard'
import { Stepper } from '@/components/breakdown/Stepper'
import { procOf, recvOf, stepOf, turnOf } from '@/domain/derived'
import { canPrice, canStruct, canSup } from '@/domain/permissions'
import { getRole } from '@/lib/role'
import { store } from '@/server/store'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = await getRole()
  const db = await store.read()
  const f = db.forms.find((x) => x.id === id)
  if (!f) return <PageHead crumbs={[['Form Breakdown', '/breakdown'], ['Tidak ditemukan']]} title="Form tidak ditemukan" />
  const q = db.quotes.find((x) => x.formId === f.id)
  const turn = turnOf(f, role)
  const hasProc = f.status === 'Disetujui'
  return (
    <FormUiProvider>
      <PageHead crumbs={[['Form Breakdown', '/breakdown'], [f.id]]} title={`${f.id} · ${f.cust}`} />
      <Banner form={f} role={role} turn={turn} />
      <div className="card">
        <div className="chips" style={{ marginBottom: 16 }}>
          <div className="sg"><small>Pengajuan</small><Badge v={f.done ? 'Selesai' : f.status} /></div>
          <div className="sg"><small>Pengadaan</small><Badge v={procOf(f)} /></div>
          {role !== 'Sales' && <div className="sg"><small>Penerimaan</small><Badge v={recvOf(f)} /></div>}
          <div className="sg"><small>Konfirmasi</small><Badge v={hasProc ? f.conf : '—'} /></div>
        </div>
        <Stepper step={stepOf(f, q)} role={role} />
      </div>
      <InfoCard form={f} />
      <ItemsCard
        form={f}
        role={role}
        perm={{ struct: canStruct(f, role), price: canPrice(f, role), sup: canSup(f, role) }}
        suppliers={db.suppliers.map((s) => ({ name: s.name, active: s.active }))}
      />
      <CommentsCard fid={f.id} comments={f.comments} />
      <LogCard form={f} role={role} />
    </FormUiProvider>
  )
}
