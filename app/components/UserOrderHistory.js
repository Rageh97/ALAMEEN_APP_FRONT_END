'use client'

import { useState, useEffect } from 'react'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'

export default function UserOrderHistory() {
  const { user } = useAuth()
  const { myOrders, loading, error, fetchMyOrders } = useOrders()
  const [showHistory, setShowHistory] = useState(true)

  useEffect(() => {
    if (user?.id) {
      console.log('UserOrderHistory: User ID found, calling fetchMyOrders')
      fetchMyOrders({ pageNumber: 1, pageSize: 20 }, user)
    }
  }, [user?.id, fetchMyOrders])

  // Use the server-filtered list directly
  const userOrders = myOrders || []
  
  console.log('UserOrderHistory render - user:', user?.id, 'myOrders:', myOrders, 'userOrders:', userOrders, 'loading:', loading, 'error:', error)

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

  if (!user) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">My Orders</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMyOrders({ pageNumber: 1, pageSize: 20 }, user)}
            className="btn-secondary"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              console.log('Debug: Current state - user:', user, 'myOrders:', myOrders)
              console.log('Debug: Calling fetchMyOrders manually')
              fetchMyOrders({ pageNumber: 1, pageSize: 20 }, user)
            }}
            className="btn-secondary bg-blue-500 text-white"
          >
            Debug
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary"
          >
            {showHistory ? 'Hide' : 'Show'}
          </button>
        </div>
      </div> */}

      {/* {showHistory && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading orders...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">Error: {error}</div>
          ) : userOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders found.</div>
          ) : (
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
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userOrders.map((order) => (
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt || order.dateCreated).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )} */}
    </div>
  )
}
