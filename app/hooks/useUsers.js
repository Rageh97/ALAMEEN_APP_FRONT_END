'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '../utils/api'

export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { ...filters }],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  dropdown: () => [...userKeys.all, 'dropdown'],
  types: () => [...userKeys.all, 'types'],
}

export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const data = await usersAPI.getAll(filters)
      // Extract items list
      let items = []
      if (Array.isArray(data)) items = data
      else if (data && Array.isArray(data.items)) items = data.items
      else if (data && Array.isArray(data.data)) items = data.data

      // totalItems from common keys; fallback to items length
      const totalItems = (
        data?.totalItems ?? data?.TotalItems ?? data?.total ?? data?.Total ?? data?.totalCount ?? data?.TotalCount ?? items.length
      )
      const currentPage = Number(filters.pageNumber) || 1

      return { items, totalItems: Number(totalItems) || 0, currentPage }
    },
  })
}

export const useUsersDropdown = () => {
  return useQuery({
    queryKey: userKeys.dropdown(),
    queryFn: usersAPI.getDropdown,
  })
}

export const useSupervisorsDropdown = () => {
  return useQuery({
    queryKey: [...userKeys.dropdown(), 'exceptEmployee'],
    queryFn: async () => {
      const data = await usersAPI.getDropdownExceptEmployee()
      // Normalize common response shapes
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.items)) return data.items
      if (data && Array.isArray(data.data)) return data.data
      if (data && data.success && Array.isArray(data.data)) return data.data
      return []
    },
  })
}

export const useUser = (id) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersAPI.getById(id),
    enabled: !!id,
  })
}

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.list({}) })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export const useDeleteUsersRange = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids) => usersAPI.deleteRange(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export const useChangeUserPassword = () => {
  return useMutation({
    mutationFn: ({ id, password, rePassword }) => usersAPI.changePassword(id, { password, rePassword })
  })
}

export const useUserTypes = () => {
  return useQuery({
    queryKey: userKeys.types(),
    queryFn: async () => {
      const raw = await usersAPI.getUserTypes()
      // Normalize wrapper shapes
      let list = []
      if (Array.isArray(raw)) list = raw
      else if (raw && Array.isArray(raw.data)) list = raw.data
      else if (raw && Array.isArray(raw.items)) list = raw.items
      else list = []
      // Normalize each item to have id/name and legacy value/text for compatibility
      return list.map((it) => {
        const id = it.id ?? it.Id ?? it.value ?? it.Value
        const name = it.name ?? it.Name ?? it.text ?? it.Text
        return { ...it, id, name, value: id, text: name }
      })
    },
  })
}

export const useUsersByType = (userType) => {
  return useQuery({
    queryKey: [...userKeys.lists(), 'byType', userType],
    queryFn: () => usersAPI.getByType(userType),
    enabled: userType != null,
  })
}

