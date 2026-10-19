import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/ui/Providers'
import { Shell } from '@/components/shell/Shell'
import { getRole } from '@/lib/role'
import { store } from '@/server/store'
import '../styles/prototype.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Modul Form Breakdown',
  description: 'POC Form Breakdown Ditajaya',
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const role = await getRole()
  const db = await store.read()
  return (
    <html lang="id" className={inter.variable}>
      <body>
        <Providers>
          <Shell role={role} notifs={db.notifs}>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
