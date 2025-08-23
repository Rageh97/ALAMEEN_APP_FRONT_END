'use client'

import { usePathname } from 'next/navigation'
import Navigation from './Navigation'
import { useAuth } from '../hooks/useAuth'

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/signin' || pathname === '/signup'
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      {!isAuthPage && isAuthenticated && <Navigation />}
      <main className={isAuthPage ? "w-full" : "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"}>
        {children}
      </main>
    </div>
  )
}




