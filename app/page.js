'use client'

import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import HomePage from './pages/HomePage'

export default function App() {
  const { user, isLoading } = useAuth()

  // Debug logging
  console.log('=== MAIN PAGE ===')
  console.log('user:', user)
  console.log('isLoading:', isLoading)
  console.log('user type:', typeof user)
  console.log('user keys:', user ? Object.keys(user) : 'null')

  // Redirect unauthenticated users to signin
  useEffect(() => {
    console.log('=== MAIN PAGE EFFECT ===')
    console.log('Effect triggered - isLoading:', isLoading, 'user:', user)
    
    if (!isLoading && !user) {
      console.log('Redirecting to signin...')
      window.location.href = '/signin'
    }
  }, [user, isLoading])

  // Always show loading while checking authentication or if user is null
  if (isLoading || !user) {
    console.log('Showing loading or waiting for user...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">
          {isLoading ? 'Loading...' : 'Checking authentication...'}
        </div>
      </div>
    )
  }

  // Show home page for authenticated users
  console.log('Rendering HomePage with user:', user)
  return <HomePage />
}
