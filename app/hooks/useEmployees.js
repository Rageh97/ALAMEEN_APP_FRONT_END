'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesAPI } from '../utils/api'

export const useEmployees = (params = {}) => {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const requestParams = {
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 10,
        // Pass the rest as-is; api layer will sanitize/mapping filters
        filterValue: params.filterValue,
        filterType: params.filterType,
        sortType: params.sortType,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        balance: params.balance,
        roleName: params.roleName,
        name: params.name,
        userName: params.userName,
        phoneNumber: params.phoneNumber
      }
      console.log('useEmployees - request params:', requestParams)
      const data = await employeesAPI.getAll(requestParams)
      console.log('useEmployees - raw API response:', data)

      // Extract items list
      let items = []
      if (Array.isArray(data)) items = data
      else if (data && Array.isArray(data.items)) items = data.items
      else if (data && Array.isArray(data.data)) items = data.data

      // totalItems from common keys; fallback to items length
      const totalItems = (
        data?.totalItems ?? data?.TotalItems ?? data?.total ?? data?.Total ?? data?.totalCount ?? data?.TotalCount ?? items.length
      )
      const currentPage = Number(requestParams.pageNumber) || 1

      return { items, totalItems: Number(totalItems) || 0, currentPage }
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

