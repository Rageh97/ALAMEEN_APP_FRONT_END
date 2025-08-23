'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { useUserNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '../hooks/useNotifications'
import { notificationAPI } from '../utils/api'

export default function NotificationsPage() {
  const [filters, setFilters] = useState({
    pageNumber: 1,
    pageSize: 10,
    filterValue: '',
    filterType: '',
    sortType: ''
  })

  const { data: notifications, isLoading, error, refetch } = useUserNotifications()
  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllAsReadMutation = useMarkAllNotificationsAsRead()

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => refetch()
  const resetFilters = () => setFilters({ pageNumber: 1, pageSize: 10, filterValue: '', filterType: '', sortType: '' })

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId)
      toast.success('تم تحديد الإشعار كمقروء')
      // Refresh notifications after marking as read
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast.error(`فشل في تحديد الإشعار كمقروء: ${error.message}`)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync()
      toast.success('تم تحديد جميع الإشعارات كمقروءة')
      // Refresh notifications after marking all as read
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast.error(`فشل في تحديد جميع الإشعارات كمقروءة: ${error.message}`)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text">الإشعارات</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="btn-primary"
            >
              {markAllAsReadMutation.isPending ? 'جاري التحديث...' : 'تحديد الكل كمقروء'}
            </button>
          </div>
        </div>

 



        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-8">جاري تحميل الإشعارات...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">خطأ: {error.message}</div>
        ) : (
          <div className="space-y-4">
            {notifications && notifications.length > 0 ? (
              notifications.map(notification => {
                const id = notification.id || notification.Id
                const title = notification.title || notification.Title || 'بدون عنوان'
                const description = notification.description || notification.Description || notification.message || notification.Message || 'بدون رسالة'
                const isRead = notification.isRead || notification.IsRead || false
                const type = notification.typeName || notification.TypeName || notification.type || notification.Type || 'عام'
                const date = notification.creationTime || notification.CreatedDate || notification.createdDate || notification.date || notification.Date
                const priority = notification.priority || notification.Priority || 'عادي'

                return (
                  <div 
                    key={id} 
                    className={`bg-background p-6 transition-all duration-200 ${
                      isRead 
                        ? 'bg-background-content-1 border-gray-200' 
                        : 'card border-blue-200 shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Title */}
                        <h3 className={`text-lg font-semibold mb-2 ${
                          isRead ? 'text-icons' : 'text-icons'
                        }`}>
                          {title}
                        </h3>
                        
                        {/* Description */}
                        <p className={`text-gray-700 mb-3 ${
                          isRead ? 'text-text' : 'text-text'
                        }`}>
                          {description}
                        </p>
                        
                        {/* Badges */}
                        {/* <div className="flex items-center space-x-2 mb-3">
                          {!isRead && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              جديد
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priority === 'عالي' 
                              ? 'bg-red-100 text-red-800'
                              : priority === 'متوسط'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {priority}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {type}
                          </span>
                        </div> */}
                        
                        {/* Date and Actions */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{formatDate(date)}</span>
                          {!isRead && (
                            <button
                              onClick={() => handleMarkAsRead(id)}
                              disabled={markAsReadMutation.isPending}
                              className="text-icons cursor-pointer font-medium transition-colors"
                            >
                              {markAsReadMutation.isPending ? 'جاري التحديث...' : 'تحديد كمقروء'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد إشعارات.
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {/* {notifications && notifications.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('pageNumber', Math.max(1, filters.pageNumber - 1))}
                disabled={filters.pageNumber <= 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-gray-700">
                الصفحة {filters.pageNumber}
              </span>
              <button
                onClick={() => handleFilterChange('pageNumber', filters.pageNumber + 1)}
                disabled={notifications.length < filters.pageSize}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}
