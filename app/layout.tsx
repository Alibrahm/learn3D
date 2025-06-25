import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aza 3D Teaching App',
  description: 'Created with love by Aza',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
