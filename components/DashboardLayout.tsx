'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const getInitialMobile = () => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.innerWidth < 992
  }

  const getInitialSidebarState = () => {
    if (typeof window === 'undefined') {
      return true
    }
    return window.innerWidth >= 992
  }

  const [isMobile, setIsMobile] = useState(getInitialMobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState)
  const wasMobile = useRef(getInitialMobile())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 992
      const prevMobile = wasMobile.current

      setIsMobile(mobile)

      if (mobile && !prevMobile) {
        setIsSidebarOpen(false)
      } else if (!mobile && prevMobile) {
        setIsSidebarOpen(true)
      }

      wasMobile.current = mobile
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

    document.body.classList.toggle('g-sidenav-pinned', isSidebarOpen)
  }, [isSidebarOpen])

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  return (
    <div className="g-sidenav-show bg-gray-100">
      <div className="min-height-300 bg-dark position-absolute w-100"></div>
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      {isMobile && isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={handleCloseSidebar}></div>
      )}
      <main className="main-content position-relative border-radius-lg">
        <Navbar
          title={title}
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="container-fluid py-4">
          {children}
        </div>
      </main>
    </div>
  )
}