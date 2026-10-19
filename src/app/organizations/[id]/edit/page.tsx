import { PageHead } from '@/components/ui/PageHead'
import { PERSON } from '@/domain/types'
import { getRole } from '@/lib/role'
import { OrgEditForm } from '@/roles/sales/OrgEditForm'
import { store } from '@/server/store'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = await getRole()
  const db = await store.read()
  const c = db.customers.find((x) => x.id === id)
  if (!c) return <PageHead crumbs={[['Organizations', '/organizations'], ['Tidak ditemukan']]} title="Organization tidak ditemukan" />
  return <OrgEditForm key={c.id} customer={c} owners={['Sales', PERSON.Sales]} canEdit={role === 'Sales'} />
}
