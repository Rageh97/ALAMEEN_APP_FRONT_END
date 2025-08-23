'use client'

import { useAuth } from '../hooks/useAuth'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'
import RechargeRequest from '../components/RechargeRequest'
import CartSummary from '../components/CartSummary'
import UserOrderHistory from '../components/UserOrderHistory'
import { useMemo, useState } from 'react'
import { usePointConversionSettings } from '../hooks/usePointConversion'

export default function HomePage() {
  const { user } = useAuth()
  const { products, isLoading: productsLoading, error } = useProducts()
  const [showRechargeForm, setShowRechargeForm] = useState(false)
  const { data: pointSettings } = usePointConversionSettings()

  const conversionRate = useMemo(() => {
    if (!Array.isArray(pointSettings) || pointSettings.length === 0) return null
    // Prefer the latest setting (highest id) if multiple
    const settingsSorted = [...pointSettings].sort((a, b) => (b.id ?? b.Id ?? 0) - (a.id ?? a.Id ?? 0))
    const latest = settingsSorted[0] || {}
    const amountInMoney = Number(latest.amountInMoney ?? latest.AmountInMoney ?? 0)
    const equivalentPoints = Number(latest.equivalentPoints ?? latest.EquivalentPoints ?? 0)
    if (!amountInMoney || !equivalentPoints) return null
    return equivalentPoints / amountInMoney
  }, [pointSettings])

  const latestSetting = useMemo(() => {
    if (!Array.isArray(pointSettings) || pointSettings.length === 0) return null
    const settingsSorted = [...pointSettings].sort((a, b) => (b.id ?? b.Id ?? 0) - (a.id ?? a.Id ?? 0))
    const s = settingsSorted[0] || {}
    return {
      amountInMoney: Number(s.amountInMoney ?? s.AmountInMoney ?? 0),
      equivalentPoints: Number(s.equivalentPoints ?? s.EquivalentPoints ?? 0)
    }
  }, [pointSettings])

  // Safety check - if user is null, show loading or error
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">User data not available. Please refresh the page.</div>
      </div>
    )
  }
  console.log(products)
  return (
    <div className="space-y-6 px-5">
      <div className="flex justify-between items-center">
      <h2 className="text-lg lg:text-2xl font-semibold "> المنتجات المتاحة</h2>
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm text-icons flex flex-col">
            <div>

          <span className='text-text'>الرصيد:</span>   ${ (user.balance ?? user.Balance ?? 0) }
            </div>
         
          <div>

          <span className='text-text'> النقاط:</span> { (() => { const bal = Number(user.balance ?? user.Balance ?? 0); return conversionRate ? Math.floor(bal * conversionRate) : 0 })() }
          </div>
          { latestSetting && latestSetting.amountInMoney && latestSetting.equivalentPoints ? (
            <span className='text-text'> {` ${latestSetting.amountInMoney} = ${latestSetting.equivalentPoints} نقطه`}</span>
          ) : null }
          </div>
          <button
            onClick={() => setShowRechargeForm(!showRechargeForm)}
            className="btn-card px-4 py-2 rounded-xl bg-gradient-to-r from-background-content-1 via-background-content-3 to-background-content-1 text-white gradient-border-button-header "
          >
            {showRechargeForm ? 'اغلاق' : 'طلب شحن'}
          </button>
        </div>
      </div>

      {/* Recharge Request Form */}
      <RechargeRequest 
        isOpen={showRechargeForm} 
        onClose={() => setShowRechargeForm(false)} 
      />

      {/* User Order History */}
      {/* <div className="mt-6">
        <UserOrderHistory />
      </div> */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-10">
        {/* Products Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
            {productsLoading ? (
              <div className="col-span-full text-center py-8">Loading products...</div>
            ) : error ? (
              <div className="col-span-full text-center py-8 text-red-600">Error loading products: {error.message}</div>
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">No products found.</div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-4">
          <CartSummary />
        </div>
      </div>
    </div>
  )
} 