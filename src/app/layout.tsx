import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/prototype.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Modul Form Breakdown',
  description: 'POC Form Breakdown Ditajaya',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
