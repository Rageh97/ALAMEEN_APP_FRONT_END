'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)

  const addToCart = useCallback((product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const getCartItemCount = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }, [cart])

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const price = item.pointsCost || item.price || 0
      return total + (price * item.quantity)
    }, 0)
  }, [cart])

  const isCartValid = useCallback(() => {
    return cart.length > 0 && cart.every(item => item.quantity > 0)
  }, [cart])

  const getCartValidationErrors = useCallback(() => {
    const errors = []
    if (cart.length === 0) {
      errors.push('Cart is empty')
    }
    cart.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`${item.name} has invalid quantity`)
      }
    })
    return errors
  }, [cart])

  const getCartSummary = useCallback(() => {
    const totalItems = getCartItemCount()
    const totalCost = getCartTotal()
    const uniqueProducts = cart.length
    
    return { totalItems, totalCost, uniqueProducts }
  }, [cart, getCartItemCount, getCartTotal])

  const openCartModal = useCallback(() => {
    setIsCartModalOpen(true)
  }, [])

  const closeCartModal = useCallback(() => {
    setIsCartModalOpen(false)
  }, [])

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isCartValid,
    getCartValidationErrors,
    getCartSummary,
    isCartModalOpen,
    openCartModal,
    closeCartModal
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 