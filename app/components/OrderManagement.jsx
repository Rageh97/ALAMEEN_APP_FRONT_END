'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'

export default function OrderManagement() {
  const { user } = useAuth()
  const {
    orders,
    pendingOrders,
    loading,
    error,
    fetchOrders,
    fetchPendingOrders,
    approveRequest,
    rejectRequest,
    deleteOrder,
    getOrdersByStatus,
    getOrdersByType,
    getOrdersForUser,
    clearError
  } = useOrders()

  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Filter orders based on user role and selected filters
  const getFilteredOrders = () => {
    try {
      let filtered = [...orders]

      // Filter by status
      if (filters.status && filters.status !== '') {
        const statusValue = parseInt(filters.status)
        if (!isNaN(statusValue)) {
          filtered = filtered.filter(order => order.status === statusValue)
        }
      }

      // Filter by type
      if (filters.type && filters.type !== '') {
        const typeValue = parseInt(filters.type)
        if (!isNaN(typeValue)) {
          filtered = filtered.filter(order => order.type === typeValue)
        }
      }

      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        filtered = filtered.filter(order => {
          try {
            const orderDate = new Date(order.createdAt || order.dateCreated)
            if (isNaN(orderDate.getTime())) return true // Skip invalid dates
            
            const from = filters.dateFrom ? new Date(filters.dateFrom) : null
            const to = filters.dateTo ? new Date(filters.dateTo) : null
            
            if (from && !isNaN(from.getTime()) && orderDate < from) return false
            if (to && !isNaN(to.getTime()) && orderDate > to) return false
            return true
          } catch (dateError) {
            console.warn('Date filtering error:', dateError)
            return true // Include order if date parsing fails
          }
        })
      }

      // Filter by search term
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase().trim()
        filtered = filtered.filter(order => 
          (order.productName && order.productName.toLowerCase().includes(term)) ||
          (order.requestedByUserName && order.requestedByUserName.toLowerCase().includes(term)) ||
          (order.forUserId && order.forUserId.toString().includes(term))
        )
      }

      // Filter by user role (supervisors see only their users' orders)
      if (user?.userType === 30) { // Supervisor role
        filtered = filtered.filter(order => 
          order.supervisorId === user.id || 
          order.requestedByUserId === user.id
        )
      }

      return filtered
    } catch (filterError) {
      console.error('Error filtering orders:', filterError)
      return orders // Return unfiltered orders if filtering fails
    }
  }

  // Get pending orders from main orders list as fallback
  const getPendingOrdersFromMain = () => {
    try {
      return orders.filter(order => order.status === 0)
    } catch (error) {
      console.error('Error getting pending orders from main list:', error)
      return []
    }
  }

  // Use pending orders from API or fallback to main list
  const effectivePendingOrders = pendingOrders.length > 0 ? pendingOrders : getPendingOrdersFromMain()

  const handleApprove = async (orderId) => {
    const result = await approveRequest(orderId)
    if (result.success) {
      toast.success('تمت الموافقة على الطلب بنجاح!')
    } else {
      toast.error(`فشل في الموافقة على الطلب: ${result.error}`)
    }
  }

  const handleReject = async (orderId) => {
    const result = await rejectRequest(orderId)
    if (result.success) {
      toast.success('تم رفض الطلب بنجاح!')
    } else {
      toast.error(`فشل في رفض الطلب: ${result.error}`)
    }
  }

  const handleDelete = async (orderId) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا الطلب؟')) {
      const result = await deleteOrder(orderId)
      if (result.success) {
        toast.success('تم حذف الطلب بنجاح!')
      } else {
        toast.error(`فشل في حذف الطلب: ${result.error}`)
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: 'Pending', color: 'bg-yellow-500' },
      1: { text: 'Approved', color: 'bg-green-500' },
      2: { text: 'Rejected', color: 'bg-red-500' }
    }
    const statusInfo = statusMap[status] || { text: 'Unknown', color: 'bg-gray-500' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs text-white ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const typeMap = {
      1: { text: 'Product', color: 'bg-blue-500' },
      2: { text: 'Recharge', color: 'bg-purple-500' }
    }
    const typeInfo = typeMap[type] || { text: 'Unknown', color: 'bg-gray-500' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs text-white ${typeInfo.color}`}>
        {typeInfo.text}
      </span>
    )
  }

  const filteredOrders = getFilteredOrders()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl">Loading orders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 text-center mb-4">
          <div className="text-lg font-semibold mb-2">Error Loading Orders</div>
          <div className="text-sm">{error}</div>
        </div>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => {
              clearError()
              fetchOrders()
            }} 
            className="btn-primary"
          >
            Retry
          </button>
          <button 
            onClick={() => {
              clearError()
              fetchPendingOrders()
            }} 
            className="btn-secondary"
          >
            Retry Pending Orders
          </button>
        </div>
        {error.includes('System.NullReferenceException') && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 text-sm">
              <strong>Technical Note:</strong> This error suggests the API received invalid parameters. 
              The system has been updated to handle this better. If the issue persists, please contact support.
            </div>
          </div>
        )}
        {error.includes('System.InvalidOperationException') && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-800 text-sm">
              <strong>Backend Issue Detected:</strong> The server is experiencing a database query error. 
              The system is now using an alternative method to load pending orders. This should resolve automatically.
            </div>
          </div>
        )}
        {error.includes('Backend query error') && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 text-sm">
              <strong>Workaround Applied:</strong> The system detected a backend issue and automatically switched 
              to an alternative method for loading pending orders. This should work normally now.
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Order Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Note: Pending orders are loaded using an alternative method due to backend optimization
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setError(null)
              fetchOrders()
              fetchPendingOrders()
            }}
            disabled={loading}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Refreshing...' : 'Refresh All'}
          </button>
          <button
            onClick={() => {
              setError(null)
              // Test with minimal parameters
              fetchOrders({ pageNumber: 1, pageSize: 10 })
            }}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
          >
            Test Basic API
          </button>
          <button
            onClick={() => {
              setError(null)
              fetchPendingOrders()
            }}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
          >
            Refresh Pending
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button
            onClick={() => {
              setFilters({
                status: '',
                type: '',
                dateFrom: '',
                dateTo: '',
                searchTerm: ''
              })
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="">All Statuses</option>
                <option value="0">Pending</option>
                <option value="1">Approved</option>
                <option value="2">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="1">Product</option>
                <option value="2">Recharge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
          <div className="text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {effectivePendingOrders.length}
          </div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {getOrdersByStatus(1).length}
          </div>
          <div className="text-gray-600">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">
            {getOrdersByStatus(2).length}
          </div>
          <div className="text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {order.type === 1 ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {order.productName || 'Product Order'}
                          </div>
                          <div className="text-gray-500">
                            Quantity: {order.quantity || 1}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-gray-900">
                            Recharge Request
                          </div>
                          <div className="text-gray-500">
                            Amount: ${order.amount || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getTypeBadge(order.type)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.requestedByUserName || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {order.requestedByUserId || order.forUserId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt || order.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    {order.status === 0 && (
                      <>
                        <button
                          onClick={() => handleApprove(order.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No orders found matching the current filters.
          </div>
        )}
      </div>
    </div>
  )
}
