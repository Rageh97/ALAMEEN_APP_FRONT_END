'use client'

import { useEffect, useState, useCallback } from 'react'
import signalRService from '../utils/signalR'
import { useAuth } from './useAuth'

export const useSignalR = () => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Initialize SignalR connection when user is available
  useEffect(() => {
    if (!user) {
      // Disconnect if no user
      signalRService.disconnect()
      setIsConnected(false)
      setConnectionStatus('disconnected')
      return
    }

    const initializeSignalR = async () => {
      try {
        setConnectionStatus('connecting')
        const success = await signalRService.initialize()
        
        if (success) {
          setIsConnected(true)
          setConnectionStatus('connected')
          
          // Join user to their notification group
          await signalRService.joinUserGroup(user.id)
          
          console.log('✅ SignalR initialized for user:', user.id)
        } else {
          setConnectionStatus('failed')
          console.error('❌ Failed to initialize SignalR')
        }
      } catch (error) {
        setConnectionStatus('failed')
        console.error('❌ SignalR initialization error:', error)
      }
    }

    initializeSignalR()

    // Cleanup on unmount
    return () => {
      if (user?.id) {
        // best effort leave, then disconnect
        signalRService.leaveUserGroup(user.id).finally(() => {
          signalRService.disconnect()
        })
      } else {
        signalRService.disconnect()
      }
    }
  }, [user?.id])

  // Listen for notifications
  useEffect(() => {
    const handleNotification = (notification) => {
      console.log('📨 Received notification in hook:', notification)
      
      // Add notification to list
      setNotifications(prev => [notification, ...prev])
      
      // Increment unread count
      setUnreadCount(prev => prev + 1)
      
      // Show toast notification
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.success(notification.message || 'New notification received')
      }
    }

    const handleOrderUpdate = (orderUpdate) => {
      console.log('📋 Order update received:', orderUpdate)
      
      // Refresh orders if needed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders:updated'))
      }
    }

    const handleRechargeUpdate = (rechargeUpdate) => {
      console.log('💰 Recharge update received:', rechargeUpdate)
      
      // Refresh orders if needed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders:updated'))
      }
    }

    const handleBalanceUpdate = (balanceUpdate) => {
      console.log('💳 Balance update received:', balanceUpdate)
      
      // Update user balance
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:user-updated', { 
          detail: { ...user, balance: balanceUpdate.newBalance } 
        }))
      }
    }

    // Add event listeners
    signalRService.addEventListener('notification', handleNotification)
    signalRService.addEventListener('orderUpdate', handleOrderUpdate)
    signalRService.addEventListener('rechargeUpdate', handleRechargeUpdate)
    signalRService.addEventListener('balanceUpdate', handleBalanceUpdate)

    // Listen for custom events
    const handleCustomNotification = (event) => {
      handleNotification(event.detail)
    }

    const handleCustomOrderUpdate = (event) => {
      handleOrderUpdate(event.detail)
    }

    const handleCustomRechargeUpdate = (event) => {
      handleRechargeUpdate(event.detail)
    }

    const handleCustomBalanceUpdate = (event) => {
      handleBalanceUpdate(event.detail)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('notification:received', handleCustomNotification)
      window.addEventListener('order:status-updated', handleCustomOrderUpdate)
      window.addEventListener('recharge:status-updated', handleCustomRechargeUpdate)
      window.addEventListener('user:balance-updated', handleCustomBalanceUpdate)
    }

    // Cleanup
    return () => {
      signalRService.removeEventListener('notification', handleNotification)
      signalRService.removeEventListener('orderUpdate', handleOrderUpdate)
      signalRService.removeEventListener('rechargeUpdate', handleRechargeUpdate)
      signalRService.removeEventListener('balanceUpdate', handleBalanceUpdate)

      if (typeof window !== 'undefined') {
        window.removeEventListener('notification:received', handleCustomNotification)
        window.removeEventListener('order:status-updated', handleCustomOrderUpdate)
        window.removeEventListener('recharge:status-updated', handleCustomRechargeUpdate)
        window.removeEventListener('user:balance-updated', handleCustomBalanceUpdate)
      }
    }
  }, [user])

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    )
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
    setUnreadCount(0)
  }, [])

  // Send notification to user
  const sendNotificationToUser = useCallback(async (userId, notification) => {
    return await signalRService.sendNotificationToUser(userId, notification)
  }, [])

  // Send notification to admins
  const sendNotificationToAdmins = useCallback(async (notification) => {
    return await signalRService.sendNotificationToAdmins(notification)
  }, [])

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return signalRService.getConnectionStatus()
  }, [])

  return {
    isConnected,
    connectionStatus,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendNotificationToUser,
    sendNotificationToAdmins,
    getConnectionStatus
  }
}

