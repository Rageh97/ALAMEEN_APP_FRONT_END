'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUserTypes } from '../hooks/useUsers'
import { useRolesList } from '../hooks/useRoles'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    email: '',
    password: '',
    mobile: '',
    roleId: '',
    userType: '',
    balance: 0,
    profile: null
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { signUp, isRegistering, registerError, resetRegisterError, user, isLoading } = useAuth()
  const { data: userTypes } = useUserTypes()
  const { data: rolesList } = useRolesList()

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
    if (registerError) {
      setError(registerError.message || 'Registration failed')
    }
  }, [registerError])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setFormData(prev => ({ ...prev, profile: file || null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    resetRegisterError()

    try {
      // Build payload without invalid defaults
      const payload = {
        name: formData.name,
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile?.trim() || undefined,
        roleId: formData.roleId ? Number(formData.roleId) : undefined,
        userType: formData.userType ? Number(formData.userType) : undefined,
        balance: formData.balance && Number(formData.balance) !== 0 ? Number(formData.balance) : undefined,
        profile: formData.profile || undefined
      }

      const result = await signUp(payload)
      
      if (result.success) {
        setSuccess('Registration successful! Redirecting to sign in...')
        // Clear form
        setFormData({
          name: '',
          userName: '',
          email: '',
          password: '',
          mobile: '',
          roleId: '',
          userType: '',
          balance: 0,
          profile: null
        })
        // Redirect to signin page after 2 seconds
        setTimeout(() => {
          window.location.href = '/signin'
        }, 2000)
      } else {
        setError(result.error || 'Registration failed')
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
      <div className="max-w-md mx-auto">
        <div className="card p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
          
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={isRegistering}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.userName}
                onChange={(e) => setFormData({...formData, userName: e.target.value})}
                disabled={isRegistering}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={isRegistering}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={isRegistering}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile
              </label>
              <input
                type="tel"
                className="input-field"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                disabled={isRegistering}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Type
              </label>
              <select
                className="input-field"
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                disabled={isRegistering}
              >
                <option value="">Select...</option>
                {Array.isArray(userTypes) && userTypes.map(t => (
                  <option key={t.value || t.Value} value={t.value || t.Value}>{t.text || t.Text}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                className="input-field"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                disabled={isRegistering}
              >
                <option value="">Select...</option>
                {Array.isArray(rolesList) && rolesList.map(r => (
                  <option key={r.id || r.Id} value={r.id || r.Id}>{r.name || r.Name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image
              </label>
              <input
                type="file"
                className="input-field"
                onChange={handleFileChange}
                accept="image/*"
                disabled={isRegistering}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Balance (optional)
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.balance}
                onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})}
                disabled={isRegistering}
              />
            </div>

            <button 
              type="submit" 
              className="w-full btn-primary"
              disabled={isRegistering}
            >
              {isRegistering ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div className="text-center">
              <button 
                type="button" 
                className="text-blue-600 hover:text-blue-800"
                onClick={() => window.location.href = '/signin'}
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

