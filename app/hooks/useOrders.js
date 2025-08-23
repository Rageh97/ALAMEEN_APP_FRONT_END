'use client'

import { useState, useEffect, useCallback } from 'react'
import { ordersAPI, usersAPI, notificationAPI } from '../utils/api'

// Debug: Check if notificationAPI is properly imported
console.log('🔍 useOrders hook - notificationAPI imported:', {
  hasNotificationAPI: !!notificationAPI,
  notificationAPIType: typeof notificationAPI,
  notificationAPIKeys: notificationAPI ? Object.keys(notificationAPI) : 'N/A',
  hasCreateNotification: !!notificationAPI?.createNotification,
  createNotificationType: typeof notificationAPI?.createNotification
})

export const useOrders = () => {
  const [orders, setOrders] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [myOrdersLoading, setMyOrdersLoading] = useState(false)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPendingItems, setTotalPendingItems] = useState(0)
  const [totalMyItems, setTotalMyItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const [myOrdersPage, setMyOrdersPage] = useState(1)
  const [pageSize] = useState(100)

  const extractOrderList = (data) => {
    console.log('🔍 extractOrderList input:', data)
    if (Array.isArray(data)) {
      console.log('📋 Input is array, returning as-is')
      return data
    }
    if (!data || typeof data !== 'object') {
      console.log('📋 Input is null/undefined/not object, returning empty array')
      return []
    }

    // Common wrappers
    if (Array.isArray(data.items)) {
      console.log('📋 Found data.items array')
      return data.items
    }
    if (Array.isArray(data.data)) {
      console.log('📋 Found data.data array')
      return data.data
    }
    if (Array.isArray(data.records)) {
      console.log('📋 Found data.records array')
      return data.records
    }
    if (Array.isArray(data.result)) {
      console.log('📋 Found data.result array')
      return data.result
    }
    if (Array.isArray(data.value)) {
      console.log('📋 Found data.value array')
      return data.value
    }

    // Nested wrappers
    if (data.data && Array.isArray(data.data.items)) {
      console.log('📋 Found data.data.items array')
      return data.data.items
    }
    if (data.data && Array.isArray(data.data.data)) {
      console.log('📋 Found data.data.data array')
      return data.data.data
    }
    if (data.result && Array.isArray(data.result.items)) {
      console.log('📋 Found data.result.items array')
      return data.result.items
    }
    if (data.result && Array.isArray(data.result.data)) {
      console.log('📋 Found data.result.data array')
      return data.result.data
    }
    if (data.pagedList && Array.isArray(data.pagedList.items)) {
      console.log('📋 Found data.pagedList.items array')
      return data.pagedList.items
    }
    if (data.pagedList && Array.isArray(data.pagedList.data)) {
      console.log('📋 Found data.pagedList.data array')
      return data.pagedList.items
    }

    // Generic list key
    if (Array.isArray(data.list)) {
      console.log('📋 Found data.list array')
      return data.list
    }

    // Last resort: find first array in object values
    const firstArray = Object.values(data).find(v => Array.isArray(v))
    if (firstArray) {
      console.log('📋 Found first array in object values')
      return firstArray
    }
    
    console.log('📋 No array found, returning empty array')
    return []
  }

  // Fetch orders with pagination and filtering
  const fetchOrders = useCallback(async (page = 1, filters = {}) => {
    try {
      console.log('🔄 fetchOrders called with page:', page, 'filters:', filters)
      setLoading(true)
      // setError removed - using toast notifications only
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
      console.log('🔍 fetchOrders calling API with filters:', safeFilters)
      const primaryData = await ordersAPI.getAll(safeFilters)
      console.log('✅ fetchOrders API response:', primaryData)
      let combined = extractOrderList(primaryData)
      console.log('📋 fetchOrders extracted orders:', combined?.length || 0, 'orders')

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

      console.log('🔄 fetchOrders setting orders state with:', combined?.length || 0, 'orders')
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
      // setError removed - using toast notifications only
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMyOrders = useCallback(async (filters = {}, userInfo = null) => {
    console.log('🔧 fetchMyOrders function definition reached')
    try {
      console.log('=== FETCHING MY ORDERS ===')
      console.log('Filters:', filters)
      console.log('User info:', userInfo)
      console.log('User info keys:', userInfo ? Object.keys(userInfo) : 'N/A')
      console.log('User info ID:', userInfo?.id || userInfo?.Id || userInfo?.userId || userInfo?.UserId)
      console.log('Current user ID from localStorage:', typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userData') || '{}').id : 'N/A')
      
      // Test if function is actually being called
      console.log('🚀 fetchMyOrders function execution started!')
      console.log('🔍 Function parameters received:', { filters, userInfo })
      
      // Check authentication token
      const token = localStorage.getItem('authToken')
      console.log('🔑 Auth token check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 20) + '...' || 'N/A'
      })
      
      if (!token) {
        console.error('❌ No auth token found!')
        setLoading(false)
        setMyOrdersLoading(false)
        return
      }
      
      setLoading(true)
      setMyOrdersLoading(true)
      // setError removed - using toast notifications only
      const safeFilters = {
        pageNumber: Math.max(1, parseInt(filters.pageNumber) || 1), // Ensure pageNumber starts from 1
        pageSize: Math.max(1, parseInt(filters.pageSize) || 50)     // Ensure pageSize is at least 1
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
      let combined = []
      
      try {
        console.log('🔄 Step 1: Getting all my requests...')
        const primary = await ordersAPI.getMyRequests(safeFilters)
        console.log('📡 API Response received:', primary)
        combined = extractOrderList(primary)
        console.log('📋 Extracted order list:', combined)
        console.log('📊 Number of orders found:', combined.length)
        
        if (combined && combined.length > 0) {
          console.log('✅ Success: Got orders from primary API call')
          console.log('📊 Orders breakdown:', combined.map(o => ({
            id: o?.id ?? o?.Id,
            type: o?.type ?? o?.Type,
            typeValue: o?.typeValue ?? o?.TypeValue,
            status: o?.status ?? o?.Status,
            amount: o?.amount ?? o?.Amount,
            productId: o?.productId ?? o?.ProductId,
            productName: o?.productName ?? o?.ProductName,
            isRecharge: !!(o?.amount != null || String(o?.typeValue || o?.type || '').toLowerCase().includes('recharge')),
            isProduct: !!(o?.productId != null || String(o?.typeValue || o?.type || '').toLowerCase().includes('product'))
          })))
        } else {
          console.log('⚠️ No orders from primary API call, trying alternative...')
        }
      } catch (apiError) {
        console.error('❌ Primary API call failed:', apiError)
        console.error('❌ Error message:', apiError.message)
        console.error('❌ Error stack:', apiError.stack)
        // Continue with empty array
        console.log('📋 Using empty array due to API error')
        console.log('📊 Number of orders found:', combined.length)
      }

      // Check user balance first
      const userDataStrForBalance = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
      const currentUserForBalance = userDataStrForBalance ? JSON.parse(userDataStrForBalance) : null
      const userBalance = currentUserForBalance?.balance || currentUserForBalance?.Balance || 0
      
      console.log('🔍 User balance check:', {
        userId: currentUserForBalance?.id,
        userIdAlternative: currentUserForBalance?.Id || currentUserForBalance?.userId || currentUserForBalance?.UserId,
        userBalance: userBalance,
        isZeroBalance: userBalance === 0 || userBalance === '0',
        userDataKeys: currentUserForBalance ? Object.keys(currentUserForBalance) : 'N/A'
      })
      
      // Simplified approach: Try to get all requests directly
      console.log('🔄 Simplified approach: Getting all requests...')
      
      try {
        // Always fetch both product and recharge orders separately to ensure we get both types
        console.log('🔄 Step 1: Getting product requests (type 1)...')
        const productRequests = await ordersAPI.getMyRequests({ ...safeFilters, type: 1 })
        const productList = extractOrderList(productRequests)
        console.log('📋 Product requests:', productList.length)
        console.log('📊 Product requests details:', productList.map(o => ({
          id: o?.id ?? o?.Id,
          type: o?.type ?? o?.Type,
          typeValue: o?.typeValue ?? o?.TypeValue,
          productId: o?.productId ?? o?.ProductId,
          productName: o?.productName ?? o?.ProductName
        })))
        
        console.log('🔄 Step 2: Getting recharge requests (type 2)...')
        const rechargeRequests = await ordersAPI.getMyRequests({ ...safeFilters, type: 2 })
        const rechargeList = extractOrderList(rechargeRequests)
        console.log('📋 Recharge requests:', rechargeList.length)
        console.log('📊 Recharge requests details:', rechargeList.map(o => ({
          id: o?.id ?? o?.Id,
          type: o?.type ?? o?.Type,
          typeValue: o?.typeValue ?? o?.TypeValue,
          amount: o?.amount ?? o?.Amount
        })))
        
        // Combine both lists
        const byId = new Map()
        ;[productList, rechargeList].forEach((list, index) => {
          console.log(`🔍 Processing ${index === 0 ? 'product' : 'recharge'} list:`, list?.length || 0, 'items')
          ;(list || []).forEach(o => {
            const id = o?.id ?? o?.Id
            if (id != null) {
              byId.set(id, o)
              console.log(`✅ Added ${index === 0 ? 'product' : 'recharge'} order ${id} to combined list`)
            }
          })
        })
        combined = Array.from(byId.values())
        console.log('✅ Success: Combined list with:', combined.length, 'orders')
        console.log('📊 Combined breakdown:', combined.map(o => ({
          id: o?.id ?? o?.Id,
          type: o?.type ?? o?.Type,
          typeValue: o?.typeValue ?? o?.TypeValue,
          isRecharge: !!(o?.amount != null || String(o?.typeValue || o?.type || '').toLowerCase().includes('recharge')),
          isProduct: !!(o?.productId != null || String(o?.typeValue || o?.type || '').toLowerCase().includes('product'))
        })))
      } catch (error) {
        console.error('❌ Simplified approach failed:', error)
        console.log('🔄 Fallback: Using original GetMyRequests...')
        
        // Final fallback to original method
        try {
          const fallbackRequests = await ordersAPI.getMyRequests(safeFilters)
          const fallbackList = extractOrderList(fallbackRequests)
          combined = fallbackList
          console.log('✅ Fallback successful: Using GetMyRequests with:', combined.length, 'orders')
        } catch (fallbackErr) {
          console.error('❌ All approaches failed:', fallbackErr)
        }
      }

      console.log('📋 Final combined orders after merge:', combined)
      console.log('📊 Final number of orders:', combined.length)
      
      // Debug order types
      const orderTypes = combined.map(o => ({
        id: o?.id ?? o?.Id,
        type: o?.type ?? o?.Type,
        typeValue: o?.typeValue ?? o?.TypeValue,
        status: o?.status ?? o?.Status,
        statusValue: o?.statusValue ?? o?.StatusValue,
        forUserId: o?.forUserId ?? o?.ForUserId
      }))
      console.log('🔍 Order types breakdown:', orderTypes)
      
      // Debug order statuses
      const orderStatuses = combined.map(o => ({
        id: o?.id ?? o?.Id,
        status: o?.status ?? o?.Status,
        statusValue: o?.statusValue ?? o?.StatusValue,
        statusText: o?.statusText ?? o?.StatusText
      }))
      console.log('🔍 Order statuses breakdown:', orderStatuses)

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
      console.log('📋 Normalized orders data:', normalized)
      
      // Check if orders belong to current user
      const currentUserId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userData') || '{}').id : null
      const currentUserBalance = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userData') || '{}').balance : null
      
      console.log('🔍 User info check:', {
        currentUserId,
        currentUserBalance,
        userData: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userData') || '{}') : null
      })
      
      // For now, show all orders without filtering to debug the issue
      // The API should already return only the current user's orders
      console.log('🔍 Showing all orders without user filtering for debugging')
      console.log('🔍 Total orders from API:', normalized.length)
      console.log('🔍 Orders details:', normalized.map(o => ({
        id: o?.id ?? o?.Id,
        type: o?.type ?? o?.Type,
        typeValue: o?.typeValue ?? o?.TypeValue,
        forUserId: o?.forUserId ?? o?.ForUserId,
        requestedByUserId: o?.requestedByUserId ?? o?.RequestedByUserId,
        status: o?.status ?? o?.Status,
        amount: o?.amount ?? o?.Amount,
        productId: o?.productId ?? o?.ProductId
      })))
      
      // Update state with all orders (temporarily disable user filtering)
      console.log('🔄 About to update myOrders state with:', normalized.length, 'orders')
      setMyOrders(normalized)
      console.log('✅ My orders state updated with all orders:', normalized.length)
      console.log('🔍 Final orders data:', normalized)
      
      // Debug: Check if state was actually updated
      setTimeout(() => {
        console.log('🔍 Debug: Checking if myOrders state was updated...')
        console.log('🔍 Current myOrders state should have:', normalized.length, 'orders')
      }, 100)
      
      // Debug: Check if any orders would match current user
      if (normalized.length > 0) {
        const potentialUserOrders = normalized.filter(order => {
          const orderUserId = order?.forUserId || order?.ForUserId
          const orderRequestedByUserId = order?.requestedByUserId || order?.RequestedByUserId
          return String(orderUserId) === String(currentUserId) || String(orderRequestedByUserId) === String(currentUserId)
        })
        console.log('🔍 Potential user orders (if filtering was enabled):', potentialUserOrders.length)
        console.log('🔍 Current user ID:', currentUserId)
        console.log('🔍 Order user IDs found:', [...new Set(normalized.map(o => o?.forUserId || o?.ForUserId))])
        console.log('🔍 Requested by user IDs found:', [...new Set(normalized.map(o => o?.requestedByUserId || o?.RequestedByUserId))])
      }
      
    } catch (err) {
      console.error('❌ fetchMyOrders error:', err)
      console.error('❌ Error stack:', err.stack)
      // setError removed - using toast notifications only
    } finally {
      setLoading(false)
      setMyOrdersLoading(false)
      console.log('🏁 fetchMyOrders completed')
      console.log('🏁 Final state - loading:', false, 'myOrdersLoading:', false)
    }
  }, [])

  // Fetch pending orders
  const fetchPendingOrders = useCallback(async (filters = {}) => {
    try {
      // setError removed - using toast notifications only
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
      // setError removed - using toast notifications only
    }
  }, [])

  // Create product order
  const createProductOrder = async (orderData, currentUser = null) => {
    try {
      // setError removed - using toast notifications only
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
      console.log('📋 New order details:', {
        id: newOrder?.id || newOrder?.Id,
        productId: newOrder?.productId || newOrder?.ProductId,
        quantity: newOrder?.quantity || newOrder?.Quantity,
        forUserId: newOrder?.forUserId || newOrder?.ForUserId,
        status: newOrder?.status || newOrder?.Status,
        statusValue: newOrder?.statusValue || newOrder?.StatusValue,
        type: newOrder?.type || newOrder?.Type,
        typeValue: newOrder?.typeValue || newOrder?.TypeValue
      })
      
      // Check if the order should be visible in my orders
      const orderStatus = newOrder?.status || newOrder?.Status || 0
      const orderType = newOrder?.type || newOrder?.Type || 1
      console.log('🔍 Order visibility check:', {
        status: orderStatus,
        type: orderType,
        shouldBeVisible: true // All orders should be visible to the user who created them
      })
      
      // Add the new product order to myOrders state immediately
      if (newOrder && newOrder.id) {
        console.log('🔄 Adding new product order to myOrders state immediately')
        setMyOrders(prev => {
          const existing = prev || []
          // Check if order already exists (avoid duplicates)
          const exists = existing.some(o => (o?.id || o?.Id) === (newOrder?.id || newOrder?.Id))
          if (!exists) {
            console.log('✅ Adding new order to state:', newOrder)
            return [newOrder, ...existing]
          } else {
            console.log('⚠️ Order already exists in state, not adding duplicate')
            return existing
          }
        })
      }
      
      // Refresh lists
      console.log('🔄 Refreshing orders list...')
      await fetchOrders()
      
      console.log('🔄 Refreshing my orders...')
      try {
        await fetchMyOrders({ pageNumber: 1, pageSize: 20 }, currentUser || null)
        
        // Add a small delay and retry to ensure the new order is available
        setTimeout(async () => {
          console.log('🔄 Retrying fetchMyOrders after delay...')
          try {
            await fetchMyOrders({ pageNumber: 1, pageSize: 20 }, currentUser || null)
          } catch (retryErr) {
            console.warn('Retry fetchMyOrders failed:', retryErr)
          }
        }, 1000)
      } catch (err) {
        console.error('❌ Error refreshing my orders:', err)
      }
      
      console.log('🔄 Refreshing pending orders...')
      await fetchPendingOrders()
      
      // Broadcast update so other hook instances can refetch
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders:updated'))
      }

      // Send notification to user who submitted the request
      try {
        const userDataStrForProductNotification = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
        const currentUserForProductNotification = userDataStrForProductNotification ? JSON.parse(userDataStrForProductNotification) : null
        
        if (currentUserForProductNotification) {
          console.log('📧 Sending product order submission notification to user:', {
            userId: currentUserForProductNotification.id,
            title: 'تم إرسال طلب منتج جديد',
            message: `تم إرسال طلب لـ ${normalized.quantity} قطعة من المنتج`
          })
          
          await notificationAPI.createNotification({
            userId: currentUserForProductNotification.id, // Notify the user who submitted the request
            title: 'تم إرسال طلب منتج جديد',
            message: `تم إرسال طلب لـ ${normalized.quantity} قطعة من المنتج`,
            type: 'product_order_submitted',
            priority: 'medium',
            relatedEntityId: newOrder?.id || newOrder?.Id,
            relatedEntityType: 'product_order'
          });
          
          console.log('✅ Product order submission notification sent to user successfully')
        }
      } catch (e) {
        console.error('❌ Failed to send notification after product order creation:', e);
      }
      
      // TODO: Send notification to all admins about new product order
      // This would require fetching admin users and sending notifications to each
      console.log('📧 Note: Admin notifications for new product orders not yet implemented')

      return { success: true, order: newOrder, message: `Order created successfully for ${orderData.quantity} item(s)` }
    } catch (err) {
      console.error('❌ Error creating product order:', err)
      let errorMessage = 'Failed to create order'
      if (err.message.includes('401')) errorMessage = 'Authentication error. Please sign in again.'
      else if (err.message.includes('400')) errorMessage = 'Invalid order data. Please check your input.'
      else if (err.message.includes('500')) errorMessage = 'Server error. Please try again later.'
      else if (err.message) errorMessage = err.message
      // setError removed - using toast notifications only
      return { success: false, error: errorMessage, details: err.message }
    }
  }

  // Create recharge request
  const createRechargeRequest = async (rechargeData) => {
    try {
      // setError removed - using toast notifications only
      if (!rechargeData.amount || rechargeData.amount <= 0) throw new Error('Invalid amount')
      if (!rechargeData.transferImage) throw new Error('Transfer image is required')

      // Convert to API format (uppercase keys)
      const apiData = {
        Amount: rechargeData.amount,
        TransferImage: rechargeData.transferImage,
        TransferImagePath: rechargeData.transferImagePath || ''
      }

      console.log('=== CREATING RECHARGE REQUEST ===')
      console.log('Recharge data:', rechargeData)
      console.log('API data format:', apiData)
      
      // Get current user info for debugging
      const userDataStrForDebug = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
      const currentUserForDebug = userDataStrForDebug ? JSON.parse(userDataStrForDebug) : null
      console.log('🔍 Current user info for recharge request:', {
        userId: currentUserForDebug?.id,
        userBalance: currentUserForDebug?.balance,
        userData: currentUserForDebug
      })
      
      const newRequest = await ordersAPI.registerRecharge(apiData)
      console.log('✅ Recharge request created successfully:', newRequest)
      console.log('🔍 New request type check:', {
        isArray: Array.isArray(newRequest),
        isObject: typeof newRequest === 'object' && newRequest !== null,
        hasId: !!(newRequest?.id || newRequest?.Id),
        id: newRequest?.id || newRequest?.Id,
        keys: newRequest ? Object.keys(newRequest) : 'null'
      })
      console.log('📋 New recharge request details:', {
        id: newRequest?.id || newRequest?.Id,
        amount: newRequest?.amount || newRequest?.Amount,
        transferImage: newRequest?.transferImage || newRequest?.TransferImage,
        transferImagePath: newRequest?.transferImagePath || newRequest?.TransferImagePath,
        status: newRequest?.status || newRequest?.Status,
        statusValue: newRequest?.statusValue || newRequest?.StatusValue,
        type: newRequest?.type || newRequest?.Type,
        typeValue: newRequest?.typeValue || newRequest?.TypeValue,
        forUserId: newRequest?.forUserId || newRequest?.ForUserId
      })
      
      // Check if the recharge request should be visible in my orders
      const requestStatus = newRequest?.status || newRequest?.Status || 0
      const requestType = newRequest?.type || newRequest?.Type || 2 // Recharge requests are usually type 2
      console.log('🔍 Recharge request visibility check:', {
        status: requestStatus,
        type: requestType,
        shouldBeVisible: true // All recharge requests should be visible to the user who created them
      })
      
      // Get current user for proper refresh
      const userDataStrForRefresh = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
      const currentUserForRefresh = userDataStrForRefresh ? JSON.parse(userDataStrForRefresh) : null
      
      // Don't add mock object to state immediately - wait for server refresh
      // The mock object has a temporary ID that won't match server data
      console.log('🔍 Recharge request created, will refresh from server instead of using mock object')

      // Refresh lists with multiple retries to ensure the new recharge request is available
      console.log('🔄 Refreshing orders list...')
      await fetchOrders()
      
      console.log('🔄 Refreshing my orders...')
      try {
        // First refresh
        await fetchMyOrders({ pageNumber: 1, pageSize: 50 }, currentUserForRefresh || null)
        
        // Second refresh after 1 second
        setTimeout(async () => {
          console.log('🔄 Second refresh of my orders...')
          try {
            await fetchMyOrders({ pageNumber: 1, pageSize: 50 }, currentUserForRefresh || null)
          } catch (retryErr) {
            console.warn('Second refresh failed:', retryErr)
          }
        }, 1000)
        
        // Third refresh after 3 seconds
        setTimeout(async () => {
          console.log('🔄 Third refresh of my orders...')
          try {
            await fetchMyOrders({ pageNumber: 1, pageSize: 50 }, currentUserForRefresh || null)
          } catch (retryErr) {
            console.warn('Third refresh failed:', retryErr)
          }
        }, 3000)
        
      } catch (err) {
        console.error('❌ Error refreshing my orders for recharge request:', err)
      }
      
      console.log('🔄 Refreshing pending orders...')
      await fetchPendingOrders()
      
      // Broadcast update so other hook instances can refetch
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders:updated'))
      }

      // Send notification to user who submitted the recharge request
      try {
        const userDataStrForNotification = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
        const currentUserForNotification = userDataStrForNotification ? JSON.parse(userDataStrForNotification) : null
        
        if (currentUserForNotification) {
          console.log('📧 Sending recharge request submission notification to user:', {
            userId: currentUserForNotification.id,
            title: 'تم إرسال طلب شحن جديد',
            message: `تم إرسال طلب شحن بمبلغ ${rechargeData.amount} ريال`
          })
          
          await notificationAPI.createNotification({
            userId: currentUserForNotification.id, // Notify the user who submitted the request
            title: 'تم إرسال طلب شحن جديد',
            message: `تم إرسال طلب شحن بمبلغ ${rechargeData.amount} ريال`,
            type: 'recharge_request_submitted',
            priority: 'medium',
            relatedEntityId: newRequest?.id || newRequest?.Id,
            relatedEntityType: 'recharge_request'
          });
          
          console.log('✅ Recharge request submission notification sent to user successfully')
        }
      } catch (e) {
        console.error('❌ Failed to send notification after recharge request creation:', e);
      }
      
      // TODO: Send notification to all admins about new recharge request
      // This would require fetching admin users and sending notifications to each
      console.log('📧 Note: Admin notifications for new recharge requests not yet implemented')

      console.log('🎉 Recharge request creation completed successfully!')
      console.log('📋 Final result:', { success: true, request: newRequest, message: 'Recharge request created successfully' })
      
      // Test: Try to fetch the recharge request immediately after creation using multiple approaches
      console.log('🧪 Testing: Fetching recharge request immediately after creation...')
      try {
        // Test Approach 1: Generic endpoint without type filter
        console.log('🧪 Test Approach 1: Generic endpoint without type filter...')
        const testAllRequests = await ordersAPI.getAllMyRequests({ pageNumber: 1, pageSize: 10 })
        const testAllList = extractOrderList(testAllRequests)
        console.log('🧪 Test all requests count:', testAllList?.length || 0)
        
        // Check for recharge requests in the list
        const rechargeRequests = testAllList.filter(o => 
          o?.amount != null || 
          String(o?.typeValue || o?.type || '').toLowerCase().includes('recharge') ||
          o?.type === 2 || o?.Type === 2
        )
        console.log('🧪 Test recharge requests found in all requests:', rechargeRequests.length)
        console.log('🧪 Test recharge requests details:', rechargeRequests)
        
        // Test Approach 2: Generic endpoint with type 2 specifically
        console.log('🧪 Test Approach 2: Generic endpoint with type 2...')
        const testRechargeRequests = await ordersAPI.getAllMyRequests({ pageNumber: 1, pageSize: 10, type: 2 })
        const testRechargeList = extractOrderList(testRechargeRequests)
        console.log('🧪 Test type 2 requests count:', testRechargeList?.length || 0)
        console.log('🧪 Test type 2 requests details:', testRechargeList)
        
      } catch (testErr) {
        console.warn('🧪 Test failed to fetch requests:', testErr)
      }
      
      return { success: true, request: newRequest, message: 'Recharge request created successfully' }
    } catch (err) {
      console.error('Error creating recharge request:', err)
      let errorMessage = 'Failed to create recharge request'
      if (err.message.includes('401')) errorMessage = 'Authentication error. Please sign in again.'
      else if (err.message.includes('400')) errorMessage = 'Invalid request data. Please check your input.'
      else if (err.message.includes('500')) errorMessage = 'Server error. Please try again later.'
      else if (err.message) errorMessage = err.message
      // setError removed - using toast notifications only
      return { success: false, error: errorMessage, details: err.message }
    }
  }

  // Edit recharge request
  const editRechargeRequest = async (id, rechargeData) => {
    try {
      // setError removed - using toast notifications only
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
      // setError removed - using toast notifications only
      return { success: false, error: err.message }
    }
  }

  // Edit product request
  const editProductRequest = async (id, orderData) => {
    try {
      // setError removed - using toast notifications only
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
      // setError removed - using toast notifications only
      return { success: false, error: err.message }
    }
  }

  // Approve request
  const approveRequest = async (orderId) => {
    try {
      console.log('=== APPROVING REQUEST ===')
      console.log('📋 Order ID:', orderId)
      console.log('📋 Current orders state:', orders?.length || 0)
      
      // Find the order before approval
      const orderToApprove = (orders || []).find(o => (o?.id ?? o?.Id) === orderId)
      console.log('📋 Order to approve:', orderToApprove)
      
      if (!orderToApprove) {
        console.warn('⚠️ Order not found in current state, proceeding with API call anyway')
      }
      
      console.log('🔄 Calling ordersAPI.approve...')
      const approveResult = await ordersAPI.approve(orderId)
      console.log('✅ API approve result:', approveResult)

      // Only update local state after confirming the API call succeeded
      console.log('✅ API call succeeded, updating local state')
      setOrders(prev => prev.map(o => {
        const id = o?.id ?? o?.Id
        return id === orderId ? { ...o, status: 1, statusValue: 'approved' } : o
      }))
      setPendingOrders(prev => prev.filter(o => (o?.id ?? o?.Id) !== orderId))
      
      console.log('✅ Local state updated after successful API call')
      console.log('🔄 Orders state after update:', orders?.length || 0)
      console.log('🔄 Pending orders after update:', pendingOrders?.length || 0)

      // Try to refresh the affected user's balance if this was a recharge
      try {
        const approvedOrder = (orders || []).find(o => (o?.id ?? o?.Id) === orderId)
        const isRecharge = approvedOrder && (approvedOrder.amount != null || String(approvedOrder.typeValue || approvedOrder.type || '').toLowerCase().includes('recharge'))
        const targetUserId = approvedOrder?.forUserId || approvedOrder?.requestedByUserId
        if (isRecharge && targetUserId) {
          const userDataStrForBalanceSync = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
          const currentUserForBalanceSync = userDataStrForBalanceSync ? JSON.parse(userDataStrForBalanceSync) : null
          const refreshedUser = await usersAPI.getById(targetUserId)
          const refreshedBalance = (refreshedUser?.balance ?? refreshedUser?.Balance ?? currentUserForBalanceSync?.balance)
          if (currentUserForBalanceSync && (currentUserForBalanceSync.id === targetUserId || String(currentUserForBalanceSync.id) === String(targetUserId))) {
            const updatedUserData = { ...currentUserForBalanceSync, balance: refreshedBalance }
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

      // Send notification to user about approval
      try {
        const order = (orders || []).find(o => (o?.id ?? o?.Id) === orderId);
        console.log('🔍 Order found for notification:', order)
        
        if (order && order.forUserId) {
          const isRecharge = order.amount != null || String(order.typeValue || order.type || '').toLowerCase().includes('recharge')
          
          let notificationTitle = 'تم قبول طلبك'
          let notificationMessage = ''
          
          if (isRecharge) {
            // Recharge request approved
            const amount = order.amount || order.Amount || 0
            notificationMessage = `تم قبول طلب شحن رصيدك بمبلغ ${amount} ريال`
          } else {
            // Product request approved
            const quantity = order.quantity || order.Quantity || 1
            const productName = order.productName || order.ProductName || 'المنتج'
            notificationMessage = `تم قبول طلبك لـ ${quantity} قطعة من ${productName}`
          }
          
          console.log('📧 Sending approval notification to user:', {
            userId: order.forUserId,
            title: notificationTitle,
            message: notificationMessage,
            isRecharge,
            orderId: order.id || order.Id,
            orderType: order.type || order.Type,
            orderTypeValue: order.typeValue || order.TypeValue
          })
          
          const notificationData = {
            userId: order.forUserId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'order_approved',
            priority: 'medium',
            relatedEntityId: order.id || order.Id,
            relatedEntityType: 'order'
          }
          
          console.log('📧 Notification data prepared:', notificationData)
          
          // Try to manually create notification as backup
          let manualNotificationResult = null
          try {
            console.log('📧 Attempting to manually create notification...')
            manualNotificationResult = await notificationAPI.createNotification(notificationData)
            console.log('✅ Manual notification creation result:', manualNotificationResult)
          } catch (manualError) {
            console.warn('⚠️ Manual notification creation failed:', manualError)
            console.log('📧 Backend should automatically create notification for order approval')
          }
          
          // Try SignalR to send real-time notification if available
          let signalRResult = null
          try {
            if (typeof window !== 'undefined' && window.signalRService && window.signalRService.isConnected) {
              console.log('📧 Sending real-time notification via SignalR...')
              signalRResult = await window.signalRService.sendNotificationToUser(
                order.forUserId, 
                notificationData
              )
              console.log('✅ SignalR notification sent:', signalRResult)
            } else {
              console.log('📧 SignalR not available for real-time notification')
            }
          } catch (signalRError) {
            console.warn('⚠️ SignalR notification failed:', signalRError)
          }
          
          console.log('✅ SignalR notification attempt completed')
          
          // Now let's check if the notification actually appears in the system
          console.log('🔍 Checking if notification was created in the system...')
          try {
            const userNotifications = await notificationAPI.getUserNotifications()
            console.log('🔍 Current user notifications:', userNotifications)
            
            // Check if our notification appears in the response
            if (userNotifications?.data) {
              const { approvals, tasks } = userNotifications.data
              console.log('🔍 Approvals array:', approvals)
              console.log('🔍 Tasks array:', tasks)
              
              // Look for our notification
              const foundInApprovals = approvals?.find(n => 
                n.title === notificationTitle || 
                n.message === notificationMessage ||
                n.relatedEntityId === order.id || order.Id
              )
              
              const foundInTasks = tasks?.find(n => 
                n.title === notificationTitle || 
                n.message === notificationMessage ||
                n.relatedEntityId === order.id || order.Id
              )
              
              if (foundInApprovals) {
                console.log('✅ Notification found in approvals array:', foundInApprovals)
              } else if (foundInTasks) {
                console.log('✅ Notification found in tasks array:', foundInTasks)
              } else {
                console.log('⚠️ Notification not found in either array - might be created elsewhere or not working')
              }
            }
            
            // Also check if notifications are created automatically by the system
            console.log('🔍 Checking if system creates notifications automatically...')
            try {
              const autoCheckResult = await notificationAPI.checkNotificationCreation(order.id || order.Id, 'approve')
              console.log('🔍 Auto-creation check result:', autoCheckResult)
              
              if (autoCheckResult.hasNewNotifications) {
                console.log('✅ System automatically created notifications!')
                console.log('✅ New approvals:', autoCheckResult.newApprovals)
                console.log('✅ New tasks:', autoCheckResult.newTasks)
              } else {
                console.log('⚠️ System did not create notifications automatically')
              }
            } catch (e) {
              console.error('❌ Failed to check auto-creation:', e)
            }
          } catch (e) {
            console.error('❌ Failed to check user notifications:', e)
          }
        } else {
          console.warn('⚠️ Cannot send notification: order or forUserId not found', {
            order: !!order,
            forUserId: order?.forUserId,
            orderId: order?.id || order?.Id
          })
        }
      } catch (e) {
        console.error('❌ Failed to send user notification after approve:', e);
        console.error('❌ Error details:', {
          message: e.message,
          stack: e.stack,
          orderId
        })
      }

      // Send notification to supervisor (if applicable)
      try {
        const order = (orders || []).find(o => (o?.id ?? o?.Id) === orderId);
        if (order && order.requestedByUserId && order.requestedByUserId !== order.forUserId) {
          const isRecharge = order.amount != null || String(order.typeValue || order.type || '').toLowerCase().includes('recharge')
          
          let notificationTitle = 'تم قبول طلب'
          let notificationMessage = ''
          
          if (isRecharge) {
            // Recharge request approved
            const amount = order.amount || order.Amount || 0
            notificationMessage = `تم قبول طلب شحن رصيد بمبلغ ${amount} ريال للعميل`
          } else {
            // Product request approved
            const quantity = order.quantity || order.Quantity || 1
            const productName = order.productName || order.ProductName || 'المنتج'
            notificationMessage = `تم قبول الطلب رقم ${order.id} لـ ${quantity} قطعة من ${productName}`
          }
          
          console.log('📧 Sending approval notification to supervisor:', {
            userId: order.requestedByUserId,
            title: notificationTitle,
            message: notificationMessage,
            isRecharge
          })
          
          await notificationAPI.createNotification({
            userId: order.requestedByUserId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'order_approved_supervisor',
            priority: 'medium',
            relatedEntityId: order.id,
            relatedEntityType: 'order'
          });
          
          console.log('✅ Approval notification sent to supervisor successfully')
        }
      } catch (e) {
        console.error('❌ Failed to send supervisor notification after approve:', e);
      }

      return { success: true }
    } catch (err) {
      // Don't set page error, only show toast notification
      console.error('❌ Approve failed:', err.message)
      return { success: false, error: err.message }
    }
  }

  // Reject request
  const rejectRequest = async (orderId) => {
    try {
      // Don't set page error, only show toast notification
      console.log('🔄 Calling ordersAPI.reject...')
      const rejectResult = await ordersAPI.reject(orderId)
      console.log('✅ API reject result:', rejectResult)

      // Only update local state after confirming the API call succeeded
      console.log('✅ API call succeeded, updating local state')
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

      // Send notification to user about rejection
      try {
        const order = (orders || []).find(o => (o?.id ?? o?.Id) === orderId);
        if (order && order.forUserId) {
          const isRecharge = order.amount != null || String(order.typeValue || order.type || '').toLowerCase().includes('recharge')
          
          let notificationTitle = 'تم رفض طلبك'
          let notificationMessage = ''
          
          if (isRecharge) {
            // Recharge request rejected
            const amount = order.amount || order.Amount || 0
            notificationMessage = `تم رفض طلب شحن رصيدك بمبلغ ${amount} ريال`
          } else {
            // Product request rejected
            const quantity = order.quantity || order.Quantity || 1
            const productName = order.productName || order.ProductName || 'المنتج'
            notificationMessage = `تم رفض طلبك لـ ${quantity} قطعة من ${productName}`
          }
          
          console.log('📧 Sending rejection notification to user:', {
            userId: order.forUserId,
            title: notificationTitle,
            message: notificationMessage,
            isRecharge
          })
          
          await notificationAPI.createNotification({
            userId: order.forUserId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'order_rejected',
            priority: 'high',
            relatedEntityId: order.id,
            relatedEntityType: 'order'
          });
          
          console.log('✅ Rejection notification sent to user successfully')
        }
      } catch (e) {
        console.error('❌ Failed to send user notification after reject:', e);
      }

      return { success: true }
    } catch (err) {
      // Don't set page error, only show toast notification
      console.error('❌ Reject failed:', err.message)
      return { success: false, error: err.message }
    }
  }

  // Delete order
  const deleteOrder = async (orderId) => {
    try {
      await ordersAPI.delete(orderId)
      await fetchOrders()
      await fetchPendingOrders()

      // Send notification to user about deletion
      try {
        const order = (orders || []).find(o => (o?.id ?? o?.Id) === orderId);
        if (order && order.forUserId) {
          const isRecharge = order.amount != null || String(order.typeValue || order.type || '').toLowerCase().includes('recharge')
          
          let notificationTitle = 'تم حذف طلبك'
          let notificationMessage = ''
          
          if (isRecharge) {
            // Recharge request deleted
            const amount = order.amount || order.Amount || 0
            notificationMessage = `تم حذف طلب شحن رصيدك بمبلغ ${amount} ريال`
          } else {
            // Product request deleted
            const quantity = order.quantity || order.Quantity || 1
            const productName = order.productName || order.ProductName || 'المنتج'
            notificationMessage = `تم حذف طلبك لـ ${quantity} قطعة من ${productName}`
          }
          
          console.log('📧 Sending deletion notification to user:', {
            userId: order.forUserId,
            title: notificationTitle,
            message: notificationMessage,
            isRecharge
          })
          
          await notificationAPI.createNotification({
            userId: order.forUserId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'order_deleted',
            priority: 'high',
            relatedEntityId: order.id,
            relatedEntityType: 'order'
          });
          
          console.log('✅ Deletion notification sent to user successfully')
        }
      } catch (e) {
        console.error('❌ Failed to send user notification after delete:', e);
      }

      return { success: true }
    } catch (err) {
      // Don't set page error, only show toast notification
      console.error('❌ Delete failed:', err.message)
      return { success: false, error: err.message }
    }
  }

  // Get order by ID
  const getOrderById = async (orderId) => {
    try {
      const order = await ordersAPI.getById(orderId)
      return { success: true, order }
    } catch (err) {
      // Don't set page error, only show toast notification
      console.error('❌ Get order by ID failed:', err.message)
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
  }, [fetchOrders, fetchPendingOrders])
  
  // Debug: Monitor myOrders state changes
  useEffect(() => {
    console.log('🔍 useOrders hook - myOrders state changed:', {
      myOrders,
      myOrdersLength: myOrders?.length || 0,
      myOrdersType: typeof myOrders,
      myOrdersIsArray: Array.isArray(myOrders),
      myOrdersKeys: myOrders ? Object.keys(myOrders) : 'N/A'
    })
  }, [myOrders])



  // Test notification function
  const testNotification = async () => {
    try {
      console.log('🧪 Testing notification system...')
      const testData = {
        userId: 1, // Test user ID
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'test',
        priority: 'low',
        relatedEntityId: 999,
        relatedEntityType: 'test'
      }
      
      console.log('🧪 Test notification data:', testData)
      const result = await notificationAPI.createNotification(testData)
      console.log('🧪 Test notification result:', result)
      return { success: true, result }
    } catch (error) {
      console.error('🧪 Test notification failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Investigate notification API structure
  const investigateNotificationAPI = async () => {
    try {
      console.log('🔍 Investigating notification API structure...')
      const results = await notificationAPI.investigateNotificationAPI()
      console.log('🔍 Investigation results:', results)
      return { success: true, results }
    } catch (error) {
      console.error('🔍 Investigation failed:', error)
      return { success: false, error: error.message }
    }
  }



  // Check if notifications are created automatically
  const checkNotificationCreation = async (orderId, action) => {
    try {
      console.log('🔍 Checking notification creation...')
      const results = await notificationAPI.checkNotificationCreation(orderId, action)
      console.log('🔍 Check results:', results)
      return results
    } catch (error) {
      console.error('🔍 Check failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Test API endpoints directly
  const testAPIEndpoints = async () => {
    try {
      console.log('🧪 Testing API endpoints directly...')
      
      // Test 1: Generic endpoint with no filters
      console.log('🧪 Test 1: Generic endpoint with no filters...')
      try {
        const result1 = await ordersAPI.getAllMyRequests({})
        console.log('✅ Test 1 result:', result1)
        const list1 = extractOrderList(result1)
        console.log('📋 Test 1 extracted list:', list1.length, 'items')
        console.log('📊 Test 1 details:', list1.map(o => ({
          id: o?.id ?? o?.Id,
          type: o?.type ?? o?.Type,
          typeValue: o?.typeValue ?? o?.TypeValue,
          amount: o?.amount ?? o?.Amount,
          productId: o?.productId ?? o?.ProductId,
          productName: o?.productName ?? o?.ProductName,
          isRecharge: !!(o?.amount != null || String(o?.typeValue || o?.type || '').toLowerCase().includes('recharge'))
        })))
        
        // Analyze all unique type values
        const allTypes = new Set()
        const allTypeValues = new Set()
        list1.forEach(o => {
          if (o?.type != null) allTypes.add(o.type)
          if (o?.Type != null) allTypes.add(o.Type)
          if (o?.typeValue != null) allTypeValues.add(o.typeValue)
          if (o?.TypeValue != null) allTypeValues.add(o.TypeValue)
        })
        console.log('🔍 All unique type values found:', Array.from(allTypes))
        console.log('🔍 All unique typeValue values found:', Array.from(allTypeValues))
      } catch (e) {
        console.error('❌ Test 1 failed:', e.message)
      }
      
      // Test 2: Generic endpoint with minimal filters
      console.log('🧪 Test 2: Generic endpoint with minimal filters...')
      try {
        const result2 = await ordersAPI.getAllMyRequests({ pageNumber: 1, pageSize: 10 })
        console.log('✅ Test 2 result:', result2)
        const list2 = extractOrderList(result2)
        console.log('📋 Test 2 extracted list:', list2.length, 'items')
        console.log('📊 Test 2 details:', list2.map(o => ({
          id: o?.id ?? o?.Id,
          type: o?.type ?? o?.Type,
          typeValue: o?.typeValue ?? o?.TypeValue,
          amount: o?.amount ?? o?.Amount,
          productId: o?.productId ?? o?.ProductId,
          productName: o?.productName ?? o?.ProductName,
          isRecharge: !!(o?.amount != null || String(o?.typeValue || o?.type || '').toLowerCase().includes('recharge'))
        })))
      } catch (e) {
        console.error('❌ Test 2 failed:', e.message)
      }
      
      // Test 3: Generic endpoint with type filter
      console.log('🧪 Test 3: Generic endpoint with type filter...')
      try {
        const result3 = await ordersAPI.getAllMyRequests({ pageNumber: 1, pageSize: 10, type: 1 })
        console.log('✅ Test 3 result:', result3)
        const list3 = extractOrderList(result3)
        console.log('📋 Test 3 extracted list:', list3.length, 'items')
        console.log('📊 Test 3 details:', list3.map(o => ({
          id: o?.id ?? o?.Id,
          type: o?.type ?? o?.Type,
          typeValue: o?.typeValue ?? o?.TypeValue,
          productId: o?.productId ?? o?.ProductId,
          productName: o?.productName ?? o?.ProductName
        })))
      } catch (error) {
        console.error('❌ Test 3 failed:', error.message)
      }
      
      // Test 4: Generic endpoint with recharge type
      console.log('🧪 Test 4: Generic endpoint with recharge type...')
      try {
        const result4 = await ordersAPI.getAllMyRequests({ pageNumber: 1, pageSize: 10, type: 2 })
        console.log('✅ Test 4 result:', result4)
        const list4 = extractOrderList(result4)
        console.log('📋 Test 4 extracted list:', list4.length, 'items')
        console.log('📊 Test 4 details:', list4.map(o => ({
          id: o?.id ?? o?.Id,
          type: o?.type ?? o?.Type,
          typeValue: o?.typeValue ?? o?.TypeValue,
          amount: o?.amount ?? o?.Amount
        })))
      } catch (error) {
        console.error('❌ Test 4 failed:', error.message)
      }
      
      // Test 5: Try different type values that might be used
      console.log('🧪 Test 5: Testing different possible type values...')
      const possibleTypes = [0, 1, 2, 3, 4, 5, 'Product', 'Recharge', 'product', 'recharge']
      for (const testType of possibleTypes) {
        try {
          console.log(`🧪 Testing type: ${testType}...`)
          const result = await ordersAPI.getAllMyRequests({ pageNumber: 1, pageSize: 10, type: testType })
          const list = extractOrderList(result)
          if (list && list.length > 0) {
            console.log(`✅ Found ${list.length} orders with type ${testType}:`, list.map(o => ({
              id: o?.id ?? o?.Id,
              type: o?.type ?? o?.Type,
              typeValue: o?.typeValue ?? o?.TypeValue,
              amount: o?.amount ?? o?.Amount,
              productId: o?.productId ?? o?.ProductId,
              productName: o?.productName ?? o?.ProductName
            })))
          }
        } catch (error) {
          console.log(`❌ Type ${testType} failed:`, error.message)
        }
      }
      
      return { success: true, message: 'API endpoint tests completed' }
    } catch (error) {
      console.error('🧪 API endpoint tests failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Analyze current orders and their type values
  const analyzeCurrentOrders = async () => {
    try {
      console.log('🔍 Analyzing current orders and their type values...')
      
      // Get current user data
      const currentUserData = localStorage.getItem('userData')
      const currentUser = currentUserData ? JSON.parse(currentUserData) : null
      console.log('👤 Current user:', currentUser)
      
      // Test multiple API approaches
      console.log('🧪 Testing multiple API approaches...')
      
      // Approach 1: No filters
      console.log('📡 Approach 1: Fetching all orders without filter...')
      const allOrdersResponse = await ordersAPI.getAllMyRequests({})
      console.log('📡 All orders response:', allOrdersResponse)
      
      const allOrdersList = extractOrderList(allOrdersResponse)
      console.log('📋 All orders list:', allOrdersList)
      
      // Approach 2: Try with different type values
      console.log('📡 Approach 2: Testing different type values...')
      const typeTests = [0, 1, 2, 3, 4, 5, 'Product', 'Recharge', 'product', 'recharge']
      for (const testType of typeTests) {
        try {
          console.log(`📡 Testing type: ${testType}...`)
          const response = await ordersAPI.getAllMyRequests({ type: testType })
          const list = extractOrderList(response)
          if (list && list.length > 0) {
            console.log(`✅ Found ${list.length} orders with type ${testType}:`, list.map(o => ({
              id: o?.id ?? o?.Id,
              type: o?.type ?? o?.Type,
              typeValue: o?.typeValue ?? o?.TypeValue,
              amount: o?.amount ?? o?.Amount,
              productId: o?.productId ?? o?.ProductId,
              productName: o?.productName ?? o?.ProductName
            })))
          }
        } catch (error) {
          console.log(`❌ Type ${testType} failed:`, error.message)
        }
      }
      
      // Approach 3: Try admin endpoint (if available)
      console.log('📡 Approach 3: Testing admin endpoint...')
      try {
        const adminResponse = await ordersAPI.getAll({ pageNumber: 1, pageSize: 10 })
        const adminList = extractOrderList(adminResponse)
        console.log('📋 Admin orders list:', adminList.length, 'items')
        console.log('📊 Admin orders details:', adminList.map(o => ({
          id: o?.id ?? o?.Id,
          type: o?.type ?? o?.Type,
          typeValue: o?.typeValue ?? o?.TypeValue,
          amount: o?.amount ?? o?.Amount,
          productId: o?.productId ?? o?.ProductId,
          productName: o?.productName ?? o?.ProductName,
          requestedByUserId: o?.requestedByUserId ?? o?.RequestedByUserId,
          forUserId: o?.forUserId ?? o?.ForUserId
        })))
        
        // Find recharge orders in admin list
        const adminRechargeOrders = adminList.filter(o => 
          o?.amount != null || o?.Amount != null ||
          String(o?.typeValue || o?.type || o?.TypeValue || o?.Type || '').toLowerCase().includes('recharge') ||
          o?.type === 2 || o?.Type === 2 || o?.typeValue === 2 || o?.TypeValue === 2
        )
        console.log('🔍 Admin recharge orders found:', adminRechargeOrders.length)
        console.log('📊 Admin recharge orders details:', adminRechargeOrders)
      } catch (error) {
        console.log('❌ Admin endpoint failed:', error.message)
      }
      
      // Analyze each order in detail
      console.log('🔍 Detailed analysis of each order:')
      allOrdersList.forEach((order, index) => {
        console.log(`📊 Order ${index + 1}:`, {
          // Basic info
          id: order?.id ?? order?.Id,
          requestedByUserId: order?.requestedByUserId ?? order?.RequestedByUserId,
          forUserId: order?.forUserId ?? order?.ForUserId,
          status: order?.status ?? order?.Status,
          
          // Type information
          type: order?.type ?? order?.Type,
          typeValue: order?.typeValue ?? order?.TypeValue,
          typeString: String(order?.typeValue || order?.type || order?.TypeValue || order?.Type || ''),
          
          // Product information
          productId: order?.productId ?? order?.ProductId,
          productName: order?.productName ?? order?.ProductName,
          quantity: order?.quantity ?? order?.Quantity,
          
          // Recharge information
          amount: order?.amount ?? order?.Amount,
          
          // Detection logic
          hasAmount: order?.amount != null || order?.Amount != null,
          hasProductId: order?.productId != null || order?.ProductId != null,
          hasProductName: order?.productName != null || order?.ProductName != null,
          hasQuantity: order?.quantity != null || order?.Quantity != null,
          
          // Type detection
          isRechargeByAmount: !!(order?.amount != null || order?.Amount != null),
          isRechargeByType: String(order?.typeValue || order?.type || order?.TypeValue || order?.Type || '').toLowerCase().includes('recharge'),
          isRechargeByTypeValue: order?.type === 2 || order?.Type === 2 || order?.typeValue === 2 || order?.TypeValue === 2,
          isProductByType: order?.type === 1 || order?.Type === 1 || order?.typeValue === 1 || order?.TypeValue === 1,
          
          // User matching
          matchesCurrentUser: String(order?.requestedByUserId ?? order?.RequestedByUserId) === String(currentUser?.id ?? currentUser?.Id),
          matchesForUser: String(order?.forUserId ?? order?.ForUserId) === String(currentUser?.id ?? currentUser?.Id)
        })
      })
      
      // Summary
      const productOrders = allOrdersList.filter(o => 
        o?.productId != null || o?.ProductId != null || 
        o?.productName != null || o?.ProductName != null ||
        o?.quantity != null || o?.Quantity != null
      )
      
      const rechargeOrders = allOrdersList.filter(o => 
        o?.amount != null || o?.Amount != null ||
        String(o?.typeValue || o?.type || o?.TypeValue || o?.Type || '').toLowerCase().includes('recharge') ||
        o?.type === 2 || o?.Type === 2 || o?.typeValue === 2 || o?.TypeValue === 2
      )
      
      // Test specific recharge endpoints
      console.log('📡 Approach 4: Testing specific recharge endpoints...')
      try {
        // Test if there's a specific recharge endpoint
        const rechargeResponse = await ordersAPI.getRechargeRequestsForZeroBalance({ pageNumber: 1, pageSize: 10 })
        const rechargeList = extractOrderList(rechargeResponse)
        console.log('📋 Recharge-specific endpoint result:', rechargeList.length, 'items')
        console.log('📊 Recharge-specific details:', rechargeList)
      } catch (error) {
        console.log('❌ Recharge-specific endpoint failed:', error.message)
      }
      
      try {
        // Test multi-approach recharge endpoint
        const multiRechargeResponse = await ordersAPI.getRechargeRequestsMultiApproach({ pageNumber: 1, pageSize: 10 })
        const multiRechargeList = extractOrderList(multiRechargeResponse)
        console.log('📋 Multi-approach recharge result:', multiRechargeList.length, 'items')
        console.log('📊 Multi-approach recharge details:', multiRechargeList)
      } catch (error) {
        console.log('❌ Multi-approach recharge endpoint failed:', error.message)
      }
      
      console.log('📊 Summary:')
      console.log(`   Total orders: ${allOrdersList.length}`)
      console.log(`   Product orders: ${productOrders.length}`)
      console.log(`   Recharge orders: ${rechargeOrders.length}`)
      console.log(`   Orders matching current user: ${allOrdersList.filter(o => String(o?.requestedByUserId ?? o?.RequestedByUserId) === String(currentUser?.id ?? currentUser?.Id)).length}`)

  return {
        success: true, 
        totalOrders: allOrdersList.length,
        productOrders: productOrders.length,
        rechargeOrders: rechargeOrders.length,
        orders: allOrdersList
      }
    } catch (error) {
      console.error('🔍 Analysis failed:', error)
      return { success: false, error: error.message }
    }
  }

  const returnObject = {
    orders,
    myOrders,
    pendingOrders,
    loading,
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
    getOrdersByDateRange,
    testNotification,
    investigateNotificationAPI,
    checkNotificationCreation,
    testAPIEndpoints,
    analyzeCurrentOrders
  }
  
  console.log('🔧 useOrders hook - returning object:', {
    hasFetchMyOrders: !!returnObject.fetchMyOrders,
    fetchMyOrdersType: typeof returnObject.fetchMyOrders,
    fetchMyOrdersName: returnObject.fetchMyOrders?.name || 'anonymous',
    allKeys: Object.keys(returnObject)
  })
  
  return returnObject
} 