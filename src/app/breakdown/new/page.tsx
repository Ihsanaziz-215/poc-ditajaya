import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/components/ui/PageHead'
import { today } from '@/domain/derived'
import { PERSON } from '@/domain/types'
import { iso } from '@/lib/format'
import { getRole } from '@/lib/role'
import { NewForm } from '@/roles/teknisi/NewForm'
import { SwitchToTeknisi } from '@/roles/teknisi/SwitchToTeknisi'
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
            <div><b>Form baru hanya bisa dibuat oleh Teknisi</b>Anda login sebagai {role}. Ganti role untuk mencoba mengisi form analisa.</div>
          </div>
          <div className="acts" style={{ marginTop: 14 }}><SwitchToTeknisi /></div>
        </div>
      </>
    )
  }
  const db = await store.read()
  return <NewForm customers={db.customers.map((c) => c.name)} today={iso(today(db))} tech={PERSON.Teknisi} />
}
