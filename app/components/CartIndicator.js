'use client'

import { useCart } from '../contexts/CartContext'

export default function CartIndicator() {
  const { getCartItemCount, getCartTotal } = useCart()
  const itemCount = getCartItemCount()
  const total = getCartTotal()

  if (itemCount === 0) {
    return null
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
        <span className="text-lg">🛒</span>
        <div className="text-sm">
          <div className="font-medium">{itemCount} items</div>
          <div className="text-xs opacity-90">${total.toFixed(2)}</div>
        </div>
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {itemCount > 99 ? '99+' : itemCount}
        </div>
      </div>
    </div>
  )
}






