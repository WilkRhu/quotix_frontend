'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../stories/authStore'
import { API_BASE_URL, UPLOAD_URL } from '../lib/api'
import { resolveImageUrl } from '../lib/images'
import { translateRole } from '../lib/roles'
import { Role } from '../types/auth'

interface NavbarProps {
  title?: string
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
}

export default function Navbar({ title = 'Dashboard', onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const { user, logout, token } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [vendasEmAndamento, setVendasEmAndamento] = useState(0)
  const [vendas, setVendas] = useState<any[]>([])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  useEffect(() => {
    let isMounted = true

    const carregarFoto = async () => {
      if (!user) {
        if (isMounted) {
          setAvatarUrl(null)
        }
        return
      }

      const fotoDireta = user?.foto
      if (fotoDireta) {
        if (isMounted) {
          setAvatarUrl(resolveImageUrl(fotoDireta))
        }
        return
      }

      if (user.role === Role.SELLER && token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/vendedor/perfil`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })

          if (!response.ok) {
            throw new Error('Falha ao carregar foto do vendedor')
          }
  
            const perfil = await response.json();
            const fotoVendedor = perfil?.fotoVendedor || perfil?.foto || user?.foto;
            if (isMounted) {
              setAvatarUrl(fotoVendedor ? resolveImageUrl(fotoVendedor) : null);
            }
        } catch (error) {
          if (isMounted) {
            setAvatarUrl(null)
          }
        }
        return
      }

      if ((user.role === Role.LOJISTA || user.role === Role.LOGIST) && user.lojaId && token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/lojas/${user.lojaId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })

          if (!response.ok) {
            throw new Error('Falha ao carregar dados da loja')
          }

          const loja = await response.json()
          const logo = (loja?.logo as string | undefined) ?? undefined

          if (isMounted) {
            setAvatarUrl(logo ? `${API_BASE_URL}/uploads/lojas/logomarcas/${logo}` : null)
          }
        } catch (error) {
          if (isMounted) {
            setAvatarUrl(null)
          }
        }
        return
      }

      if (isMounted) {
        setAvatarUrl(null)
      }
    }

    carregarFoto()

    return () => {
      isMounted = false
    }
  }, [user, token])

  useEffect(() => {
    if (user?.role === Role.SELLER && token) {
      const fetchVendas = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/vendas/vendedor/vendas`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            const vendasAndamento = data.filter((v: any) => 
              v.status === 'pendente' || v.status === 'em_atendimento'
            )
            setVendas(vendasAndamento)
            setVendasEmAndamento(vendasAndamento.length)
          }
        } catch (error) {
          console.error('Erro ao buscar vendas:', error)
        }
      }
      fetchVendas()
      const interval = setInterval(fetchVendas, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.role, token])

  const avatarSrc = useMemo(() => {
    if (avatarUrl) {
      return avatarUrl
    }
    return '/assets/img/team-2.jpg'
  }, [avatarUrl])

  const roleLabel = useMemo(() => translateRole(user?.role ?? null), [user])

  return (
    <nav className="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl">
      <div className="container-fluid py-1 px-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
              <li className="breadcrumb-item text-sm">
                <a className="opacity-5 text-white" href="#">Quotix</a>
              </li>
              <li className="breadcrumb-item text-sm text-white active">{title}</li>
            </ol>
            <h6 className="font-weight-bolder text-white mb-0">{title}</h6>
          </nav>
        </div>
        <div className="mt-sm-0 mt-2 me-md-0 me-sm-4 ms-auto d-flex align-items-center justify-content-end flex-grow-1">
          <ul className="navbar-nav justify-content-end align-items-center">
            {(user?.role === Role.SELLER || user?.role === Role.LOJISTA || user?.role === Role.LOGIST) && (
              <li className="nav-item dropdown me-3">
                <button
                  className="nav-link text-white p-0 position-relative border-0 bg-transparent"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notificações"
                >
                  <i className="fas fa-bell" style={{ fontSize: '1.2rem' }}></i>
                  {user?.role === Role.SELLER && vendasEmAndamento > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                      {vendasEmAndamento}
                      <span className="visually-hidden">vendas em andamento</span>
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', right: 0, top: '100%', minWidth: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="px-3 py-2 border-bottom">
                      <h6 className="mb-0">Notificações</h6>
                    </div>
                    {user?.role === Role.SELLER && vendas.length > 0 ? (
                      <>
                        {vendas.slice(0, 5).map((venda: any) => (
                          <a key={venda.id} href={`/vendedor/vendas/${venda.id}/editar`} className="dropdown-item py-2">
                            <div className="d-flex align-items-start">
                              <i className="fas fa-shopping-cart text-primary me-2 mt-1"></i>
                              <div className="flex-grow-1">
                                <p className="mb-0 text-sm font-weight-bold">
                                  {venda.marca} {venda.modelo}
                                </p>
                                <p className="mb-0 text-xs text-muted">
                                  Cliente: {venda.cliente?.name}
                                </p>
                                <span className={`badge badge-sm ${
                                  venda.status === 'em_atendimento' ? 'bg-info' : 'bg-warning'
                                } mt-1`}>
                                  {venda.status === 'em_atendimento' ? 'Em Atendimento' : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          </a>
                        ))}
                        <div className="dropdown-divider"></div>
                        <a href="/vendedor/vendas/andamento" className="dropdown-item text-center text-primary">
                          Ver todas ({vendasEmAndamento})
                        </a>
                      </>
                    ) : (
                      <div className="px-3 py-4 text-center text-muted">
                        <i className="fas fa-check-circle text-success mb-2" style={{ fontSize: '2rem' }}></i>
                        <p className="mb-0 text-sm">Nenhuma notificação</p>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )}
            <li className="nav-item dropdown">
              <button
                className="nav-link text-white font-weight-bold px-0 border-0 bg-transparent dropdown-toggle d-flex align-items-center"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <img 
                  src={`${avatarSrc}`}
                  alt="Avatar" 
                  className="avatar avatar-sm me-2"
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
                
                <div className="d-flex flex-column text-start">
                  <span className="d-sm-inline d-none">{user?.name}</span>
                  <small className="text-xs opacity-8">{roleLabel}</small>
                </div>
              </button>
              {showDropdown && (
                <ul className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', right: 0, top: '100%' }}>
                  <li>
                    <a className="dropdown-item" href="/perfil">
                      <i className="fas fa-user me-2"></i>
                      Perfil
                    </a>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Sair
                    </button>
                  </li>
                </ul>
              )}
            </li>
            {onToggleSidebar && (
              <li className="nav-item d-xl-none ps-3 pe-0 d-flex align-items-center ms-3">
                <button
                  type="button"
                  className="nav-link text-white p-0 bg-transparent border-0"
                  onClick={onToggleSidebar}
                  aria-label="Alternar menu"
                  aria-expanded={!!isSidebarOpen}
                >
                  <div className="sidenav-toggler-inner">
                    <i className="sidenav-toggler-line bg-white"></i>
                    <i className="sidenav-toggler-line bg-white"></i>
                    <i className="sidenav-toggler-line bg-white"></i>
                  </div>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}