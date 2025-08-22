'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useOrders } from '../hooks/useOrders'

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { myOrders, fetchMyOrders, loading: ordersLoading, error } = useOrders()
  const [filteredOrders, setFilteredOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  // Load my orders when user is ready
  useEffect(() => {
    if (user) {
      fetchMyOrders({ pageNumber: 1, pageSize: 50 }, user)
    }
  }, [user, fetchMyOrders])

  // Refresh when other parts of the app update orders
  useEffect(() => {
    const handler = () => {
      if (user) fetchMyOrders({ pageNumber: 1, pageSize: 50 }, user)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('orders:updated', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('orders:updated', handler)
      }
    }
  }, [user, fetchMyOrders])

  // Keep a local list for filtering
  useEffect(() => {
    if (myOrders && Array.isArray(myOrders)) {
      setFilteredOrders(myOrders)
    }
  }, [myOrders])

  // Apply status filter
  useEffect(() => {
    const normalizeStatus = (o) => (o?.statusValue || o?.status || '').toString().toLowerCase()
    if (statusFilter === 'all') {
      setFilteredOrders(myOrders || [])
    } else {
      const target = statusFilter.toString().toLowerCase()
      setFilteredOrders((myOrders || []).filter(o => normalizeStatus(o) === target))
    }
  }, [statusFilter, myOrders])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/signin'
    }
  }, [user, authLoading])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-text">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const ImagePath = "http://alameenapp.runasp.net/AppMedia/"
  const resolveImageSrc = (order) => {
    const path = order?.transferImagePath || order?.TransferImagePath || order?.transferImage || order?.TransferImage || ''
    if (!path) return ''
    const isAbsolute = /^https?:\/\//i.test(path)
    return isAbsolute ? path : `${ImagePath}${path}`
  }

  const getStatusColor = (status) => {
    const s = (status || '').toString().toLowerCase()
    switch (s) {
      case 'pending':
      case '0':
        return 'text-yellow-600 bg-yellow-100'
      case 'processing':
        return 'text-blue-600 bg-blue-100'
      case 'approved':
      case 'delivered':
      case '1':
        return 'text-green-600 bg-green-100'
      case 'rejected':
      case 'cancelled':
      case '2':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status) => {
    const s = (status || '').toString().toLowerCase()
    switch (s) {
      case 'pending':
      case '0':
        return 'في الانتظار'
      case 'processing':
        return 'قيد المعالجة'
      case 'approved':
      case 'delivered':
      case '1':
        return 'تمت الموافقة'
      case 'rejected':
      case 'cancelled':
      case '2':
        return 'مرفوض'
      default:
        return status
    }
  }

  const getDisplayDate = (o) => {
    const raw = o?.date || o?.createdAt || o?.dateCreated || o?.createdOn
    if (!raw) return ''
    const d = new Date(raw)
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString('ar-SA')
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">طلباتي</h1>
          <p className="text-text/80">عرض جميع طلباتك وتتبع حالتها</p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-border-titles rounded-lg bg-background-content-1 text-text focus:ring-2 focus:ring-border-titles focus:border-transparent"
          >
            <option value="all">جميع الطلبات</option>
            <option value="pending">في الانتظار</option>
            <option value="approved">تمت الموافقة</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>

        {/* Orders List */}
        {ordersLoading ? (
          <div className="text-center py-12">
            <div className="text-xl text-text">جاري تحميل الطلبات...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-xl text-red-600">خطأ في تحميل الطلبات: {error}</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xl text-text/60">لا توجد طلبات {statusFilter !== 'all' ? `بالحالة: ${getStatusText(statusFilter)}` : ''}</div>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700 text-center">
              <thead className="bg-transparent">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">رقم</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">التاريخ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">النوع</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">التفاصيل</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">الكمية</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">المبلغ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">الحالة</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">الصورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredOrders.map((o) => {
                  const isRecharge = o.amount != null || String(o.typeValue || o.type || '').toLowerCase().includes('recharge')
                  const imageSrc = isRecharge ? resolveImageSrc(o) : ''
                  return (
                    <tr key={o.id}>
                      <td className="px-4 py-3 text-sm">#{o.id}</td>
                      <td className="px-4 py-3 text-sm">{getDisplayDate(o)}</td>
                      <td className="px-4 py-3 text-sm">{isRecharge ? 'شحن' : 'منتج'}</td>
                      <td className="px-4 py-3 text-sm">{isRecharge ? 'شحن رصيد' : (o.productName || `المنتج ${o.productId || ''}`)}</td>
                      <td className="px-4 py-3 text-sm">{isRecharge ? '—' : (o.quantity || 1)}</td>
                      <td className="px-4 py-3 text-sm">{isRecharge ? (o.amount ?? '-') : '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(o.statusValue || o.status)}`}>
                          {getStatusText(o.statusValue || o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {imageSrc ? (
                          <a href={imageSrc} target="_blank" rel="noreferrer">
                            <img src={imageSrc} alt="صورة التحويل" className="h-12 w-12 rounded object-cover border border-gray-700" />
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}



