'use client'

import { useEffect, useState } from 'react'

export default function HydrationWrapper({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Inicializando...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
