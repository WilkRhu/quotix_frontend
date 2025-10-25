'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textAlign: 'center',
      color: 'white'
    }}>
      <div className="container">
        <h1 style={{ fontSize: '6rem', fontWeight: 'bold', margin: '20px 0' }}>404</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Página Não Encontrada</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '40px', opacity: 0.9 }}>
          Desculpe, a página que você está procurando não existe.
        </p>
        <Link href="/" className="btn btn-light btn-lg px-5 py-3 fw-bold">
          <i className="fas fa-arrow-left me-2"></i>
          Voltar para Home
        </Link>
      </div>
    </div>
  )
}
