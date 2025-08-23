'use client'

import { useState, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'
import OrderConfirmation from './OrderConfirmation'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function CartSummary() {
  const { cart, updateQuantity, getCartTotal, getCartItemCount, clearCart, removeFromCart, isCartValid, getCartValidationErrors, isCartModalOpen, openCartModal, closeCartModal } = useCart()
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

  // Debug toasts state changes
  useEffect(() => {
    console.log('Toasts state changed:', toasts)
  }, [toasts])

  const pushToast = (text, type = 'success', durationMs = 2500) => {
    const id = `${Date.now()}-${Math.random()}`
    console.log('Pushing toast:', { text, type, durationMs, id })
    setToasts(prev => {
      const newToasts = [...prev, { id, text, type }]
      console.log('New toasts array:', newToasts)
      return newToasts
    })
    setTimeout(() => {
      setToasts(prev => {
        const filteredToasts = prev.filter(t => t.id !== id)
        console.log('Removing toast, remaining:', filteredToasts)
        return filteredToasts
      })
    }, durationMs)
  }

  // Don't render anything if cart is empty
  if (cart.length === 0) {
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
      pushToast('يرجى إدخال معرف المستخدم المستهدف.', 'error')
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
          pushToast(`تم تقديم الطلب بنجاح: ${item.name} ×${item.quantity}`, 'success')
        } else {
          pushToast(`فشل في تقديم الطلب: ${item.name}`, 'error')
        }
      } catch (error) {
        console.error('Error creating order for item:', item, error)
        results.push({ item, success: false, error: error.message })
        pushToast(`فشل في تقديم الطلب: ${item.name}`, 'error')
      }
    }

    setProcessingStep('جاري إنهاء الطلبات...')
    const finalResults = await Promise.all(results)
    setOrderResults(finalResults)
    
    const successfulOrders = finalResults.filter(result => result.success)
    const failedOrders = finalResults.filter(result => !result.success)

    console.log('Checkout results:', { successfulOrders: successfulOrders.length, failedOrders: failedOrders.length, finalResults })

    const userDisplay = customUserId ? `المستخدم ${customUserId}` : `المستخدم ${user.id} (أنت)`

    if (failedOrders.length === 0) {
      console.log('All orders successful, showing success toast')
      setMessage(`✅ تم تقديم جميع الطلبات بنجاح (${successfulOrders.length}) للمستخدم ${userDisplay}! تم مسح سلة التسوق.`)
      clearCart()
      setShowOrderDetails(true)
      setShowConfirmation(true)
      pushToast('تم تقديم جميع الطلبات بنجاح! 🎉', 'success', 4000)
    } else if (successfulOrders.length > 0) {
      console.log('Partial success, showing warning toast')
      setMessage(`⚠️ نجح ${successfulOrders.length} طلب، وفشل ${failedOrders.length} طلب. تحقق من التفاصيل أدناه.`)
      // Remove successful orders from cart
      successfulOrders.forEach(result => removeFromCart(result.item.id))
      setShowOrderDetails(true)
      setShowConfirmation(true)
      pushToast(`نجح ${successfulOrders.length} طلب، وفشل ${failedOrders.length} طلب`, 'warning', 4000)
    } else {
      console.log('All orders failed, showing error toast')
      setMessage(`❌ فشلت جميع الطلبات. يرجى المحاولة مرة أخرى.`)
      setShowOrderDetails(true)
      pushToast('فشلت جميع الطلبات', 'error', 4000)
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
    closeCartModal()
    pushToast('تم حذف الطلب', 'success')
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
      {/* Cart Button to Open Modal */}
      <button
        onClick={openCartModal}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-background-content-1 via-background-content-3 to-background-content-1 hover:from-background-content-3 hover:via-background-content-1 hover:to-background-content-3 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
        </div>
      </button>

      {/* Test Toast Button */}
      <button
        onClick={() => pushToast('اختبار التوست!', 'success', 3000)}
        className="fixed bottom-4 left-4 z-40 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-all duration-200"
      >
        🧪
      </button>

      {/* Modal Overlay - Only show if modal is open and user is loaded */}
      {isCartModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeCartModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
              <h2 className="text-xl font-bold text-text">تقديم طلب</h2>
              <button
                onClick={closeCartModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* User Selection */}
              <div className="mb-4 p-3 bg-background-content-1 rounded-lg">
                <h3 className="font-semibold mb-3 text-text">الطلب لـ</h3>
                
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
                    <span className="text-sm text-icons">
                      لنفسي {user && `(  ${user.id})`}
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
                    <span className="text-sm text-icons">مستخدم آخر</span>
                  </label>
                  <div className="mr-6 mt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="أدخل معرف المستخدم"
                      value={customUserId}
                      onChange={(e) => setCustomUserId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-icons rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-icons bg-background text-text"
                      disabled={!orderForOther}
                    />
                    <button
                      onClick={() => setCustomUserId('')}
                      className="px-3 py-2 text-sm text-orange-500 hover:text-orange-400"
                    >
                      حذف
                    </button>
                  </div>
                </div>
                
                {/* Current Selection Display */}
                <div className="mt-3 p-2 bg-background-content-3 rounded">
                  <span className="text-sm text-icons font-medium">
                    سيتم تقديم الطلبات لـ: 
                    <span className="font-bold mr-1">
                      {orderForOther && customUserId ? `المستخدم ${customUserId}` : (user ? `المستخدم ${user.id} (أنت)` : 'جاري التحميل...')}
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Processing Status */}
              {isProcessing && (
                <div className="mb-4 p-3 bg-background-content-1 border border-icons rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin text-icons">🔄</div>
                    <div className="text-text">
                      <div className="font-medium">جاري معالجة الطلبات...</div>
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
                <div className="mb-4 p-4 bg-background-content-1 rounded-lg border border-gray-700/30">
                  <h3 className="font-semibold mb-2 text-lg text-text">نتائج الطلبات:</h3>
                  <div className="space-y-2">
                    {orderResults.map((result, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded ${
                        result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className={getStatusColor(result.success)}>{getStatusIcon(result.success)}</span>
                          <div>
                            <span className="font-medium text-text">{result.item.name}</span>
                            <span className="text-sm text-gray-500 mr-2">×{result.item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          {result.success ? (
                            <div className="text-green-600">
                              <div>طلب رقم #{result.order?.id || 'تم إنشاؤه'}</div>
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
                  <div key={item.id} className="flex items-center justify-between p-3 bg-background-content-1 rounded-lg">
                    <div className="flex items-center space-x-3">
              <div>
                        <div className="font-medium text-sm text-text">{item.name}</div>
                        <div className="text-sm text-icons">${item.pointsCost || item.price}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 bg-background-content-3 rounded-full flex items-center justify-center disabled:opacity-50 text-lg text-text hover:bg-background-content-2"
                        disabled={isProcessing}
              >
                -
              </button>
                      <span className="w-8 text-center font-medium text-sm text-text">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 bg-background-content-3 rounded-full flex items-center justify-center disabled:opacity-50 text-lg text-text hover:bg-background-content-2"
                        disabled={isProcessing}
              >
                +
              </button>
            </div>
          </div>
        ))}
              </div>
              
              {/* Cart Summary and Actions */}
              <div className="border-t border-gray-700/30 pt-4">
                <div className="flex justify-between items-center text-lg font-bold mb-4">
                  <span className="text-text">المجموع:</span>
                  <span className="text-icons">${cartSummary.totalCost.toFixed(2)}</span>
          </div>
                
                <div className="space-y-2">
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing || loading || !isCartValid()}
                    className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                      isProcessing || loading || !isCartValid()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-background-content-1 via-background-content-3 to-background-content-1 hover:from-background-content-3 hover:via-background-content-1 hover:to-background-content-3 focus:outline-none focus:ring-2 focus:ring-icons focus:ring-offset-2 focus:ring-offset-background'
                    }`}
                  >
                    {isProcessing ? '🔄 جاري المعالجة...' : 'تقديم الطلب'}
                  </button>
                  
                  <button 
                    onClick={handleClearCart}
                    disabled={isProcessing}
                    className="w-full py-2 px-4 bg-orange-700 hover:bg-orange-600 rounded-md text-white disabled:opacity-50 transition-colors"
                  >
                     حذف الطلب
          </button>
                </div>
                
                {/* Validation Messages */}
                <div className="mt-3 space-y-2">
                  {!isCartValid() && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      ⚠️ هناك مشاكل في التحقق من السلة. يرجى التحقق من العناصر.
                    </div>
                  )}
                </div>
              </div>
        </div>
      </div>
    </div>
      )}

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
        <div className="fixed top-4 right-4 z-[9999] space-y-2">
          <div className="text-white text-xs bg-black p-1 rounded">
            Toasts: {toasts.length}
          </div>
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-2 rounded shadow text-sm border-2 ${t.type === 'error' ? 'bg-red-600 text-white border-red-800' : t.type === 'warning' ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-green-600 text-white border-green-800'}`}>
              {t.text}
            </div>
          ))}
        </div>
      )}
    </>
  )
} 