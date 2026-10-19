import { PERSON } from '@/domain/types'
import { getRole } from '@/lib/role'
import { OrgEditForm } from '@/roles/sales/OrgEditForm'

export default async function Page() {
  const role = await getRole()
  return <OrgEditForm owners={['Sales', PERSON.Sales]} canEdit={role === 'Sales'} />
}
