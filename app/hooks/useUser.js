'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI } from '../utils/api'

// Query key for user data
export const userKeys = {
  all: ['user'],
  details: (id) => [...userKeys.all, 'details', id],
  current: () => [...userKeys.all, 'current'],
}

// Hook to get current user data
export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const token = localStorage.getItem('authToken')
      if (!token) {
        return null
      }
      
      try {
        // Here you would call your API to get current user data
        // For now, return the stored user data
        const userData = localStorage.getItem('userData')
        return userData ? JSON.parse(userData) : null
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to update user data
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userData) => {
      // Here you would call your API to update user data
      // For now, just update local storage
      localStorage.setItem('userData', JSON.stringify(userData))
      return userData
    },
    onSuccess: (updatedUser) => {
      // Update the current user query
      queryClient.setQueryData(userKeys.current(), updatedUser)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

// Hook to refresh user data
export const useRefreshUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      // Here you would call your API to refresh user data
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token')
      }
      
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          const userData = localStorage.getItem('userData')
          resolve(userData ? JSON.parse(userData) : null)
        }, 1000)
      })
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(userKeys.current(), userData)
    },
  })
}
