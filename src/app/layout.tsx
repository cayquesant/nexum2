import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexum - Sistema de Gestão',
  description: 'Plataforma de gestão empresarial Nexum',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
