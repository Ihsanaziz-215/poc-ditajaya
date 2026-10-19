import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { today } from '@/domain/derived'
import { PERSON } from '@/domain/types'
import { iso } from '@/lib/format'
import { getRole } from '@/lib/role'
import { NewForm } from '@/roles/teknisi/NewForm'
import { store } from '@/server/store'

export default async function Page() {
  const role = await getRole()
  if (role !== 'Teknisi') {
    return (
      <>
        <PageHead crumbs={[['Form Breakdown', '/breakdown'], ['Buat Form']]} title="Buat Form Breakdown" />
        <div className="card">
          <div className="banner stop" style={{ margin: 0 }}>
            <Icon name="lock" />
            <div><b>Form baru hanya bisa dibuat oleh Teknisi</b>Tab aktif: {role}. Pindah ke tab Teknisi di header untuk mengisi form analisa.</div>
          </div>
        </div>
      </>
    )
  }
  const db = await store.read()
  return <NewForm customers={db.customers.map((c) => c.name)} today={iso(today(db))} tech={PERSON.Teknisi} />
}
