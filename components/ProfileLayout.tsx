'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar'

interface ProfileLayoutProps {
  children: React.ReactNode
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const getInitialMobile = () => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.innerWidth < 1200
  }

  const [isMobile, setIsMobile] = useState(getInitialMobile)
  const [isSidenavOpen, setIsSidenavOpen] = useState(!getInitialMobile())
  const previousMobile = useRef(isMobile)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 1200
      const wasMobile = previousMobile.current

      setIsMobile(mobile)

      if (mobile && !wasMobile) {
        setIsSidenavOpen(false)
      } else if (!mobile && wasMobile) {
        setIsSidenavOpen(true)
      }

      previousMobile.current = mobile
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const { body } = document
    body.classList.add('g-sidenav-show', 'bg-gray-100')

    return () => {
      body.classList.remove('g-sidenav-show', 'bg-gray-100', 'g-sidenav-pinned')
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.toggle('g-sidenav-pinned', !isMobile || isSidenavOpen)
  }, [isMobile, isSidenavOpen])

  const handleToggleSidebar = useCallback(() => {
    setIsSidenavOpen(prev => !prev)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setIsSidenavOpen(false)
  }, [])

  return (
    <div className="g-sidenav-show bg-gray-100">
      <div className="position-absolute w-100 min-height-300 top-0 bg-dark"></div>
      <Sidebar isOpen={isMobile ? isSidenavOpen : true} onClose={handleCloseSidebar} />
      {isMobile && isSidenavOpen && (
        <div className="sidebar-backdrop" onClick={handleCloseSidebar}></div>
      )}
      <main className="main-content position-relative border-radius-lg">
        <nav className="navbar navbar-main navbar-expand-lg bg-transparent shadow-none position-absolute px-4 w-100 z-index-2 mt-n11">
          <div className="container-fluid py-1 d-flex align-items-center">
            <div className="d-flex align-items-center">
              <nav aria-label="breadcrumb">
              <ol className="breadcrumb bg-transparent mb-0 pb-0 pt-1 ps-2 me-sm-6 me-5">
                <li className="breadcrumb-item text-sm">
                  <a className="text-white opacity-5" href="#">Sistema</a>
                </li>
                <li className="breadcrumb-item text-sm text-white active">Perfil</li>
              </ol>
              <h6 className="text-white font-weight-bolder ms-2">Perfil</h6>
              </nav>
            </div>
            <button
              type="button"
              className="btn btn-link text-white d-xl-none ms-auto p-0"
              onClick={handleToggleSidebar}
              aria-label="Alternar menu"
              aria-expanded={isSidenavOpen}
              style={{ border: 'none', background: 'none' }}
            >
              <div className="sidenav-toggler-inner">
                <i className="sidenav-toggler-line bg-white"></i>
                <i className="sidenav-toggler-line bg-white"></i>
                <i className="sidenav-toggler-line bg-white"></i>
              </div>
            </button>
          </div>
        </nav>
        {children}
      </main>
    </div>
  )
}