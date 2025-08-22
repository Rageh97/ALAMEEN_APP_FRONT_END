'use client'

import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'
import OrderConfirmation from './OrderConfirmation'

export default function CartSummary() {
  const { cart, updateQuantity, getCartTotal, getCartItemCount, clearCart, removeFromCart, isCartValid, getCartValidationErrors } = useCart()
  const { createProductOrder, loading } = useOrders()
  const { user } = useAuth()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [orderResults, setOrderResults] = useState([])
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [customUserId, setCustomUserId] = useState('')
  const [orderForOther, setOrderForOther] = useState(false)
  const [toasts, setToasts] = useState([])

  const pushToast = (text, type = 'success', durationMs = 2500) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, durationMs)
  }

  // Don't render if cart is empty or user is not loaded
  if (cart.length === 0 || !user) {
    return null
  }

  const handleCheckout = async () => {
    if (!cart.length || !user) return

    setIsProcessing(true)
    setMessage('')
    setOrderResults([])
    setShowConfirmation(false)

    console.log('Checkout started - User:', user, 'Cart:', cart, 'Custom User ID:', customUserId)
    
    if (orderForOther && !customUserId) {
      setIsProcessing(false)
      setMessage('')
      pushToast('Please enter the target User ID.', 'error')
      return
    }

    const targetUserId = (orderForOther ? customUserId : '') || user.id
    console.log('Target User ID for orders:', targetUserId)
    
    const results = []
    for (const item of cart) {
      try {
        const orderData = {
          productId: item.id,
          forUserId: targetUserId,
          quantity: item.quantity
        }
        console.log('Creating order for item:', item, 'with data:', orderData)
        
        const result = await createProductOrder(orderData, user)
        results.push({ item, ...result })
        if (result?.success) {
          pushToast(`Order placed: ${item.name} x${item.quantity}`, 'success')
        } else {
          pushToast(`Failed: ${item.name}`, 'error')
        }
      } catch (error) {
        console.error('Error creating order for item:', item, error)
        results.push({ item, success: false, error: error.message })
        pushToast(`Failed: ${item.name}`, 'error')
      }
    }

    setProcessingStep('Finalizing orders...')
    const finalResults = await Promise.all(results)
    setOrderResults(finalResults)
    
    const successfulOrders = finalResults.filter(result => result.success)
    const failedOrders = finalResults.filter(result => !result.success)

    const userDisplay = customUserId ? `User ${customUserId}` : `User ${user.id} (You)`

    if (failedOrders.length === 0) {
      setMessage(`✅ All ${successfulOrders.length} orders placed successfully for ${userDisplay}! Your cart has been cleared.`)
      clearCart()
      setShowOrderDetails(true)
      setShowConfirmation(true)
      pushToast('All orders placed successfully', 'success', 3000)
    } else if (successfulOrders.length > 0) {
      setMessage(`⚠️ ${successfulOrders.length} orders succeeded, ${failedOrders.length} failed. Check details below.`)
      // Remove successful orders from cart
      successfulOrders.forEach(result => removeFromCart(result.item.id))
      setShowOrderDetails(true)
      setShowConfirmation(true)
      pushToast(`${successfulOrders.length} success, ${failedOrders.length} failed`, 'warning', 3000)
    } else {
      setMessage(`❌ All orders failed. Please try again.`)
      setShowOrderDetails(true)
      pushToast('All orders failed', 'error', 3000)
    }
    setIsProcessing(false)
    setProcessingStep('')
  }

  const handleRemoveItem = (productId) => {
    removeFromCart(productId)
    setMessage('')
    setOrderResults([])
    setShowOrderDetails(false)
  }

  const handleClearCart = () => {
    clearCart()
    setMessage('')
    setOrderResults([])
    setShowOrderDetails(false)
  }

  const handleViewOrders = () => {
    // Navigate to orders page or show orders
    window.location.href = '/orders'
  }

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌'
  }

  const getStatusColor = (success) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  const getCartSummary = () => {
    const totalItems = getCartItemCount()
    const totalCost = getCartTotal()
    const uniqueProducts = cart.length
    
    return { totalItems, totalCost, uniqueProducts }
  }

  const cartSummary = getCartSummary()

  const handleCustomUserId = () => {
    setCustomUserId('')
  }

  return (
    <>
      <div className="card p-4 sm:p-6">
        
        {/* User Selection */}
        <div className="mb-4 p-3 sm:p-4 bg-background rounded-lg">
          <h3 className="font-semibold mb-3 text-text text-sm sm:text-base">Order For</h3>
          
          {/* Option 1: Order for yourself */}
          <div className="mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="userSelection"
                checked={!orderForOther}
                onChange={() => { setOrderForOther(false); }}
                className="text-icons"
              />
              <span className="text-xs sm:text-sm text-icons">
                Myself {user && `(User ID: ${user.id})`}
              </span>
            </label>
          </div>

          {/* Option 2: Order for other user */}
          <div className="mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="userSelection"
                checked={orderForOther}
                onChange={() => { setOrderForOther(true); }}
                className="text-icons"
              />
              <span className="text-xs sm:text-sm text-icons">Other User</span>
            </label>
            <div className="ml-4 sm:ml-6 mt-2 flex items-center space-x-2 sm:space-x-3">
              <input
                type="text"
                placeholder="Enter User ID"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                className="flex-1 px-2 sm:px-3 py-2 border border-icons rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!orderForOther}
              />
              <button
                onClick={() => setCustomUserId('')}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-orange-500"
              >
                Clear
              </button>
            </div>
          </div>
          
          {/* Current Selection Display */}
          <div className="mt-3 p-2 bg-background-content-1 rounded">
            <span className="text-xs sm:text-sm text-icons font-medium">
              Orders will be placed for: 
              <span className="font-bold ml-1">
                {orderForOther && customUserId ? `User ${customUserId}` : (user ? `User ${user.id} (You)` : 'Loading...')}
              </span>
            </span>
          </div>
        </div>
        
        {/* Processing Status */}
        {isProcessing && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin text-blue-600">🔄</div>
              <div className="text-blue-800">
                <div className="font-medium">Processing Orders...</div>
                <div className="text-sm">{processingStep}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Messages */}
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : message.includes('⚠️')
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Order Results */}
        {showOrderDetails && orderResults.length > 0 && (
          <div className="mb-4 p-4 bg-background rounded-lg border">
            <h3 className="font-semibold mb-2 text-lg">Order Results:</h3>
            <div className="space-y-2">
              {orderResults.map((result, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className={getStatusColor(result.success)}>{getStatusIcon(result.success)}</span>
                    <div>
                      <span className="font-medium">{result.item.name}</span>
                      <span className="text-sm text-gray-500 ml-2">x{result.item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    {result.success ? (
                      <div className="text-green-600">
                        <div>Order #{result.order?.id || 'Created'}</div>
                        {result.message && <div className="text-xs">{result.message}</div>}
                      </div>
                    ) : (
                      <div className="text-red-600">
                        <div>{result.error}</div>
                        {result.details && <div className="text-xs">{result.details}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-3 mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2 sm:p-3 bg-background rounded-lg inner-shadow">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div>
                  <div className="font-medium text-xs sm:text-sm">{item.name}</div>
                  <div className="text-xs sm:text-sm text-icons">${item.pointsCost || item.price}</div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-6 h-6 sm:w-7 sm:h-7 bg-background-content-1 rounded-full flex items-center justify-center disabled:opacity-50 text-sm sm:text-lg text-text"
                  disabled={isProcessing}
                >
                  -
                </button>
                <span className="w-6 sm:w-8 text-center font-medium text-xs sm:text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 sm:w-7 sm:h-7 bg-background-content-1 rounded-full flex items-center justify-center disabled:opacity-50 text-sm sm:text-lg text-text"
                  disabled={isProcessing}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Cart Summary and Actions */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-base sm:text-lg font-bold mb-4">
            <span>Total:</span>
            <span className="text-icons">${cartSummary.totalCost.toFixed(2)}</span>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={handleCheckout}
              disabled={isProcessing || loading || !isCartValid()}
              className={`w-full py-2 sm:py-3 px-4 rounded-md font-medium text-white transition-colors text-sm sm:text-base ${
                isProcessing || loading || !isCartValid()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isProcessing ? '🔄 Processing...' : 'Place Order'}
            </button>
            
            <button 
              onClick={handleClearCart}
              disabled={isProcessing}
              className="w-full py-2 px-4 bg-orange-700 rounded-md text-text disabled:opacity-50 transition-colors text-sm sm:text-base"
            >
              Clear order
            </button>
          </div>
          
          {/* Validation Messages */}
          <div className="mt-3 space-y-2">
            {!isCartValid() && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                ⚠️ Cart has validation issues. Please check your items.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {showConfirmation && (
        <OrderConfirmation
          orders={orderResults}
          onClose={() => setShowConfirmation(false)}
          onViewOrders={handleViewOrders}
          targetUserId={customUserId || (user ? user.id.toString() : '')}
        />
      )}

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-2 rounded shadow text-sm ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'warning' ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`}>
              {t.text}
            </div>
          ))}
        </div>
      )}
    </>
  )
} 