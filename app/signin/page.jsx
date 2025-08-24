'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function SignInPage() {
  const [formData, setFormData] = useState({
    userName: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { signIn, isLoggingIn, loginError, resetLoginError, user, isLoading } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      if (user.isAdmin || user.userType === 10) {
        window.location.href = '/admin'
      } else {
        window.location.href = '/'
      }
    }
  }, [user, isLoading])

  // Handle React Query errors
  useEffect(() => {
    if (loginError) {
      setError(loginError.message || 'Sign in failed')
    }
  }, [loginError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    resetLoginError()

    try {
      const result = await signIn(formData.userName, formData.password)
      
      if (result.success) {
        setSuccess('Sign in successful! Redirecting...')
        // Clear form
        setFormData({ userName: '', password: '' })
        
        // Redirect after successful login
        setTimeout(() => {
          if (result.user.isAdmin || result.user.userType === 10) {
            window.location.href = '/admin'
          } else {
            window.location.href = '/'
          }
        }, 1000)
      } else {
        setError(result.error || 'Sign in failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className='w-full min-h-screen auth-container flex items-center justify-center'>
      <div className="w-[100%] md:w-[50%] lg:w-[25%] mx-auto">
        <div className="card  gradient-border-2 p-8 w-full">
          <h2 className="text-3xl font-bold text-center mb-6">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#c1dadf] mb-2">
                Username
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.userName}
                onChange={(e) => setFormData({...formData, userName: e.target.value})}
                disabled={isLoggingIn}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#c1dadf] mb-2">
                Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={isLoggingIn}
              />
            </div>
            <button 
              type="submit" 
              className="w-full btn-primary bg-[#00a8cc] cursor-pointer"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>

            {/* <div className="text-center">
              <button 
                type="button" 
                className="text-[#c1dadf] "
                onClick={() => window.location.href = '/signup'}
              >
                Don't have an account? Sign up
              </button>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  )
}

