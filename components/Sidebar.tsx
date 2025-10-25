'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '../stories/authStore'
import { Role } from '../types/auth'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface MenuItem {
  href?: string
  icon: string
  label: string
  submenu?: SubMenuItem[]
}

interface SubMenuItem {
  href: string
  label: string
}

const adminMenuItems: MenuItem[] = [
  { href: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
  { href: '/admin/lojas', icon: 'fas fa-store', label: 'Lojas' },
  { href: '/admin/usuarios', icon: 'fas fa-users-cog', label: 'Usuários Lojistas' },
  { href: '/admin/vendedores', icon: 'fas fa-user-tie', label: 'Vendedores' },
  { href: '/admin/planos-venda', icon: 'fas fa-file-invoice-dollar', label: 'Planos de Venda' },
  { href: '/admin/adesao-planos', icon: 'fas fa-handshake', label: 'Adesão aos Planos' },
  { href: '/admin/cotacoes', icon: 'fas fa-calculator', label: 'Cotações' },
  { href: '/vendas', icon: 'fas fa-chart-line', label: 'Vendas' },
]

const clientMenuItems: MenuItem[] = [
  { href: '/cliente/painel', icon: 'fas fa-tachometer-alt', label: 'Painel' },
  { href: '/cotacao', icon: 'fas fa-calculator', label: 'Cotação' },
  { href: '/historico', icon: 'fas fa-history', label: 'Histórico de Cotações' },
]

const vendedorMenuItems: MenuItem[] = [
  { href: '/vendedor', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
  { href: '/vendedor/nova-venda', icon: 'fas fa-plus-circle', label: 'Nova Venda' },
  {
    label: 'Clientes',
    icon: 'fas fa-users',
    submenu: [
      { href: '/clientes/cadastro', label: 'Cadastrar Cliente' },
      { href: '/clientes/lista', label: 'Lista de Clientes' }
    ]
  },
  { href: '/vendedor/busca-fipe', icon: 'fas fa-search', label: 'Busca FIPE' },
  { href: '/vendedor/vendas', icon: 'fas fa-chart-line', label: 'Vendas' },
]

const lojistaMenuItems: MenuItem[] = [
  { href: '/lojista', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
  { href: '/lojista/loja', icon: 'fas fa-store', label: 'Minha Loja' },
  { href: '/lojista/vendedores', icon: 'fas fa-user-tie', label: 'Vendedores' },
  { href: '/lojista/tipos-cotacao', icon: 'fas fa-calculator', label: 'Tipos de Cotação' },
  { href: '/lojista/planos', icon: 'fas fa-box', label: 'Planos' },
]

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [openSubmenus, setOpenSubmenus] = useState<{[key: string]: boolean}>({})
  
  const getMenuItems = () => {
    if (user?.role === Role.CLIENT) {
      return clientMenuItems
    }
    if (user?.role === Role.SELLER) {
      return vendedorMenuItems
    }
    if (user?.role === Role.LOJISTA || user?.role === Role.LOGIST) {
      return lojistaMenuItems
    }
    return adminMenuItems
  }
  
  const menuItems = getMenuItems()

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  const isSubmenuOpen = (label: string) => openSubmenus[label] || false

  const handleLogout = () => {
    onClose?.()
    logout()
    window.location.href = '/login'
  }

  const handleNavigate = () => {
    onClose?.()
  }

  const sidebarClassName = `sidenav bg-white navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start sidebar-collapsible ${isOpen ? 'sidebar-open' : ''}`

  return (
    <aside className={sidebarClassName} id="sidenav-main">
      <div className="sidenav-header position-relative">
        {onClose && (
          <button
            type="button"
            className="btn btn-link text-secondary opacity-7 position-absolute end-0 top-0 p-3 d-xl-none"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        <Link className="navbar-brand m-0" href="/">
          <i className="fas fa-shield-alt text-primary me-2"></i>
          <span className="ms-1 font-weight-bold">Sistema Seguros</span>
        </Link>
      </div>
      <hr className="horizontal dark mt-0" />
      <div className="collapse navbar-collapse w-auto">
        <ul className="navbar-nav">
          {menuItems.map((item, index) => (
            <li key={index} className="nav-item">
              {item.submenu ? (
                <>
                  <a
                    className="nav-link"
                    onClick={() => toggleSubmenu(item.label)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                      <i className={`${item.icon} text-dark text-sm opacity-10`}></i>
                    </div>
                    <span className="nav-link-text ms-1">{item.label}</span>
                    <i className={`fas fa-chevron-${isSubmenuOpen(item.label) ? 'down' : 'right'} ms-auto`}></i>
                  </a>
                  {isSubmenuOpen(item.label) && (
                    <ul className="nav nav-treeview" style={{ paddingLeft: '20px' }}>
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex} className="nav-item">
                          <Link
                            className={`nav-link ${pathname === subItem.href ? 'active' : ''}`}
                            href={subItem.href}
                            onClick={handleNavigate}
                          >
                            <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                              <i className="fas fa-circle text-xs"></i>
                            </div>
                            <span className="nav-link-text ms-1">{subItem.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  href={item.href!}
                  onClick={handleNavigate}
                >
                  <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                    <i className={`${item.icon} text-dark text-sm opacity-10`}></i>
                  </div>
                  <span className="nav-link-text ms-1">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}