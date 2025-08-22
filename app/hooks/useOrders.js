'use client'

import { useState, useEffect, useCallback } from 'react'
import { ordersAPI, usersAPI } from '../utils/api'

export const useOrders = () => {
  const [orders, setOrders] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const clearError = () => setError(null)

  const extractOrderList = (data) => {
    if (Array.isArray(data)) return data
    if (!data || typeof data !== 'object') return []

    // Common wrappers
    if (Array.isArray(data.items)) return data.items
    if (Array.isArray(data.data)) return data.data
    if (Array.isArray(data.records)) return data.records
    if (Array.isArray(data.result)) return data.result
    if (Array.isArray(data.value)) return data.value

    // Nested wrappers
    if (data.data && Array.isArray(data.data.items)) return data.data.items
    if (data.data && Array.isArray(data.data.data)) return data.data.data
    if (data.result && Array.isArray(data.result.items)) return data.result.items
    if (data.result && Array.isArray(data.result.data)) return data.result.data
    if (data.pagedList && Array.isArray(data.pagedList.items)) return data.pagedList.items
    if (data.pagedList && Array.isArray(data.pagedList.data)) return data.pagedList.data

    // Generic list key
    if (Array.isArray(data.list)) return data.list

    // Last resort: find first array in object values
    const firstArray = Object.values(data).find(v => Array.isArray(v))
    return Array.isArray(firstArray) ? firstArray : []
  }

  // Fetch all orders with filters
  const fetchOrders = async (filters = {}) => {
    try {
      setLoading(true)
      setError(null)
      const safeFilters = {
        pageNumber: filters.pageNumber || 1,
        pageSize: filters.pageSize || 100
      }
      if (filters.filterValue && filters.filterValue.trim() !== '') safeFilters.filterValue = filters.filterValue.trim()
      if (filters.filterType && filters.filterType.trim() !== '') safeFilters.filterType = filters.filterType.trim()
      if (filters.sortType && filters.sortType.trim() !== '') safeFilters.sortType = filters.sortType.trim()
      if (filters.productName && filters.productName.trim() !== '') safeFilters.productName = filters.productName.trim()
      if (filters.requestedByUserName && filters.requestedByUserName.trim() !== '') safeFilters.requestedByUserName = filters.requestedByUserName.trim()
      if (filters.forUserId && filters.forUserId.toString().trim() !== '') safeFilters.forUserId = filters.forUserId.toString().trim()
      if (filters.dateFrom && filters.dateFrom.trim() !== '') safeFilters.dateFrom = filters.dateFrom.trim()
      if (filters.dateTo && filters.dateTo.trim() !== '') safeFilters.dateTo = filters.dateTo.trim()
      if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
        const statusValue = parseInt(filters.status)
        if (!isNaN(statusValue)) safeFilters.status = statusValue
      }
      if (filters.statusValue && filters.statusValue.trim() !== '') safeFilters.statusValue = filters.statusValue.trim()
      if (filters.type !== undefined && filters.type !== null && filters.type !== '') {
        const typeValue = parseInt(filters.type)
        if (!isNaN(typeValue)) safeFilters.type = typeValue
      }
      if (filters.typeValue && filters.typeValue.trim() !== '') safeFilters.typeValue = filters.typeValue.trim()
      if (filters.quantity !== undefined && filters.quantity !== null && filters.quantity !== '') {
        const quantityValue = parseInt(filters.quantity)
        if (!isNaN(quantityValue) && quantityValue > 0) safeFilters.quantity = quantityValue
      }
      if (filters.amount !== undefined && filters.amount !== null && filters.amount !== '') {
        const amountValue = parseFloat(filters.amount)
        if (!isNaN(amountValue) && amountValue > 0) safeFilters.amount = amountValue
      }

      // Primary fetch
      const primaryData = await ordersAPI.getAll(safeFilters)
      let combined = extractOrderList(primaryData)

      // If caller didn't specify a type, fetch both types and merge to avoid backend omissions
      const hasExplicitType = (
        (filters.type !== undefined && filters.type !== null && filters.type !== '') ||
        (filters.typeValue && filters.typeValue.trim() !== '')
      )

      if (!hasExplicitType) {
        try {
          const results = await Promise.allSettled([
            ordersAPI.getAll({ ...safeFilters, type: 1 }),
            ordersAPI.getAll({ ...safeFilters, type: 2 })
          ])
          const lists = results
            .filter(r => r.status === 'fulfilled')
            .map(r => extractOrderList(r.value))
          const byId = new Map()
          ;[combined, ...lists].forEach(list => {
            ;(list || []).forEach(o => {
              const id = o?.id ?? o?.Id
              // Use last-write-wins to avoid stale data from earlier lists
              if (id != null) byId.set(id, o)
            })
          })
          combined = Array.from(byId.values())
        } catch (mergeErr) {
          console.warn('Supplemental type fetch failed; using primary list only:', mergeErr)
        }
      }

      setOrders(combined)
      // Normalize orders to ensure consistent keys for UI rendering
      setOrders(prev => (combined || []).map(o => {
        const resolvedId = (o?.id ?? o?.Id)
        const resolvedAmount = (
          o?.amount != null ? Number(o.amount) :
          (o?.Amount != null ? Number(o.Amount) : undefined)
        )
        const resolvedQuantity = (
          o?.quantity != null ? Number(o.quantity) :
          (o?.Quantity != null ? Number(o.Quantity) : undefined)
        )
        const normalized = { ...o }
        if (resolvedId != null) normalized.id = resolvedId
        if (resolvedAmount != null) {
          normalized.amount = resolvedAmount
          normalized.Amount = resolvedAmount
        }
        if (resolvedQuantity != null) {
          normalized.quantity = resolvedQuantity
          normalized.Quantity = resolvedQuantity
        }
        return normalized
      }))
    } catch (err) {
      let errorMessage = 'Failed to load orders'
      if (err.message.includes('System.NullReferenceException')) errorMessage = 'API Error: Invalid parameters sent to server. Please try again.'
      else if (err.message.includes('401')) errorMessage = 'Authentication error. Please sign in again.'
      else if (err.message.includes('500')) errorMessage = 'Server error. Please try again later.'
      else if (err.message) errorMessage = err.message
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyOrders = useCallback(async (filters = {}, userInfo = null) => {
    try {
      console.log('=== FETCHING MY ORDERS ===')
      console.log('Filters:', filters)
      console.log('User info:', userInfo)
      
      setLoading(true)
      setError(null)
      const safeFilters = {
        pageNumber: filters.pageNumber || 1,
        pageSize: filters.pageSize || 50
      }
      // Do NOT include user-identifying filters here; backend derives the current user from the auth token
      
      if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
        const statusValue = parseInt(filters.status)
        if (!isNaN(statusValue)) safeFilters.status = statusValue
      }
      if (filters.type !== undefined && filters.type !== null && filters.type !== '') {
        const typeValue = parseInt(filters.type)
        if (!isNaN(typeValue)) safeFilters.type = typeValue
      }
      
      console.log('🔄 Calling API with safe filters:', safeFilters)
      const primary = await ordersAPI.getMyRequests(safeFilters)
      console.log('📡 API Response received:', primary)
      let combined = extractOrderList(primary)

      const hasExplicitType = (
        (filters.type !== undefined && filters.type !== null && filters.type !== '')
      )
      if (!hasExplicitType) {
        try {
          const results = await Promise.allSettled([
            ordersAPI.getMyRequests({ ...safeFilters, type: 1 }),
            ordersAPI.getMyRequests({ ...safeFilters, type: 2 })
          ])
          const lists = results
            .filter(r => r.status === 'fulfilled')
            .map(r => extractOrderList(r.value))
          const byId = new Map()
          ;[combined, ...lists].forEach(list => {
            ;(list || []).forEach(o => {
              const id = o?.id ?? o?.Id
              if (id != null) byId.set(id, o)
            })
          })
          combined = Array.from(byId.values())
        } catch (mergeErr) {
          console.warn('Supplemental my requests type fetch failed; using primary only:', mergeErr)
        }
      }

      // Normalize for UI (ensure id/amount/quantity keys exist)
      const normalized = (combined || []).map(o => {
        const resolvedId = (o?.id ?? o?.Id)
        const resolvedAmount = (
          o?.amount != null ? Number(o.amount) :
          (o?.Amount != null ? Number(o.Amount) : undefined)
        )
        const resolvedQuantity = (
          o?.quantity != null ? Number(o.quantity) :
          (o?.Quantity != null ? Number(o.Quantity) : undefined)
        )
        const n = { ...o }
        if (resolvedId != null) n.id = resolvedId
        if (resolvedAmount != null) { n.amount = resolvedAmount; n.Amount = resolvedAmount }
        if (resolvedQuantity != null) { n.quantity = resolvedQuantity; n.Quantity = resolvedQuantity }
        return n
      })
      setMyOrders(normalized)
      console.log('✅ My orders state updated with', normalized.length, 'orders')
      
    } catch (err) {
      console.error('❌ fetchMyOrders error:', err)
      setError(err.message || 'Failed to load my orders')
    } finally {
      setLoading(false)
      console.log('🏁 fetchMyOrders completed')
    }
  }, [])

  // Fetch pending orders
  const fetchPendingOrders = async (filters = {}) => {
    try {
      setError(null)
      const safeFilters = { pageNumber: filters.pageNumber || 1, pageSize: filters.pageSize || 100, status: 0 }
      if (filters.filterValue && filters.filterValue.trim() !== '') safeFilters.filterValue = filters.filterValue.trim()
      if (filters.filterType && filters.filterType.trim() !== '') safeFilters.filterType = filters.filterType.trim()
      if (filters.sortType && filters.sortType.trim() !== '') safeFilters.sortType = filters.sortType.trim()
      if (filters.productName && filters.productName.trim() !== '') safeFilters.productName = filters.productName.trim()
      if (filters.requestedByUserName && filters.requestedByUserName.trim() !== '') safeFilters.requestedByUserName = filters.requestedByUserName.trim()
      if (filters.forUserId && filters.forUserId.toString().trim() !== '') safeFilters.forUserId = filters.forUserId.toString().trim()
      if (filters.dateFrom && filters.dateFrom.trim() !== '') safeFilters.dateFrom = filters.dateFrom.trim()
      if (filters.dateTo && filters.dateTo.trim() !== '') safeFilters.dateTo = filters.dateTo.trim()
      if (filters.statusValue && filters.statusValue.trim() !== '') safeFilters.statusValue = filters.statusValue.trim()
      if (filters.type !== undefined && filters.type !== null && filters.type !== '') {
        const typeValue = parseInt(filters.type)
        if (!isNaN(typeValue)) safeFilters.type = typeValue
      }
      if (filters.typeValue && filters.typeValue.trim() !== '') safeFilters.typeValue = filters.typeValue.trim()
      if (filters.quantity !== undefined && filters.quantity !== null && filters.quantity !== '') {
        const quantityValue = parseInt(filters.quantity)
        if (!isNaN(quantityValue) && quantityValue > 0) safeFilters.quantity = quantityValue
      }
      if (filters.amount !== undefined && filters.amount !== null && filters.amount !== '') {
        const amountValue = parseFloat(filters.amount)
        if (!isNaN(amountValue) && amountValue > 0) safeFilters.amount = amountValue
      }

      const data = await ordersAPI.getAll(safeFilters)
      const list = extractOrderList(data)
      setPendingOrders(list)
    } catch (err) {
      let errorMessage = 'Failed to load pending orders'
      if (err.message.includes('System.InvalidOperationException')) errorMessage = 'Backend query error. Using alternative method to load pending orders.'
      else if (err.message.includes('System.NullReferenceException')) errorMessage = 'API Error: Invalid parameters sent to server. Please try again.'
      else if (err.message.includes('401')) errorMessage = 'Authentication error. Please sign in again.'
      else if (err.message.includes('500')) errorMessage = 'Server error. Please try again later.'
      else if (err.message) errorMessage = err.message
      setError(errorMessage)
    }
  }

  // Create product order
  const createProductOrder = async (orderData, currentUser = null) => {
    try {
      setError(null)
      if (!orderData.productId && !orderData.ProductId) throw new Error('Invalid product ID')
      // Auto-fill forUserId from current user if not provided
      const resolvedForUserId = (orderData.forUserId ?? orderData.ForUserId) || currentUser?.id
      if (!resolvedForUserId) throw new Error('User ID is required')
      const normalized = {
        productId: Number(orderData.productId ?? orderData.ProductId),
        quantity: Number(orderData.quantity ?? orderData.Quantity ?? 1),
        forUserId: String(resolvedForUserId),
        notes: orderData.notes ?? orderData.Notes
      }
      if (!normalized.quantity || normalized.quantity <= 0 || normalized.quantity > 99) throw new Error('Quantity must be between 1 and 99')

      console.log('=== CREATING PRODUCT ORDER ===')
      console.log('Order data:', normalized)
      console.log('Target user ID for order:', normalized.forUserId)
      
      const newOrder = await ordersAPI.registerProductRequest({
        ProductId: normalized.productId,
        Quantity: normalized.quantity,
        ForUserId: normalized.forUserId,
        Notes: normalized.notes
      })
      console.log('✅ Product order created successfully:', newOrder)
      
      // Refresh lists
      console.log('🔄 Refreshing orders list...')
      await fetchOrders()
      
      console.log('🔄 Refreshing my orders...')
      try {
        await fetchMyOrders({ pageNumber: 1, pageSize: 20 }, currentUser || null)
      } catch (err) {
        console.error('❌ Error refreshing my orders:', err)
      }
      
      console.log('🔄 Refreshing pending orders...')
      await fetchPendingOrders()
      
      // Broadcast update so other hook instances can refetch
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders:updated'))
      }
      return { success: true, order: newOrder, message: `Order created successfully for ${orderData.quantity} item(s)` }
    } catch (err) {
      console.error('❌ Error creating product order:', err)
      let errorMessage = 'Failed to create order'
      if (err.message.includes('401')) errorMessage = 'Authentication error. Please sign in again.'
      else if (err.message.includes('400')) errorMessage = 'Invalid order data. Please check your input.'
      else if (err.message.includes('500')) errorMessage = 'Server error. Please try again later.'
      else if (err.message) errorMessage = err.message
      setError(errorMessage)
      return { success: false, error: errorMessage, details: err.message }
    }
  }

  // Create recharge request
  const createRechargeRequest = async (rechargeData) => {
    try {
      setError(null)
      if (!rechargeData.amount || rechargeData.amount <= 0) throw new Error('Invalid amount')
      if (!rechargeData.transferImage) throw new Error('Transfer image is required')

      // Convert to API format (uppercase keys)
      const apiData = {
        Amount: rechargeData.amount,
        TransferImage: rechargeData.transferImage,
        TransferImagePath: rechargeData.transferImagePath || ''
      }

      console.log('Creating recharge request with data:', rechargeData)
      console.log('API data format:', apiData)
      
      const newRequest = await ordersAPI.registerRecharge(apiData)
      console.log('Recharge request created successfully:', newRequest)
      
      // Refresh lists
      await fetchOrders()
      try {
        // We need user info here, but we don't have it in this hook
        // Let's call it without user info for now, and the component will handle it
        await fetchMyOrders({ pageNumber: 1, pageSize: 20 })
      } catch {}
      await fetchPendingOrders()
      // Broadcast update so other hook instances can refetch
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders:updated'))
      }
      return { success: true, request: newRequest, message: 'Recharge request created successfully' }
    } catch (err) {
      console.error('Error creating recharge request:', err)
      let errorMessage = 'Failed to create recharge request'
      if (err.message.includes('401')) errorMessage = 'Authentication error. Please sign in again.'
      else if (err.message.includes('400')) errorMessage = 'Invalid request data. Please check your input.'
      else if (err.message.includes('500')) errorMessage = 'Server error. Please try again later.'
      else if (err.message) errorMessage = err.message
      setError(errorMessage)
      return { success: false, error: errorMessage, details: err.message }
    }
  }

  // Edit recharge request
  const editRechargeRequest = async (id, rechargeData) => {
    try {
      setError(null)
      console.log('Editing recharge request:', { id, rechargeData })

      // Optimistic update: update local amount immediately
      if (rechargeData?.Amount != null) {
        setOrders(prev => prev.map(o => {
          const oid = o?.id ?? o?.Id
          return String(oid) === String(id) ? { ...o, amount: Number(rechargeData.Amount), Amount: Number(rechargeData.Amount) } : o
        }))
      }

      const updatedRecharge = await ordersAPI.editRecharge(id, rechargeData)
      console.log('Recharge edit response:', updatedRecharge)

      // Merge server response back if it includes updated fields
      setOrders(prev => prev.map(o => {
        const oid = o?.id ?? o?.Id
        return String(oid) === String(id) ? { ...o, ...updatedRecharge } : o
      }))

      // Defer refresh to avoid clobbering optimistic value with stale data
      setTimeout(() => { try { fetchOrders() } catch {} }, 1200)
      return { success: true, order: updatedRecharge }
    } catch (err) {
      console.error('Error editing recharge request:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Edit product request
  const editProductRequest = async (id, orderData) => {
    try {
      setError(null)
      console.log('Editing product request:', { id, orderData })

      // Optimistic update: update local quantity immediately
      if (orderData?.quantity != null) {
        setOrders(prev => prev.map(o => {
          const oid = o?.id ?? o?.Id
          return String(oid) === String(id) ? { ...o, quantity: Number(orderData.quantity), Quantity: Number(orderData.quantity) } : o
        }))
      }

      const updatedOrder = await ordersAPI.editProductRequest(id, orderData)
      console.log('Product edit response:', updatedOrder)

      // Merge server response back if it includes updated fields
      setOrders(prev => prev.map(o => {
        const oid = o?.id ?? o?.Id
        return String(oid) === String(id) ? { ...o, ...updatedOrder } : o
      }))

      // Defer refresh to avoid clobbering optimistic value with stale data
      setTimeout(() => { try { fetchOrders() } catch {} }, 1200)
      return { success: true, order: updatedOrder }
    } catch (err) {
      console.error('Error editing product request:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Approve request
  const approveRequest = async (orderId) => {
    try {
      setError(null)
      await ordersAPI.approve(orderId)

      // Optimistically update local state for snappy UI
      setOrders(prev => prev.map(o => {
        const id = o?.id ?? o?.Id
        return id === orderId ? { ...o, status: 1, statusValue: 'approved' } : o
      }))
      setPendingOrders(prev => prev.filter(o => (o?.id ?? o?.Id) !== orderId))

      // Try to refresh the affected user's balance if this was a recharge
      try {
        const approvedOrder = (orders || []).find(o => (o?.id ?? o?.Id) === orderId)
        const isRecharge = approvedOrder && (approvedOrder.amount != null || String(approvedOrder.typeValue || approvedOrder.type || '').toLowerCase().includes('recharge'))
        const targetUserId = approvedOrder?.forUserId || approvedOrder?.requestedByUserId
        if (isRecharge && targetUserId) {
          const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
          const currentUser = userDataStr ? JSON.parse(userDataStr) : null
          const refreshedUser = await usersAPI.getById(targetUserId)
          const refreshedBalance = (refreshedUser?.balance ?? refreshedUser?.Balance ?? currentUser?.balance)
          if (currentUser && (currentUser.id === targetUserId || String(currentUser.id) === String(targetUserId))) {
            const updatedUserData = { ...currentUser, balance: refreshedBalance }
            localStorage.setItem('userData', JSON.stringify(updatedUserData))
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: updatedUserData }))
            }
          } else {
            // Notify other parts (like users list) that balances may have changed
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('users:updated'))
            }
          }
        }
      } catch (e) {
        console.warn('Non-fatal: could not sync user balance after approve:', e)
      }

      // Notify other views and refresh from server for consistency
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders:updated'))
      }
      await fetchOrders()
      await fetchPendingOrders()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Reject request
  const rejectRequest = async (orderId) => {
    try {
      setError(null)
      await ordersAPI.reject(orderId)

      // Optimistic UI update
      setOrders(prev => prev.map(o => {
        const id = o?.id ?? o?.Id
        return id === orderId ? { ...o, status: 2, statusValue: 'rejected' } : o
      }))
      setPendingOrders(prev => prev.filter(o => (o?.id ?? o?.Id) !== orderId))

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders:updated'))
      }
      await fetchOrders()
      await fetchPendingOrders()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Delete order
  const deleteOrder = async (orderId) => {
    try {
      setError(null)
      await ordersAPI.delete(orderId)
      await fetchOrders()
      await fetchPendingOrders()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Get order by ID
  const getOrderById = async (orderId) => {
    try {
      setError(null)
      const order = await ordersAPI.getById(orderId)
      return { success: true, order }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Derived helpers
  const getOrdersByStatus = (status) => orders.filter(order => order.status === status)
  const getOrdersByType = (type) => orders.filter(order => order.type === type)
  const getOrdersForUser = (userId) => orders.filter(order => order.forUserId === userId || order.requestedByUserId === userId)
  const getOrdersByDateRange = (dateFrom, dateTo) => orders.filter(order => {
    const orderDate = new Date(order.createdAt || order.dateCreated)
    const from = dateFrom ? new Date(dateFrom) : null
    const to = dateTo ? new Date(dateTo) : null
    if (from && orderDate < from) return false
    if (to && orderDate > to) return false
    return true
  })

  useEffect(() => {
    fetchOrders()
    fetchPendingOrders()
  }, [])

  return {
    orders,
    myOrders,
    pendingOrders,
    loading,
    error,
    clearError,
    fetchOrders,
    fetchMyOrders,
    fetchPendingOrders,
    createProductOrder,
    createRechargeRequest,
    editRechargeRequest,
    editProductRequest,
    approveRequest,
    rejectRequest,
    deleteOrder,
    getOrderById,
    getOrdersByStatus,
    getOrdersByType,
    getOrdersForUser,
    getOrdersByDateRange
  }
} 