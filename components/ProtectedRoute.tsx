'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../stories/authStore'
import { Role } from '../types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: Role[]
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      router.push('/dashboard')
      return
    }
  }, [isAuthenticated, user, isLoading, requiredRoles, router])

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Acesso negado. Você não tem permissão para acessar esta página.
        </div>
      </div>
    )
  }

  return <>{children}</>
}