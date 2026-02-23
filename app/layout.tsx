import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VerifiedMeasure',
  description: 'VerifiedMeasure Platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
