'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesAPI } from '../utils/api'

export const roleKeys = {
  all: ['roles'],
  lists: () => [...roleKeys.all, 'list'],
  list: (filters) => [...roleKeys.lists(), { ...filters }],
  details: () => [...roleKeys.all, 'detail'],
  detail: (id) => [...roleKeys.details(), id],
}

export const useRoles = (filters = {}) => {
  return useQuery({
    queryKey: roleKeys.list(filters),
    queryFn: async () => {
      const data = await rolesAPI.getAll(filters)
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.items)) return data.items
      if (data && Array.isArray(data.data)) return data.data
      return []
    },
  })
}

export const useRolesList = () => {
  return useQuery({
    queryKey: [...roleKeys.lists(), 'allList'],
    queryFn: async () => {
      const data = await rolesAPI.getAllList()
      // Normalize common API shapes
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.items)) return data.items
      if (data && Array.isArray(data.data)) return data.data
      if (data && data.success && Array.isArray(data.data)) return data.data
      return []
    },
  })
}

export const useRole = (id) => {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => rolesAPI.getById(id),
    enabled: !!id,
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => rolesAPI.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => rolesAPI.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) })
    },
  })
}

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissions }) => rolesAPI.updatePermissions({ roleId, permissions }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleId) })
    },
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => rolesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export const useDeleteRolesRange = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids) => rolesAPI.deleteRange(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}













