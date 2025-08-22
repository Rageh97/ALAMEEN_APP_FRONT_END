'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        // Clear corrupted cart data
        localStorage.removeItem('cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart))
    } else {
      localStorage.removeItem('cart')
    }
  }, [cart])

  const addToCart = (product) => {
    if (!product || !product.id) {
      console.error('Invalid product data:', product)
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, 99) } // Limit quantity to 99
            : item
        )
      }
      return [...prev, { 
        ...product, 
        quantity: 1,
        addedAt: new Date().toISOString()
      }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else if (quantity > 99) {
      // Limit maximum quantity to 99
      setCart(prev => prev.map(item => 
        item.id === productId ? { ...item, quantity: 99 } : item
      ))
    } else {
      setCart(prev => prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const price = item.pointsCost || item.price || 0
      return sum + (price * item.quantity)
    }, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getCartSummary = () => {
    return {
      totalItems: getCartItemCount(),
      totalCost: getCartTotal(),
      uniqueProducts: cart.length,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.pointsCost || item.price,
        total: (item.pointsCost || item.price) * item.quantity
      }))
    }
  }

  const isCartValid = () => {
    return cart.every(item => 
      item.id && 
      item.name && 
      item.quantity > 0 && 
      item.quantity <= 99 &&
      (item.pointsCost || item.price)
    )
  }

  const getCartValidationErrors = () => {
    const errors = []
    cart.forEach((item, index) => {
      if (!item.id) errors.push(`Item ${index + 1}: Missing product ID`)
      if (!item.name) errors.push(`Item ${index + 1}: Missing product name`)
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Invalid quantity`)
      if (item.quantity > 99) errors.push(`Item ${index + 1}: Quantity exceeds maximum (99)`)
      if (!item.pointsCost && !item.price) errors.push(`Item ${index + 1}: Missing price`)
    })
    return errors
  }

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getCartSummary,
    isCartValid,
    getCartValidationErrors
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
} 