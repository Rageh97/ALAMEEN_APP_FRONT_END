'use client'

import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import AdminDashboard from '../pages/AdminDashboard'

export default function AdminPage() {
  const { user, isLoading } = useAuth()

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!user || (user.userType !== 10 && !user.isAdmin))) {
      window.location.href = '/signin'
    }
  }, [user, isLoading])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  // Show access denied if not admin
  if (!user || (user.userType !== 10 && !user.isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Access Denied. Admin privileges required.</div>
      </div>
    )
  }

  // Show admin dashboard
  return <AdminDashboard />
}

