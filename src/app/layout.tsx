// app/layout.tsx - Clean Server Component без callbacks
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleMapsProvider from '@/components/GoogleMapsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YPAI - Yellow Pages AI | Bulgarian Business Directory for AI Agents',
  description: 'AI-optimized Bulgarian business directory. RESTful API for intelligent assistants, chatbots, and AI agents. Discover businesses with enhanced search capabilities.',
  keywords: 'Bulgaria businesses, AI directory, business API, Bulgarian companies, AI agents, chatbots, business search, structured data',
  authors: [{ name: 'YPAI Team' }],
  creator: 'YPAI',
  publisher: 'YPAI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    url: 'https://ypai.vercel.app',
    title: 'YPAI - AI-Enhanced Bulgarian Business Directory',
    description: 'RESTful API and directory for Bulgarian businesses, optimized for AI agents and intelligent systems.',
    siteName: 'YPAI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YPAI - Business Directory for AI',
    description: 'Bulgarian business API optimized for AI agents',
  },
  alternates: {
    canonical: 'https://ypai.vercel.app',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg">
      <body className={inter.className}>
        <GoogleMapsProvider>
          {children}
        </GoogleMapsProvider>
      </body>
    </html>
  )
}