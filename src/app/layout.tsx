import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YPAI - Yellow Pages за AI ерата',
  description: 'AI-оптимизирана база данни за бизнеси и услуги',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg">
      <body className={inter.className}>{children}</body>
    </html>
  )
}