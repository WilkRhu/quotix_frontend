import type { Metadata } from 'next'
import './globals.css'
import ToastViewport from '../components/ToastViewport'
import HydrationWrapper from '../components/HydrationWrapper'

export const metadata: Metadata = {
  title: 'QUOTIX - Plataforma de Seguros',
  description: 'Sistema para gerenciamento de vendas de seguros com QUOTIX',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700" rel="stylesheet" />
        <link href="/assets/css/nucleo-icons.css" rel="stylesheet" />
        <link href="/assets/css/nucleo-svg.css" rel="stylesheet" />
        <link href="/assets/css/argon-dashboard.css" rel="stylesheet" />
      </head>
      <body>
        <HydrationWrapper>
          <ToastViewport />
          {children}
        </HydrationWrapper>
      </body>
    </html>
  )
}