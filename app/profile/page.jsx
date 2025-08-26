'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useOrders } from '../hooks/useOrders'
import { formatDateTime, getRelativeTime } from '../utils/dateUtils'
import { employeesAPI, usersAPI } from '../utils/api'
 
import { toast } from 'react-toastify'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

export default function UserProfile() {
  const { user, signOut } = useAuth()
  const { myOrders, loading, fetchMyOrders } = useOrders()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ password: '', rePassword: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)
 
  const [employeeInfo, setEmployeeInfo] = useState(null)
  
const ImagePath = "http://alameenapp.runasp.net/AppMedia/"
  useEffect(() => {
    if (user?.id) {
      fetchMyOrders({ pageNumber: 1, pageSize: 20 }, user)
    }
  }, [user?.id, fetchMyOrders])

  // Fetch employee details to get supervisor name from Employee endpoint if missing on user
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const uid = user?.id || user?.Id
        if (!uid) return
        // Only fetch if we don't already have supervisor name on user
        if (user?.supervisorName || user?.SupervisorName) return
        // Try direct by id first
        let emp = null
        try {
          const empRaw = await employeesAPI.getById(uid)
          const normalized = empRaw?.data ?? empRaw?.item ?? empRaw
          if (normalized && (normalized.supervisorName || normalized.SupervisorName)) {
            emp = normalized
          }
        } catch {}

        // Fallback: load employee list and match by multiple keys (align with list behavior)
        if (!emp) {
          try {
            const listRaw = await employeesAPI.getAll({})
            const list = Array.isArray(listRaw) ? listRaw : (Array.isArray(listRaw?.data) ? listRaw.data : (Array.isArray(listRaw?.items) ? listRaw.items : []))
            const uname = user?.userName || user?.UserName
            const name = user?.name || user?.Name
            const match = (list || []).find(e => {
              const eid = e?.id ?? e?.Id
              const eUser = e?.userName ?? e?.UserName
              const eName = e?.name ?? e?.Name
              return (
                (eid && String(eid) === String(uid)) ||
                (uname && eUser && String(eUser).toLowerCase() === String(uname).toLowerCase()) ||
                (name && eName && String(eName).toLowerCase() === String(name).toLowerCase())
              )
            })
            if (match) emp = match
          } catch {}
        }

        if (!cancelled) setEmployeeInfo(emp || null)
      } catch {
        if (!cancelled) setEmployeeInfo(null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  

  const handleSignOut = () => {
    signOut()
    window.location.href = '/signin'
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800' },
      1: { text: 'تمت الموافقة', color: 'bg-green-100 text-green-800' },
      2: { text: 'مرفوض', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || { text: 'غير معروف', color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const typeMap = {
      1: { text: 'منتج', color: 'bg-blue-100 text-blue-800' },
      2: { text: 'شحن', color: 'bg-purple-100 text-purple-800' }
    }
    const typeInfo = typeMap[type] || { text: 'غير معروف', color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.text}
      </span>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-text mb-4">يرجى تسجيل الدخول</div>
          <button 
            onClick={() => window.location.href = '/signin'}
            className="btn-primary"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
  

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-4 font-semibold ${
              activeTab === 'profile' 
                ? 'text-icons border-b-2 border-icons' 
                : 'text-gray-500 hover:text-icons'
            }`}
          >
            <UserIcon className="h-5 w-5 inline mr-2" />
            الملف الشخصي
          </button>
        
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-4 font-semibold ${
              activeTab === 'settings' 
                ? 'text-icons border-b-2 border-icons' 
                : 'text-gray-500 hover:text-icons'
            }`}
          >
            <CogIcon className="h-5 w-5 inline mr-2" />
            الإعدادات
          </button>
          
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                {user?.profilePath ? <img src={`${ImagePath + user?.profilePath}`} alt="Avatar" className="w-10 h-10 rounded-full" /> : <UserIcon className="h-10 w-10 text-icons" />}
                  <h2 className="text-xl font-bold text-text">المعلومات الشخصية</h2>
                </div>
              </div>

              <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-icons" />
                    <div>
                      <div className="text-lg text-icons">الاسم</div>
                      <div className="font-medium text-text">{user.name || user.Name || 'غير محدد'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-icons" />
                    <div>
                      <div className="text-lg text-icons">اسم المشرف</div>
                      <div className="font-medium text-text">{employeeInfo?.supervisorName || employeeInfo?.SupervisorName || user.supervisorName || user.SupervisorName || 'غير محدد'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-icons" />
                    <div>
                      <div className="text-lg text-icons">رقم الهاتف</div>
                      <div className="font-medium text-text">{ user.phoneNumber || 'غير محدد'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CurrencyDollarIcon className="h-5 w-5 text-icons" />
                    <div>
                      <div className="text-lg text-icons">الرصيد</div>
                      <div className="font-medium text-text">${user.balance || user.Balance || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CogIcon className="h-5 w-5 text-icons" />
                    <div>
                      <div className="text-lg text-icons">نوع المستخدم</div>
                      <div className="font-medium text-text">
                        {user.userTypeName || user.UserTypeName || user.userTypeValue || user.Type || user.type || 'غير محدد'}
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-icons mb-2">
                  {myOrders?.length || 0}
                </div>
                <div className="text-sm text-icons">إجمالي الطلبات</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {myOrders?.filter(o => o.status === 1).length || 0}
                </div>
                <div className="text-sm text-icons">الطلبات المقبولة</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">
                  {myOrders?.filter(o => o.status === 0).length || 0}
                </div>
                <div className="text-sm text-icons">الطلبات المعلقة</div>
              </div>
            </div>
          </div>
        )}



        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-text mb-4">إعدادات الحساب</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background-content-1 rounded-lg">
                  <div>
                    <div className="font-medium text-text">تغيير كلمة المرور</div>
                    <div className="text-sm text-icons">تحديث كلمة المرور الخاصة بك</div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setShowPasswordForm(prev => !prev)}
                  >
                    تغيير
                  </button>
                </div>

                {showPasswordForm && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!passwordForm.password || !passwordForm.rePassword) {
                        toast.error('يرجى إدخال كلمة المرور وتأكيدها')
                        return
                      }
                      if (passwordForm.password !== passwordForm.rePassword) {
                        toast.error('كلمتا المرور غير متطابقتين')
                        return
                      }
                      try {
                        setPasswordLoading(true)
                        const uid = user?.id || user?.Id
                        await usersAPI.changePassword(uid, {
                          password: passwordForm.password,
                          rePassword: passwordForm.rePassword
                        })
                        toast.success('تم تغيير كلمة المرور بنجاح')
                        setPasswordForm({ password: '', rePassword: '' })
                        setShowPasswordForm(false)
                      } catch (err) {
                        toast.error(err?.message || 'فشل تغيير كلمة المرور')
                      } finally {
                        setPasswordLoading(false)
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-background-content-1 rounded-lg"
                  >
                    <input
                      type="password"
                      className="input-field"
                      placeholder="كلمة المرور الجديدة"
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <input
                      type="password"
                      className="input-field"
                      placeholder="تأكيد كلمة المرور"
                      value={passwordForm.rePassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, rePassword: e.target.value }))}
                      required
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <button type="submit" className="btn-primary" disabled={passwordLoading}>
                        {passwordLoading ? 'جاري الحفظ...' : 'حفظ'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => { setShowPasswordForm(false); setPasswordForm({ password: '', rePassword: '' }) }}
                        disabled={passwordLoading}
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                )}
             
                
              
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  )
}


