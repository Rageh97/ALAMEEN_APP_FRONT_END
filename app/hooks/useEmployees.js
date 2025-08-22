'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesAPI } from '../utils/api'

export const useEmployees = (params = {}) => {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const data = await employeesAPI.getAll({
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 10,
        filterValue: params.filterValue || '',
        filterType: params.filterType || '',
        sortType: params.sortType || '',
        dateFrom: params.dateFrom || '',
        dateTo: params.dateTo || '',
        balance: params.balance || 0,
        roleName: params.roleName || '',
        roleId: params.roleId != null ? params.roleId : undefined,
        name: params.name || '',
        userName: params.userName || '',
        phoneNumber: params.phoneNumber || ''
      })
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.items)) return data.items
      if (data && Array.isArray(data.data)) return data.data
      return []
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('authToken')
  })
}

export const useEmployee = (id) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => employeesAPI.getById(id),
    enabled: !!id && (typeof window !== 'undefined' && !!localStorage.getItem('authToken'))
  })
}

export const useAddEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (employeeData) => {
      console.log('=== ADDING EMPLOYEE ===')
      console.log('Employee data:', employeeData)
      const result = await employeesAPI.register(employeeData)
      console.log('✅ Employee added successfully:', result)
      return result
    },
    onSuccess: () => {
      console.log('🔄 Invalidating employees query')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error) => {
      console.error('❌ Error adding employee:', error)
    }
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, employeeData }) => employeesAPI.update(id, employeeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => employeesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })
}

