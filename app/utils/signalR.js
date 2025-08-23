import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

class SignalRService {
  constructor() {
    this.connection = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.listeners = new Map()
  }

  // Initialize the SignalR connection
  async initialize() {
    try {
      console.log('🔌 Initializing SignalR connection...')
      
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.warn('⚠️ No auth token found, skipping SignalR connection')
        return false
      }

      // Create connection with authentication
      this.connection = new HubConnectionBuilder()
        .withUrl('http://alameenapp.runasp.net/notificationHub', {
          accessTokenFactory: () => token,
          withCredentials: false
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Reconnection intervals
        .build()

      // Set up connection event handlers
      this.setupConnectionHandlers()

      // Start the connection
      await this.connection.start()
      console.log('✅ SignalR connected successfully')
      this.isConnected = true
      this.reconnectAttempts = 0

      // Set up notification handlers
      this.setupNotificationHandlers()

      return true
    } catch (error) {
      console.error('❌ SignalR connection failed:', error)
      this.isConnected = false
      return false
    }
  }

  // Set up connection event handlers
  setupConnectionHandlers() {
    if (!this.connection) return

    this.connection.onclose(async (error) => {
      console.log('🔌 SignalR connection closed:', error)
      this.isConnected = false
      
      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
        
        setTimeout(async () => {
          await this.initialize()
        }, this.reconnectDelay * this.reconnectAttempts)
      } else {
        console.error('❌ Max reconnection attempts reached')
      }
    })

    this.connection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting:', error)
      this.isConnected = false
    })

    this.connection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected:', connectionId)
      this.isConnected = true
      this.reconnectAttempts = 0
    })
  }

  // Set up notification handlers
  setupNotificationHandlers() {
    if (!this.connection) return

    // Handle new notifications
    this.connection.on('ReceiveNotification', (notification) => {
      console.log('📨 Received notification:', notification)
      this.notifyListeners('notification', notification)
      
      // Dispatch custom event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification:received', { 
          detail: notification 
        }))
      }
    })

    // Handle order status updates
    this.connection.on('OrderStatusUpdated', (orderUpdate) => {
      console.log('📋 Order status updated:', orderUpdate)
      this.notifyListeners('orderUpdate', orderUpdate)
      
      // Dispatch custom event for order updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('order:status-updated', { 
          detail: orderUpdate 
        }))
      }
    })

    // Handle recharge request updates
    this.connection.on('RechargeRequestUpdated', (rechargeUpdate) => {
      console.log('💰 Recharge request updated:', rechargeUpdate)
      this.notifyListeners('rechargeUpdate', rechargeUpdate)
      
      // Dispatch custom event for recharge updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('recharge:status-updated', { 
          detail: rechargeUpdate 
        }))
      }
    })

    // Handle user balance updates
    this.connection.on('BalanceUpdated', (balanceUpdate) => {
      console.log('💳 Balance updated:', balanceUpdate)
      this.notifyListeners('balanceUpdate', balanceUpdate)
      
      // Dispatch custom event for balance updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user:balance-updated', { 
          detail: balanceUpdate 
        }))
      }
    })
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in SignalR listener:', error)
        }
      })
    }
  }

  // Send notification to specific user
  async sendNotificationToUser(userId, notification) {
    if (!this.connection || !this.isConnected) {
      console.warn('⚠️ SignalR not connected, cannot send notification')
      return false
    }

    try {
      await this.connection.invoke('SendNotificationToUser', userId, notification)
      console.log('✅ Notification sent to user:', userId)
      return true
    } catch (error) {
      // If method doesn't exist, just log and continue
      if (error.message && error.message.includes('Method does not exist')) {
        console.log('ℹ️ SendNotificationToUser method not available on server')
        return true
      }
      console.error('❌ Failed to send notification:', error)
      return false
    }
  }

  // Send notification to all admins
  async sendNotificationToAdmins(notification) {
    if (!this.connection || !this.isConnected) {
      console.warn('⚠️ SignalR not connected, cannot send notification')
      return false
    }

    try {
      await this.connection.invoke('SendNotificationToAdmins', notification)
      console.log('✅ Notification sent to admins')
      return true
    } catch (error) {
      // If method doesn't exist, just log and continue
      if (error.message && error.message.includes('Method does not exist')) {
        console.log('ℹ️ SendNotificationToAdmins method not available on server')
        return true
      }
      console.error('❌ Failed to send notification to admins:', error)
      return false
    }
  }

  // Join user to their notification group
  async joinUserGroup(userId) {
    if (!this.connection || !this.isConnected) {
      console.warn('⚠️ SignalR not connected, cannot join group')
      return false
    }

    try {
      // Check if the method exists before calling it
      if (this.connection.methods && this.connection.methods.includes('JoinUserGroup')) {
        await this.connection.invoke('JoinUserGroup', userId)
        console.log('✅ Joined user group:', userId)
      } else {
        console.log('ℹ️ JoinUserGroup method not available on server, skipping group join')
      }
      return true
    } catch (error) {
      // If method doesn't exist, just log and continue
      if (error.message && error.message.includes('Method does not exist')) {
        console.log('ℹ️ JoinUserGroup method not available on server, skipping group join')
        return true
      }
      console.error('❌ Failed to join user group:', error)
      return false
    }
  }

  // Leave user group
  async leaveUserGroup(userId) {
    if (!this.connection || !this.isConnected) {
      return false
    }

    try {
      // Check if the method exists before calling it
      if (this.connection.methods && this.connection.methods.includes('LeaveUserGroup')) {
        await this.connection.invoke('LeaveUserGroup', userId)
        console.log('✅ Left user group:', userId)
      } else {
        console.log('ℹ️ LeaveUserGroup method not available on server, skipping group leave')
      }
      return true
    } catch (error) {
      // If method doesn't exist, just log and continue
      if (error.message && error.message.includes('Method does not exist')) {
        console.log('ℹ️ LeaveUserGroup method not available on server, skipping group leave')
        return true
      }
      console.error('❌ Failed to leave user group:', error)
      return false
    }
  }

  // Disconnect from SignalR
  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop()
        console.log('🔌 SignalR disconnected')
      } catch (error) {
        console.error('❌ Error disconnecting SignalR:', error)
      }
      this.connection = null
      this.isConnected = false
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionId: this.connection?.connectionId,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// Create singleton instance
const signalRService = new SignalRService()

export default signalRService

