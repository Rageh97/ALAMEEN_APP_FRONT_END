'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationAPI } from '../utils/api'

export const notificationKeys = {
  all: ['notifications'],
  lists: () => [...notificationKeys.all, 'list'],
  list: (filters) => [...notificationKeys.lists(), { ...filters }],
  userNotifications: () => [...notificationKeys.all, 'user'],
  details: () => [...notificationKeys.all, 'detail'],
  detail: (id) => [...notificationKeys.details(), id],
}

export const useNotifications = (filters = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: async () => {
      const data = await notificationAPI.getAll(filters)
      // Normalize common API shapes
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.items)) return data.items
      if (data && Array.isArray(data.data)) return data.data
      if (data && data.success && Array.isArray(data.data)) return data.data
      return []
    },
  })
}

export const useUserNotifications = () => {
  return useQuery({
    queryKey: notificationKeys.userNotifications(),
    queryFn: async () => {
      const data = await notificationAPI.getUserNotifications()
      console.log('📧 Raw notification data:', data)
      
      // Handle the actual API structure: { "approvals": [], "tasks": [] }
      if (data && data.success && data.data) {
        const { approvals = [], tasks = [] } = data.data
        console.log('📧 Approvals count:', approvals.length)
        console.log('📧 Tasks count:', tasks.length)
        console.log('📧 Sample approval:', approvals[0])
        
        // Combine approvals and tasks into a single array
        const allNotifications = [
          ...approvals.map(notification => ({
            ...notification,
            type: 'approval',
            isRead: notification.isRead || false, // Use existing isRead or default to false
            title: notification.title || 'تحديث الطلب',
            description: notification.description || 'لديك إشعار جديد'
          })),
          ...tasks.map(notification => ({
            ...notification,
            type: 'task',
            isRead: notification.isRead || false, // Use existing isRead or default to false
            title: notification.title || 'مهمة جديدة',
            description: notification.description || 'لديك مهمة جديدة'
          }))
        ]
        
        console.log('📧 Processed notifications:', allNotifications)
        console.log('📧 Final notifications count:', allNotifications.length)
        return allNotifications
      }
      
      // Fallback for other API shapes
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.items)) return data.items
      if (data && Array.isArray(data.data)) return data.data
      
      return []
    },
  })
}

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId) => notificationAPI.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
    },
  })
}

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
    },
  })
}

export const useCreateNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationData) => notificationAPI.createNotification(notificationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
    },
  })
}

