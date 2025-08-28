'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useOrders } from '../hooks/useOrders'
import { formatDateTime } from '../utils/dateUtils'
import { ordersAPI } from '../utils/api'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import { notificationKeys } from '../hooks/useNotifications'

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { myOrders, fetchMyOrders, loading: ordersLoading, analyzeCurrentOrders } = useOrders()
  const [filteredOrders, setFilteredOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [supervisorRequests, setSupervisorRequests] = useState([])
  const [supervisorRequestsLoading, setSupervisorRequestsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('my-orders')
  const [myPage, setMyPage] = useState(1)
  const [supPage, setSupPage] = useState(1)
  const pageSize = 10
  const queryClient = useQueryClient()
  
  // Check if user is supervisor
  const isSupervisor = user?.userTypeValue === 'Supervisor' || 
                      user?.roleName === 'Supervisor' || 
                      user?.RoleName === 'Supervisor' ||
                      user?.Type === 'Supervisor' ||
                      user?.type === 'Supervisor' ||
                      user?.userTypeName === 'Supervisor' ||
                      user?.UserTypeName === 'Supervisor'
  




  // Load my orders when user is ready (optimized)
  useEffect(() => {
    if (user?.id || user?.Id) {
      if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Orders page: User available, fetching my orders...')
      }
      
      const userId = user.id || user.Id || user.userId || user.UserId
      if (userId) {
        try {
          fetchMyOrders({ pageNumber: myPage, pageSize }, user)
        } catch (error) {
          console.error('❌ Error calling fetchMyOrders:', error)
        }
      }
    }
  }, [user?.id, fetchMyOrders, myPage])
  
  const fetchSupervisorRequests = useCallback(async (page = 1) => {
    if (!isSupervisor) return
    
    setSupervisorRequestsLoading(true)
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Fetching supervisor requests...')
      }
      
      const response = await ordersAPI.getPending({ 
        pageNumber: page, 
        pageSize
      })
      
      if (response && response.success && response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Setting supervisor requests:', response.data.length)
        }
        setSupervisorRequests(response.data)
      } else {
        setSupervisorRequests([])
      }
    } catch (error) {
      console.error('❌ Error fetching supervisor requests:', error)
      setSupervisorRequests([])
    } finally {
      setSupervisorRequestsLoading(false)
    }
  }, [isSupervisor])

  useEffect(() => {
    if (isSupervisor) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User is supervisor, fetching requests...')
      }
      fetchSupervisorRequests(supPage)
    }
  }, [isSupervisor, supPage])

  // Handle approve/reject requests
  const handleApproveRequest = async (requestId) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Approving request:', requestId)
      }
      
      await ordersAPI.approve(requestId)
      toast.success('تمت الموافقة على الطلب بنجاح')
      
      // Refresh supervisor list and notifications
      fetchSupervisorRequests()
      
      // Force refresh notifications for both users
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      
      // Force immediate refresh of all notification-related queries
      await queryClient.refetchQueries({ queryKey: notificationKeys.userNotifications() })
      await queryClient.refetchQueries({ queryKey: notificationKeys.lists() })
      
      // Try to force a backend notification refresh
      try {
        await fetch('/api/Notification/GetUserNotifications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'lang': 'ar'
          }
        })
        
        // Also try to refresh notifications for the specific employee
        await fetch(`/api/UserRequest/${requestId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'lang': 'ar'
          }
        })
      } catch (error) {
        // Silent fail for notification refresh
      }
      
      // Emit notification events
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('notifications:updated'))
        setTimeout(() => {
          window.dispatchEvent(new Event('notifications:updated'))
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Error approving request:', error)
      toast.error('حدث خطأ أثناء الموافقة على الطلب')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Rejecting request:', requestId)
      }
      
      await ordersAPI.reject(requestId)
      
      toast.success('تم رفض الطلب بنجاح')
      
      // Refresh supervisor list and notifications
      fetchSupervisorRequests()
      
      // Force refresh notifications for both users
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      
      // Force immediate refresh of all notification-related queries
      await queryClient.refetchQueries({ queryKey: notificationKeys.userNotifications() })
      await queryClient.refetchQueries({ queryKey: notificationKeys.lists() })
      
      // Try to force a backend notification refresh
      try {
        await fetch('/api/Notification/GetUserNotifications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'lang': 'ar'
          }
        })
      } catch (error) {
        // Silent fail for notification refresh
      }
      
      // Emit notification events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('notifications:updated'))
        setTimeout(() => {
          window.dispatchEvent(new Event('notifications:updated'))
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Error rejecting request:', error)
      toast.error('حدث خطأ أثناء رفض الطلب')
    }
  }

  // Refresh when other parts of the app update orders (optimized)
  useEffect(() => {
    if (!user || typeof window === 'undefined') return
    
    const handler = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Orders page: Received orders:updated event, refreshing...')
      }
      fetchMyOrders({ pageNumber: 1, pageSize: 50 }, user)
    }
    
    window.addEventListener('orders:updated', handler)
    return () => window.removeEventListener('orders:updated', handler)
  }, [user?.id, fetchMyOrders])

  // Keep a local list for filtering (optimized)
  useEffect(() => {
    if (myOrders && Array.isArray(myOrders)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Orders page - Setting filtered orders:', myOrders.length)
      }
      setFilteredOrders(myOrders)
    } else {
      setFilteredOrders([])
    }
  }, [myOrders])

  // Apply status filter (optimized)
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(myOrders || [])
    } else {
      const target = statusFilter.toString().toLowerCase()
      const normalizeStatus = (o) => (o?.statusValue || o?.status || '').toString().toLowerCase()
      const filtered = (myOrders || []).filter(o => {
        const orderStatus = normalizeStatus(o)
        return orderStatus === target
      })
      setFilteredOrders(filtered)
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

  // const ImagePath = "http://alameenapp.runasp.net/AppMedia/"
  const resolveImageSrc = (order) => {
    const path = order?.transferImagePath || order?.TransferImagePath || order?.transferImage || order?.TransferImage || ''
    if (!path) return ''
    const isAbsolute = /^https?:\/\//i.test(path)
    return isAbsolute ? path : `/media/${path}`
  }

  const getStatusColor = (status) => {
    const s = (status || '').toString().toLowerCase()
    switch (s) {
      case 'pending':
      case '0':
        return 'btn-status text-yellow-500 inner-shadow'
      case 'processing':
        return 'text-blue-600 bg-blue-100'
      case 'approved':
      case 'delivered':
      case '1':
        return 'text-green-600 btn-status inner-shadow'
      case 'rejected':
      case 'cancelled':
      case '2':
        return 'text-orange-600 btn-status inner-shadow'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status) => {
    const s = (status || '').toString().toLowerCase()
    switch (s) {
      case 'pending':
      case '0':
        return 'قيد الانتظار'
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
    <div className="bg-background p-2 md:p-4 lg:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
       

        {/* Tabs for Supervisor */}
        {isSupervisor && (
          <div className="mb-4 flex gap-2 md:gap-4 border-b border-gray-700 p-2">
            <button
              onClick={() => {
                console.log('🔍 Switching to my-orders tab')
                setActiveTab('my-orders')
              }}
              className={`py-2 px-3 md:px-4 font-semibold text-sm md:text-base whitespace-nowrap ${
                activeTab === 'my-orders' 
                  ? 'text-icons border-b-2 border-icons' 
                  : 'text-gray-500 hover:text-icons'
              }`}
            >
              طلباتي
            </button>
            <button
              onClick={() => {
                console.log('🔍 Switching to supervisor-requests tab')
                setActiveTab('supervisor-requests')
              }}
              className={`py-2 px-3 md:px-4 font-semibold text-sm md:text-base whitespace-nowrap ${
                activeTab === 'supervisor-requests' 
                  ? 'text-icons border-b-2 border-icons' 
                  : 'text-gray-500 hover:text-icons'
              }`}
            >
              طلبات الموظفين
            </button>
        </div>
        )}
        

     


        {/* My Orders Tab */}
        {activeTab === 'my-orders' && (
          <>
        {/* Filter */}
            <div className="mb-4 flex gap-2 md:gap-4 items-center px-2 md:px-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 md:px-4 py-2 border border-border-titles rounded-lg bg-background-content-1 text-text focus:ring-2 focus:ring-border-titles focus:border-transparent text-sm md:text-base"
          >
            <option value="all">جميع الطلبات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="approved">تمت الموافقة</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>

        {/* Orders List */}
        {ordersLoading ? (
          <div className="text-center py-8">
            <div className="text-xl text-text">جاري تحميل الطلبات...</div>
          </div>

        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-xl text-text/60">
              لا توجد طلبات {statusFilter !== 'all' ? `بالحالة: ${getStatusText(statusFilter)}` : ''}
            </div>
            {/* <div className="text-sm text-text/40 mt-2">
              Debug: myOrders length: {myOrders?.length || 0}, filteredOrders length: {filteredOrders.length}
            </div> */}
          </div>
        ) : (
          <div className="card overflow-x-auto max-w-full">
            <table className="min-w-full divide-y divide-icons/40 text-center text-xs md:text-sm">
              <thead className="bg-transparent">
                <tr>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">رقم</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">التاريخ</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">النوع</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">التفاصيل</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الكمية</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">المبلغ</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الحالة</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الصورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredOrders.map((o, index) => {
                  console.log(`🔍 Rendering order ${index}:`, o)
                  const isRecharge = o.amount != null || String(o.typeValue || o.type || '').toLowerCase().includes('recharge')
                  const imageSrc = isRecharge ? resolveImageSrc(o) : ''
                  return (
                    <tr key={o.id || o.Id || index}>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm">#{o.id || o.Id || 'N/A'}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm">{o?.creationTime ? (
                              <div className="flex flex-col items-center">
                                <span className="font-medium">
                                  {formatDateTime(o?.creationTime)}
                                </span>
                                {/* <span className="text-xs text-gray-500">
                                  {getRelativeTime(employeeCreationTime)}
                                </span> */}
                              </div>
                            ) : (
                              '—'
                            )}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm">{isRecharge ? 'شحن' : 'منتج'}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm">{isRecharge ? 'شحن رصيد' : (o.productName || `المنتج ${o.productId || o.ProductId || ''}`)}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm">{isRecharge ? '—' : (o.quantity || o.Quantity || 1)}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm">{isRecharge ? ((o.amount || o.Amount) ?? '-') : '—'}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(o.statusValue || o.status || o.Status)}`}>
                          {getStatusText(o.statusValue || o.status || o.Status)}
                        </span>
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                        {imageSrc ? (
                          <a href={imageSrc} target="_blank" rel="noopener noreferrer">
                            <img src={imageSrc} alt="صورة التحويل" className="h-12 w-12 rounded object-cover border border-gray-700" />
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {/* Pagination for My Orders */}
            <div className="flex items-center justify-between p-3 bg-icons/20">
              <button
                onClick={() => setMyPage(p => Math.max(1, p - 1))}
                className="btn-secondary text-xs p-2"
                disabled={myPage <= 1}
              >
                السابق
              </button>
              <div className="text-sm text-icons">الصفحة {myPage}</div>
              <button
                onClick={() => setMyPage(p => p + 1)}
                className="btn-primary text-xs p-2"
                disabled={(Array.isArray(myOrders) ? myOrders.length : 0) < pageSize}
              >
                التالي
              </button>
            </div>
          </div>
        )}
          </>
        )}

        {/* Supervisor Requests Tab */}
        {activeTab === 'supervisor-requests' && (
          <div className="space-y-4 px-2 md:px-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-text/80">طلبات الموظفين التي تحتاج موافقتك</p>
              </div>
             
            </div>

          

            {supervisorRequestsLoading ? (
              <div className="text-center py-8">
                <div className="text-xl text-text">جاري تحميل طلبات المرؤوسين...</div>
              </div>
            ) : supervisorRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-xl text-text/60">لا توجد طلبات معلقة من الموظفين</div>
                
              </div>
            ) : (
              <div className="card overflow-x-auto max-w-full">
                <table className="min-w-full divide-y divide-icons/40 text-center text-xs md:text-sm">
                  <thead className="bg-transparent">
                    <tr>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">رقم الطلب</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الموظف</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">التاريخ</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">النوع</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">التفاصيل</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الكمية/المبلغ</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الصورة</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {supervisorRequests.map((request, index) => {
                      const rowBgClass = index % 2 === 0 ? 'bg-background-content-1' : 'bg-background-content-1/50'
                      const isRecharge = request.amount != null || String(request.typeValue || request.type || '').toLowerCase().includes('recharge')
                      const imageSrc = isRecharge ? resolveImageSrc(request) : ''
                      
                      return (
                        <tr key={request.id || request.Id || index} className={rowBgClass}>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-sm">#{request.id || request.Id || 'N/A'}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{request.requestedByUserName || request.requestedByName || 'غير محدد'}</span>
                              <span className="text-xs text-gray-500">{request.forUserId || ''}</span>
                            </div>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                            {request.creationTime ? (
                              <div className="flex flex-col items-center">
                                <span className="font-medium">
                                  {formatDateTime(request.creationTime)}
                                </span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-sm">{isRecharge ? 'شحن' : 'منتج'}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                            {isRecharge ? 'شحن رصيد' : (request.productName || `المنتج ${request.productId || request.ProductId || ''}`)}
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                            {isRecharge ? `${request.amount || request.Amount || 0}` : (request.quantity || request.Quantity || 1)}
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                            {imageSrc ? (
                              <a href={imageSrc} target="_blank" rel="noopener noreferrer">
                                <img src={imageSrc} alt="صورة التحويل" className="h-12 w-12 rounded object-cover border border-gray-700" />
                              </a>
                            ) : '—'}
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApproveRequest(request.id || request.Id)}
                                className="text-green-500 cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id || request.Id)}
                                className="text-red-500 cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {/* Pagination for Supervisor Requests */}
                <div className="flex items-center justify-between p-3">
                  <button
                    onClick={() => setSupPage(p => Math.max(1, p - 1))}
                    className="btn-secondary text-sm p-2"
                    disabled={supPage <= 1}
                  >
                    السابق
                  </button>
                  <div className="text-sm text-text">الصفحة {supPage}</div>
                  <button
                    onClick={() => setSupPage(p => p + 1)}
                    className="btn-primary text-sm p-2"
                    disabled={(Array.isArray(supervisorRequests) ? supervisorRequests.length : 0) < pageSize}
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}



