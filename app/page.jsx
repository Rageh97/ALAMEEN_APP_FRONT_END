'use client'

import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import HomePage from './pages/HomePage'

export default function App() {
  const { user, isLoading } = useAuth()



  // Redirect unauthenticated users to signin
  useEffect(() => {
    
    if (!isLoading && !user) {
    
      window.location.href = '/signin'
    }
  }, [user, isLoading])

  // Always show loading while checking authentication or if user is null
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* <div className="text-xl">
          {isLoading ? 'Loading...' : 'Checking authentication...'}
        </div> */}
      </div>
    )
  }

  return <HomePage />
}
