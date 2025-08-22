'use client'

import { useState } from 'react'

export default function OrderConfirmation({ orders, onClose, onViewOrders, targetUserId }) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible || !orders || orders.length === 0) {
    return null
  }

  const successfulOrders = orders.filter(order => order.success)
  const totalItems = successfulOrders.reduce((sum, order) => sum + order.product.quantity, 0)
  const totalCost = successfulOrders.reduce((sum, order) => sum + (order.product.pointsCost || order.product.price) * order.product.quantity, 0)

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) onClose()
  }

  const handleViewOrders = () => {
    if (onViewOrders) onViewOrders()
    handleClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto transform transition-all duration-300 scale-100">
        {/* Success Header */}
        <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-t-2xl">
          <div className="text-7xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-green-700 mb-3">Orders Placed Successfully!</h2>
          <p className="text-gray-600 text-lg">
            Your {successfulOrders.length} order(s) have been submitted and are now pending approval.
          </p>
          {targetUserId && (
            <div className="mt-4 inline-block bg-green-200 px-4 py-2 rounded-full">
              <span className="text-sm text-green-800 font-medium">
                Orders placed for: <span className="font-bold">User {targetUserId}</span>
              </span>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="p-6 bg-gray-50">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Order Summary:</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Total Orders:</span>
              <span className="font-bold text-lg text-blue-600">{successfulOrders.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-bold text-lg text-blue-600">{totalItems}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Total Cost:</span>
              <span className="font-bold text-xl text-green-600">${totalCost.toFixed(2)}</span>
            </div>
            {targetUserId && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">For User:</span>
                <span className="font-bold text-lg text-blue-600">User {targetUserId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Order Details:</h3>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {successfulOrders.map((order, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{order.product.name}</span>
                    <span className="text-sm text-gray-500 ml-2">x{order.product.quantity}</span>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">
                  Order #{order.order?.id || 'Created'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex space-x-4">
            <button
              onClick={handleViewOrders}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              View My Orders
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-400 transition-colors shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="px-6 pb-6 text-center">
          <div className="text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-medium text-gray-600">Order Status</span>
            </div>
            You will receive updates on your order status. Orders typically take 1-2 business days to process.
          </div>
        </div>
      </div>
    </div>
  )
}
