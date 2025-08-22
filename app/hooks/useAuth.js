'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI, usersAPI } from '../utils/api'
import { useState, useEffect } from 'react'
import { userKeys } from './useUser'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Check for stored auth token on mount
  useEffect(() => {
    console.log('=== USE AUTH MOUNT START ===')
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    console.log('Token found:', token)
    console.log('UserData found:', userData)
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log('Loading user from localStorage:', parsedUser)
        console.log('User keys:', Object.keys(parsedUser))
        console.log('About to set user state...')
        setUser(parsedUser)
        console.log('User state set successfully')
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        // Clear invalid data
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
      }
    } else {
      console.log('No token or userData found, user remains null')
    }
    console.log('Setting isLoading to false...')
    setIsLoading(false)
    console.log('=== USE AUTH MOUNT END ===')
  }, [])

  // Hydrate user balance/details on mount if missing
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token || !user || user.balance != null) return
    let isCancelled = false
    ;(async () => {
      try {
        const full = await usersAPI.getById(user.id)
        const balance = (full?.balance ?? full?.Balance ?? 0)
        if (!isCancelled) {
          const merged = { ...user, balance }
          setUser(merged)
          localStorage.setItem('userData', JSON.stringify(merged))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: merged }))
          }
        }
      } catch (e) {
        console.warn('Failed to hydrate user balance on mount:', e)
      }
    })()
    return () => { isCancelled = true }
  }, [user?.id])

  // Debug: Log state changes
  useEffect(() => {
    console.log('=== USE AUTH STATE CHANGE ===')
    console.log('user:', user)
    console.log('isLoading:', isLoading)
  }, [user, isLoading])

  // Listen for external user updates (e.g., balance changes after approvals)
  useEffect(() => {
    const handler = (e) => {
      try {
        if (e?.detail) {
          setUser(e.detail)
          localStorage.setItem('userData', JSON.stringify(e.detail))
        } else {
          const stored = localStorage.getItem('userData')
          if (stored) {
            const parsed = JSON.parse(stored)
            setUser(parsed)
          }
        }
      } catch (err) {
        console.warn('Failed to handle auth:user-updated event:', err)
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:user-updated', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:user-updated', handler)
      }
    }
  }, [])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ userName, password }) => authAPI.signIn(userName, password),
    onError: (error) => {
      console.error('Login error:', error)
      return { success: false, error: error.message || 'An error occurred during login' }
    }
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData) => authAPI.signUp(userData),
    onSuccess: async (response) => {
      console.log('Registration mutation success response:', response)
      
      // Check for various success indicators
      if (response.success || response.userId || response.id || response.message === 'Success') {
        const newUser = {
          id: response.userId || response.id || Date.now(),
          name: response.name || response.userName,
          email: response.email,
          userName: response.userName,
          userType: response.userType || 0,
          roleId: response.roleId || 0,
          balance: response.balance || 0,
          isAdmin: false
        }
        
        setUser(newUser)
        // Attempt to retrieve server-issued token after registration
        try {
          await authAPI.getToken()
        } catch (e) {
          console.warn('GetToken after registration failed, storing temp token')
          localStorage.setItem('authToken', response.token || response.accessToken || 'temp-token')
        }
        localStorage.setItem('userData', JSON.stringify(newUser))
        
        // Invalidate and refetch user-related queries
        queryClient.invalidateQueries({ queryKey: userKeys.all })
        
        return { success: true, user: newUser }
      } else {
        console.log('Registration response indicates failure:', response)
        return { success: false, error: response.message || response.error || 'Registration failed' }
      }
    },
    onError: (error) => {
      console.error('Registration mutation error:', error)
      return { success: false, error: error.message || 'An error occurred during registration' }
    }
  })

  // Sign out function
  const signOut = () => {
    console.log('=== SIGN OUT ===')
    setUser(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    
    // Clear all queries from cache
    queryClient.clear()
  }

  // Sign in function
  const signIn = async (userName, password) => {
    console.log('=== SIGN IN FUNCTION START ===')
    console.log('userName:', userName)
    console.log('password:', password)
    
    try {
      const response = await loginMutation.mutateAsync({ userName, password })
      console.log('=== SIGN IN FUNCTION ===')
      console.log('Raw login response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', Object.keys(response))
      
      // Handle the correct response structure
      if (response.success && response.data) {
        const userData = response.data.user
        const tokenFromLogin = response.data.token
        
        console.log('User data from response:', userData)
        console.log('Token from response:', tokenFromLogin)
        
        if (userData) {
          const processedUserData = {
            id: userData.id,
            name: userData.name,
            email: userData.email || '',
            userName: userData.userName,
            userType: userData.userType,
            userTypeName: userData.userTypeName,
            phoneNumber: userData.phoneNumber,
            mobile: userData.mobile,
            isActive: userData.isActive,
            lastLogin: userData.lastLogin,
            isAdmin: userData.userType === 10 || userData.userTypeName === 'System' || userData.roles?.includes('Admin')
          }
          
          console.log('Processed user data:', processedUserData)
          
          // Update state immediately
          setUser(processedUserData)
          localStorage.setItem('userData', JSON.stringify(processedUserData))

          // Prefer server-issued token (GetToken) after successful login
          let tokenToStore = tokenFromLogin || ''
          try {
            console.log('Attempting to fetch server token via GetToken...')
            await authAPI.getToken() // stores token internally
            const storedToken = localStorage.getItem('authToken')
            if (storedToken) {
              tokenToStore = storedToken
              console.log('Using server-issued token from GetToken')
            }
          } catch (e) {
            console.warn('GetToken failed; falling back to login token if present')
          }

          if (tokenToStore) {
            localStorage.setItem('authToken', tokenToStore)
          }

          // Fetch full user details to hydrate balance and other fields
          try {
            const fullUser = await usersAPI.getById(processedUserData.id)
            const balance = (fullUser?.balance ?? fullUser?.Balance ?? 0)
            const mergedUserData = { ...processedUserData, balance }
            setUser(mergedUserData)
            localStorage.setItem('userData', JSON.stringify(mergedUserData))
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: mergedUserData }))
            }
          } catch (e) {
            console.warn('Could not fetch user details after login:', e)
          }

          console.log('User data stored in localStorage and state updated')
          console.log('Current user state after setUser:', processedUserData)
          
          // Invalidate and refetch user-related queries
          queryClient.invalidateQueries({ queryKey: userKeys.all })
          
          return { success: true, user: processedUserData }
        } else {
          console.error('Missing user data in login response')
          return { success: false, error: 'Invalid response format (no user data)' }
        }
      } else {
        console.log('Login response indicates failure:', response)
        return { success: false, error: response.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message || 'Login failed' }
    }
  }

  // Sign up function
  const signUp = async (userData) => {
    try {
      console.log('useAuth signUp called with:', userData)
      const result = await registerMutation.mutateAsync(userData)
      console.log('useAuth signUp result:', result)
      return result
    } catch (error) {
      console.error('useAuth signUp error:', error)
      return { success: false, error: error.message || 'Registration failed' }
    }
  }

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    // Reset functions
    resetLoginError: () => loginMutation.reset(),
    resetRegisterError: () => registerMutation.reset()
  }
}
