import './globals.css'
import type { Metadata } from 'next'
import { SupabaseProvider } from './providers/index'

export const metadata: Metadata = {
  title: 'MindRank',
  description: 'A competitive puzzle game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
} 