'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pointConversionAPI } from '../utils/api'

export const pointConversionKeys = {
  all: ['pointConversion'],
  lists: () => [...pointConversionKeys.all, 'list'],
  list: (filters) => [...pointConversionKeys.lists(), { ...filters }],
  details: () => [...pointConversionKeys.all, 'detail'],
  detail: (id) => [...pointConversionKeys.details(), id],
}

export const usePointConversionSettings = () => {
  return useQuery({
    queryKey: pointConversionKeys.lists(),
    queryFn: async () => {
      const data = await pointConversionAPI.getAll()
      // Normalize common response formats
      if (!data) return []
      // Swagger-like: { success: true, data: { ... } }
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        const inner = data.data
        if (Array.isArray(inner)) return inner
        if (inner && typeof inner === 'object') return [inner]
        return []
      }
      // Direct array
      if (Array.isArray(data)) return data
      // Paged shapes
      if (data.items && Array.isArray(data.items)) return data.items
      if (data.data && Array.isArray(data.data)) return data.data
      // Single object fallback
      if (data && typeof data === 'object') return [data]
      return []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const usePointConversionSetting = (id) => {
  return useQuery({
    queryKey: pointConversionKeys.detail(id),
    queryFn: () => pointConversionAPI.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUpdatePointConversionSetting = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => pointConversionAPI.update(id, data),
    onSuccess: (data, variables) => {
      console.log('Point conversion setting updated successfully:', data)
      
      // Invalidate and refetch point conversion settings
      queryClient.invalidateQueries({ queryKey: pointConversionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: pointConversionKeys.detail(variables.id) })
    },
    onError: (error) => {
      console.error('Failed to update point conversion setting:', error)
    },
  })
}
