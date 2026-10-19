import { getRole } from '@/lib/role'
import { SuppliersView } from '@/roles/purchasing/SuppliersView'
import { store } from '@/server/store'

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const role = await getRole()
  const db = await store.read()
  const q = (sp.sq || '').toLowerCase()
  const rows = db.suppliers.filter(
    (s) => (!q || (s.name + s.contact + s.cats.join(' ')).toLowerCase().includes(q)) && (!sp.ss || (sp.ss === 'Aktif') === s.active),
  )
  return <SuppliersView rows={rows} role={role} />
}
