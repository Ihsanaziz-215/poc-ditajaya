import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/role'
import { LoginForm } from './LoginForm'

/** Always light, regardless of the app theme. */
export default async function Page() {
  if (await getSession()) redirect('/breakdown')
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', color: '#1f2937', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ width: 600, maxWidth: '100%' }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 28 }}>
          <Image src="/logo.png" alt="Ditajaya Mitra Perkasa" width={200} height={150} priority style={{ width: 200, height: 'auto', mixBlendMode: 'multiply' }} />
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
