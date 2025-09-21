'use client'

import { useState, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'
import OrderConfirmation from './OrderConfirmation'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

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
    
    if (!customUserId) {
      setIsProcessing(false)
      setMessage('يرجى إدخال معرف المستخدم .')
      return
    }

    const targetUserId = customUserId
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
      } catch (error) {
        console.error('Error creating order for item:', item, error)
        results.push({ item, success: false, error: error.message })
      }
    }

    setProcessingStep('جاري إنهاء الطلبات...')
    const finalResults = await Promise.all(results)
    setOrderResults(finalResults)
    
    const successfulOrders = finalResults.filter(result => result.success)
    const failedOrders = finalResults.filter(result => !result.success)

    console.log('Checkout results:', { successfulOrders: successfulOrders.length, failedOrders: failedOrders.length, finalResults })

    const userDisplay = `المستخدم ${customUserId}`

    if (failedOrders.length === 0) {
      console.log('All orders successful, showing success toast')
      setMessage(`✅ تم تقديم جميع الطلبات بنجاح (${successfulOrders.length}) للمستخدم ${userDisplay}! تم مسح سلة التسوق.`)
      clearCart()
      setShowOrderDetails(true)
      setShowConfirmation(true)
      toast.success('تم تقديم  الطلب بنجاح! 🎉')
    } else if (successfulOrders.length > 0) {
      console.log('Partial success, showing warning toast')
      setMessage(`⚠️ نجح ${successfulOrders.length} طلب، وفشل ${failedOrders.length} طلب. تحقق من التفاصيل أدناه.`)
      // Remove successful orders from cart
      successfulOrders.forEach(result => removeFromCart(result.item.id))
      setShowOrderDetails(true)
      setShowConfirmation(true)
      toast.warning(`نجح ${successfulOrders.length} طلب، وفشل ${failedOrders.length} طلب`)
    } else {
      console.log('All orders failed, showing error toast')
      setMessage(`❌ فشلت جميع الطلبات. يرجى المحاولة مرة أخرى.`)
      setShowOrderDetails(true)
      toast.error('فشلت جميع الطلبات')
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
    toast.success('تم حذف الطلب')
  }

  const handleViewOrders = () => {
    // Navigate to orders page or show orders
    window.location.href = '/orders'
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

  const getStatusColor = (success) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌'
  }

  return (
    <>
      {/* Cart Button to Open Modal */}
      {/* <button
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
      </button> */}

    

      {/* Modal Overlay - Only show if modal is open and user is loaded */}
      {isCartModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeCartModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-background gradient-border inner-shadow rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
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
              {/* User ID Input */}
              <div className="mb-4 p-3 bg-background-content-1 rounded-lg">
                <h3 className="font-semibold mb-3 text-text">معرف المستخدم </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="أدخل معرف المستخدم"
                    value={customUserId}
                    onChange={(e) => setCustomUserId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-icons rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-icons bg-background text-text"
                  />
                  <button
                    onClick={() => setCustomUserId('')}
                    className="px-3 py-2 text-sm text-orange-500 cursor-pointer hover:text-orange-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              
          
              
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
          targetUserId={customUserId}
        />
      )}


    </>
  )
} 