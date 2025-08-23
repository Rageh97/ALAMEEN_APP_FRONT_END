'use client'

import { useCart } from '../contexts/CartContext'
import "@/app/globals.css"

export default function ProductCard({ product }) {
  const { addToCart, openCartModal } = useCart()
  const ImagePath = "http://alameenapp.runasp.net/AppMedia/"

  const handleAddToCart = () => {
    addToCart(product)
    openCartModal()
  }

  return (
    <div className="card overflow-hidden gradient-border-2 w-full">
      <img 
        src={ImagePath + product?.path} 
        alt={product?.name} 
        className="w-full h-[250px] object-cover rounded-xl"
      />
      <div className="p-6 flex flex-col items-center">
        <h3 className="text-xl text-icons font-semibold mb-2 text-center">{product?.name}</h3>
        <p className="text-gray-300 mb-4 text-center">{product?.description}</p>
        <div className="w-full">
          <button
            onClick={handleAddToCart}
            className="w-full btn-card px-4 py-2 rounded-xl bg-gradient-to-r from-background-content-1 via-background-content-3 to-background-content-1 text-white gradient-border-button-header"
          >
           <span className="text-white font-bold">تقديم طلب</span>
           <span className="text-sm font-bold text-icons">${product?.pointsCost}</span>
          </button>
        </div>
      </div>
    </div>
  )
} 