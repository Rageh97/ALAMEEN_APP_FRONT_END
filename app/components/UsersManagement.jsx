'use client'

import { useEffect, useMemo, useState } from 'react'
import { 
  useUsers, 
  useUpdateUserProfile, 
  useDeleteUser, 
  useDeleteUsersRange, 
  useChangeUserPassword, 
  useUserTypes, 
  useSupervisorsDropdown 
} from '../hooks/useUsers'
import { useRolesList } from '../hooks/useRoles'
import { usersAPI, employeesAPI } from '../utils/api'
import { toast } from 'react-toastify'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import { useAuth } from '../hooks/useAuth'

export default function UsersManagement() {
  const [activeTab, setActiveTab] = useState('list')
  const [filters, setFilters] = useState({
    pageNumber: 1,
    pageSize: 10,
    filterValue: '',
    filterType: '',
    sortType: '',
    isLocked: undefined,
    name: '',
    mobile: '',
    isActive: undefined,
    userType: undefined,
    roleId: undefined
  })

  const { data: usersData, isLoading, error, refetch } = useUsers(filters)
  const users = usersData?.items || []
  const totalItems = usersData?.totalItems || 0
  const currentPage = usersData?.currentPage || filters.pageNumber || 1
  const pageSize = filters.pageSize || 10
  const { data: rolesList } = useRolesList()
  const { data: userTypes } = useUserTypes()
  const { data: supervisorsList } = useSupervisorsDropdown()
  
  const userTypeNameById = useMemo(() => {
    const map = new Map()
    ;(Array.isArray(userTypes) ? userTypes : []).forEach(t => {
      const id = t.id ?? t.value ?? t.Value
      const name = t.name ?? t.text ?? t.Name ?? t.Text
      if (id != null) map.set(Number(id), String(name))
    })
    return map
  }, [userTypes])

  const roleNameById = useMemo(() => {
    const map = new Map()
    ;(Array.isArray(rolesList) ? rolesList : []).forEach(r => {
      const id = r.id ?? r.Id
      const name = r.name ?? r.Name
      if (id != null) map.set(Number(id), String(name))
    })
    return map
  }, [rolesList])

  const updateUserMutation = useUpdateUserProfile()
  const deleteUserMutation = useDeleteUser()
  const deleteRangeMutation = useDeleteUsersRange()
  const changePasswordMutation = useChangeUserPassword()
  const { isRegistering } = useAuth()
  const [signupLoading, setSignupLoading] = useState(false)

  const [selectedIds, setSelectedIds] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ id: null, password: '', rePassword: '' })
  const [balancesById, setBalancesById] = useState({})
  const [signupForm, setSignupForm] = useState({ name: '', userName: '', email: '', password: '', mobile: '', userType: '', roleId: '', supervisorId: '', profile: null })

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemName: '',
    isBulk: false,
    onConfirm: null
  })

  useEffect(() => {
    if (!Array.isArray(users) || users.length === 0) return
    let isCancelled = false
    const idsToFetch = []
    for (const u of users) {
      const id = u.id || u.Id
      const inlineBalance = (u.balance != null ? u.balance : u.Balance)
      if (id != null && inlineBalance == null && balancesById[id] == null) {
        idsToFetch.push(id)
      }
    }
    if (idsToFetch.length === 0) return
    ;(async () => {
      try {
        const results = await Promise.all(idsToFetch.map(async (id) => {
          try {
            const detail = await usersAPI.getById(id)
            const bal = (detail?.balance ?? detail?.Balance)
            return [id, bal]
          } catch {
            return [id, undefined]
          }
        }))
        if (!isCancelled) {
          setBalancesById(prev => {
            const updated = { ...prev }
            for (const [id, bal] of results) {
              if (bal != null) updated[id] = bal
            }
            return updated
          })
        }
      } catch {}
    })()
    return () => { isCancelled = true }
  }, [users])

  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const allSelected = useMemo(() => {
    if (!users || users.length === 0) return false
    const ids = users.map(u => u.id || u.Id)
    return ids.every(id => selectedIds.includes(id))
  }, [users, selectedIds])

  const toggleSelectAll = () => {
    if (!users) return
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(users.map(u => u.id || u.Id))
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => refetch()
  const resetFilters = () => setFilters({ pageNumber: 1, pageSize: 10, filterValue: '', filterType: '', sortType: '', isLocked: undefined, name: '', mobile: '', isActive: undefined, userType: undefined, roleId: undefined })

  const startEdit = (user) => {
    setEditingUser({
      Id: user.Id || user.id,
      Name: user.Name || user.name || '',
      UserName: user.UserName || user.userName || '',
      UserType: user.UserType != null ? user.UserType : (user.userType != null ? user.userType : 10),
      Mobile: user.Mobile || user.mobile || '',
      IsActive: user.IsActive != null ? user.IsActive : (user.isActive != null ? user.isActive : true),
      RoleId: user.RoleId != null ? user.RoleId : (user.roleId != null ? user.roleId : 1), // Default to role 1 if none
      Balance: user.Balance != null ? user.Balance : (user.balance != null ? user.balance : 0),
      Profile: null
    })
    setActiveTab('edit')
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (!editingUser?.Id) return
    
    // Validate required fields
    if (!editingUser.RoleId) {
      toast.error('يرجى اختيار صلاحية للمستخدم')
      return
    }
    
    try {
      await updateUserMutation.mutateAsync({ id: editingUser.Id, data: editingUser })
      setEditingUser(null)
      setActiveTab('list')
      toast.success('تم تحديث المستخدم بنجاح')
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('حدث خطأ أثناء تحديث المستخدم')
    }
  }

  const deleteOne = async (id) => {
    const user = users?.find(u => (u.id || u.Id) === id)
    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemName: user?.name || user?.Name || `المستخدم #${id}`,
      isBulk: false,
      onConfirm: async () => {
        await deleteUserMutation.mutateAsync(id)
        setDeleteModal({ isOpen: false, itemId: null, itemName: '', isBulk: false, onConfirm: null })
        refetch()
      }
    })
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    setDeleteModal({
      isOpen: true,
      itemId: null,
      itemName: `${selectedIds.length} مستخدم`,
      isBulk: true,
      onConfirm: async () => {
        await deleteRangeMutation.mutateAsync(selectedIds)
        setSelectedIds([])
        setDeleteModal({ isOpen: false, itemId: null, itemName: '', isBulk: false, onConfirm: null })
        refetch()
      }
    })
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    if (!passwordForm.id) return
    await changePasswordMutation.mutateAsync({ id: passwordForm.id, password: passwordForm.password, rePassword: passwordForm.rePassword })
    setPasswordForm({ id: null, password: '', rePassword: '' })
    toast.success('تم تغيير كلمة المرور')
  }

  return (
    <div className="space-y-6">
      {/* <h2 className="text-2xl font-bold">ادارة المستخدمين</h2> */}

      <div className="flex space-x-4 border-b">
        <button onClick={() => setActiveTab('list')} className={`text-sm md:text-lg py-2 px-4 font-semibold ${activeTab === 'list' ? 'text-icons' : 'text-gray-500 hover:text-icons'}`}>قائمة المستخدمين</button>
        <button onClick={() => setActiveTab('edit')} className={`text-sm md:text-lg py-2 px-4 font-semibold ${activeTab === 'edit' ? 'text-icons' : 'text-gray-500 hover:text-icons'}`}>تعديل مستخدم</button>
        <button onClick={() => setActiveTab('password')} className={`text-sm md:text-lg py-2 px-4 font-semibold ${activeTab === 'password' ? 'text-icons' : 'text-gray-500 hover:text-icons'}`}>تغيير باسوورد</button>
        <button onClick={() => setActiveTab('signup')} className={`text-sm md:text-lg py-2 px-4 font-semibold ${activeTab === 'signup' ? 'text-icons' : 'text-gray-500 hover:text-icons'}`}>تسجيل مستخدم</button>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">البحث</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input className="input-field" placeholder="الاسم" value={filters.name || ''} onChange={(e) => handleFilterChange('name', e.target.value)} />
              <input className="input-field" placeholder="الجوال" value={filters.mobile || ''} onChange={(e) => handleFilterChange('mobile', e.target.value)} />
            
              <select className="input-field bg-background" value={filters.userType ?? ''} onChange={(e) => handleFilterChange('userType', e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">كل أنواع المستخدم</option>
                {Array.isArray(userTypes) && userTypes.map(t => (
                  <option key={t.value || t.Value} value={Number(t.value || t.Value)}>{t.text || t.Text}</option>
                ))}
              </select>
              <select className="input-field bg-background" value={filters.isActive ?? ''} onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}>
                <option value="">أي حالة</option>
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
             
            </div>
           
          </div>

          {isLoading ? (
            <div className="text-center py-8">جاري تحميل المستخدمين...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">خطأ: {error.message}</div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">رقم</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الاسم</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">اسم المستخدم</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الجوال</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الحالة</th>
                    {/* <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الصلاحية</th> */}
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">نوع المستخدم</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الرصيد</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {Array.isArray(users) && users.length > 0 ? users.map((u, index) => {
                    const id = u.id || u.Id
                    const isActive = (u.isActive != null ? u.isActive : u.IsActive)
                    // Check multiple possible field names for role
                    const roleId = (u.roleId != null ? u.roleId : u.RoleId) || 
                                  (u.role != null ? u.role : u.Role) ||
                                  (u.roleName != null ? u.roleName : u.RoleName)
                    
                    // Try to get role name from multiple sources
                    let roleName = '-'
                    if (roleId && typeof roleId === 'number') {
                      // If we have a numeric roleId, try to map it to a name
                      roleName = roleNameById.get(roleId) || roleId.toString()
                    } else if (typeof roleId === 'string') {
                      // If roleId is already a string, it might be the role name
                      roleName = roleId
                    } else if (u.roleName || u.RoleName) {
                      // Fallback to direct role name fields
                      roleName = u.roleName || u.RoleName
                    }
                    
                    const userTypeId = (u.userType != null ? u.userType : u.UserType)
                    const userType = userTypeNameById.get(Number(userTypeId)) || userTypeId || '-'
                    const balance = (u.balance != null ? u.balance : (u.Balance != null ? u.Balance : balancesById[id]))
                    
                    // Alternate row colors
                    const rowBgClass = index % 2 === 0 ? 'bg-background-content-1' : 'bg-background-content-1/50'
                    
                    return (
                      <tr key={id} className={rowBgClass}>
                        <td className="px-4 py-3 text-sm text-center">
                          <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelected(id)} />
                        </td>
                        <td className="px-4 py-3 text-sm text-center">{id}</td>
                        <td className="px-4 py-3 text-sm text-center">{u.name || u.Name}</td>
                        <td className="px-4 py-3 text-sm text-center">{u.userName || u.UserName}</td>
                        <td className="px-4 py-3 text-sm text-center">{u.mobile || u.phoneNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-700 text-text' : 'bg-red-700 text-text'}`}>
                            {isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        {/* <td className="px-4 py-3 text-sm text-center">{roleName}</td> */}
                        <td className="px-4 py-3 text-sm text-center">{userType}</td>
                        <td className="px-4 py-3 text-sm text-center">{balance ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="btn-primary text-sm p-2 gradient-border-2" onClick={() => startEdit(u)}>تعديل</button>
                            {/* <button className="btn-secondary" onClick={() => setPasswordForm({ id, password: '', rePassword: '' })}>Change Password</button> */}
                            <button className="cursor-pointer text-orange-500" onClick={() => deleteOne(id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-6 text-center text-gray-500">لا يوجد مستخدمين</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-icons">
          الصفحة {currentPage} {Math.ceil(totalItems / pageSize) > 1 ? ` / ${Math.ceil(totalItems / pageSize)}` : ''}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary text-xs p-2"
            disabled={currentPage <= 1}
            onClick={() => {
              if (currentPage <= 1) return
              setFilters(prev => ({ ...prev, pageNumber: currentPage - 1 }))
              refetch()
            }}
          >
            السابق
          </button>
          <button
            className="btn-primary text-xs p-2"
            disabled={currentPage >= Math.ceil(totalItems / pageSize)}
            onClick={() => {
              const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
              if (currentPage >= totalPages) return
              setFilters(prev => ({ ...prev, pageNumber: currentPage + 1 }))
              refetch()
            }}
          >
            التالي
          </button>
        </div>
      </div>

      {activeTab === 'edit' && (
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">تعديل المستخدم</h3>
          {editingUser ? (
            <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input-field" placeholder="Name" value={editingUser.Name} onChange={(e) => setEditingUser({ ...editingUser, Name: e.target.value })} />
              <input className="input-field" placeholder="Username" value={editingUser.UserName} onChange={(e) => setEditingUser({ ...editingUser, UserName: e.target.value })} />
              <input className="input-field" placeholder="Mobile" value={editingUser.Mobile} onChange={(e) => setEditingUser({ ...editingUser, Mobile: e.target.value })} />
              <input type="text" pattern="[0-9]*" className="input-field" placeholder="Balance" value={editingUser.Balance} onChange={(e) => setEditingUser({ ...editingUser, Balance: Number(e.target.value) })} />
              <select className="input-field bg-background" value={editingUser.UserType ?? ''} onChange={(e) => setEditingUser({ ...editingUser, UserType: e.target.value === '' ? undefined : Number(e.target.value) })}>
                <option value="">Select User Type</option>
                {Array.isArray(userTypes) && userTypes.map(t => (
                  <option key={t.value || t.Value} value={Number(t.value || t.Value)}>{t.text || t.Text}</option>
                ))}
              </select>
              <select className="input-field bg-background" value={editingUser.RoleId ?? ''} onChange={(e) => setEditingUser({ ...editingUser, RoleId: e.target.value === '' ? undefined : Number(e.target.value) })}>
                <option value="">No Role</option>
                {Array.isArray(rolesList) && rolesList.map(r => (
                  <option key={r.id || r.Id} value={Number(r.id || r.Id)}>{r.name || r.Name}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="userIsActive" checked={!!editingUser.IsActive} onChange={(e) => setEditingUser({ ...editingUser, IsActive: e.target.checked })} />
                <label htmlFor="userIsActive" className="text-sm text-gray-700">Active</label>
              </div>
              <input type="file" className="input-field  md:col-span-2" onChange={(e) => setEditingUser({ ...editingUser, Profile: e.target.files?.[0] || null })} accept="image/*" />
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary" disabled={updateUserMutation.isPending}>{updateUserMutation.isPending ? 'Saving...' : 'Save'}</button>
                <button type="button" className="btn-secondary" onClick={() => { setEditingUser(null); setActiveTab('list') }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="text-gray-400">اختر مستخدم من قائمة المستخدمين للتعديل</div>
          )}
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">تغيير كلمة المرور</h3>
          {passwordForm.id ? (
            <form onSubmit={submitPassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="password" className="input-field" placeholder="New Password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} required />
              <input type="password" className="input-field" placeholder="Re-enter Password" value={passwordForm.rePassword} onChange={(e) => setPasswordForm({ ...passwordForm, rePassword: e.target.value })} required />
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="btn-primary" disabled={changePasswordMutation.isPending}>{changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}</button>
                <button type="button" className="btn-secondary" onClick={() => setPasswordForm({ id: null, password: '', rePassword: '' })}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="text-gray-400">اختر مستخدم من قائمة المستخدمين لتغيير كلمة المرور</div>
          )}
        </div>
      )}

      {activeTab === 'signup' && (
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">تسجيل مستخدم جديد</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                setSignupLoading(true)
                // Use Employees endpoint for creating users (as per backend Swagger)
                const payload = {
                  Name: signupForm.name,
                  UserName: signupForm.userName,
                  Email: signupForm.email,
                  Password: signupForm.password,
                  Mobile: signupForm.mobile?.trim() || '',
                  RoleId: signupForm.roleId ? Number(signupForm.roleId) : undefined,
                  UserType: signupForm.userType ? Number(signupForm.userType) : undefined,
                  SupervisorId: signupForm.supervisorId ? Number(signupForm.supervisorId) : undefined,
                  // Intentionally omit Balance/Id to mirror Swagger (send empty by omission)
                  Profile: signupForm.profile || null,
                  IsActive: true
                }
                const res = await employeesAPI.register(payload)
                // Validate success flag/message if present
                if (res && (res.success === false || res.statusCode >= 400)) {
                  throw new Error(res.message || 'فشل إنشاء الحساب')
                }

                // Verify user exists in Users list by username (immediate)
                try {
                  const check = await usersAPI.getAll({ pageNumber: 1, pageSize: 10, filterType: 'username', filterValue: signupForm.userName })
                  const list = Array.isArray(check) ? check : (Array.isArray(check?.data) ? check.data : (Array.isArray(check?.items) ? check.items : []))
                  const found = (list || []).some(u => String((u.userName || u.UserName || '')).toLowerCase() === signupForm.userName.toLowerCase())
                  if (!found) {
                    // Retry after a short delay to allow backend to persist
                    await new Promise(r => setTimeout(r, 800))
                    const check2 = await usersAPI.getAll({ pageNumber: 1, pageSize: 10, filterType: 'username', filterValue: signupForm.userName })
                    const list2 = Array.isArray(check2) ? check2 : (Array.isArray(check2?.data) ? check2.data : (Array.isArray(check2?.items) ? check2.items : []))
                    const found2 = (list2 || []).some(u => String((u.userName || u.UserName || '')).toLowerCase() === signupForm.userName.toLowerCase())
                    if (!found2) {
                      throw new Error('تم الإرسال بنجاح حسب الخادم، لكن المستخدم لم يظهر بعد. جرّب تحديث القائمة أو تحقق من المرشحات.')
                    }
                  }
                } catch (verifyErr) {
                  throw verifyErr
                }

                toast.success('تم إنشاء الحساب بنجاح')
                setSignupForm({ name: '', userName: '', email: '', password: '', mobile: '', userType: '', roleId: '', supervisorId: '', profile: null })
                refetch()
              } catch (err) {
                toast.error(err?.message || 'فشل إنشاء الحساب')
              } finally {
                setSignupLoading(false)
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-icons mb-2">الاسم</label>
              <input className="input-field" required value={signupForm.name} onChange={(e)=>setSignupForm(prev=>({...prev,name:e.target.value}))} disabled={signupLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-icons mb-2">اسم المستخدم</label>
              <input className="input-field" required value={signupForm.userName} onChange={(e)=>setSignupForm(prev=>({...prev,userName:e.target.value}))} disabled={signupLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-icons mb-2">البريد الإلكتروني</label>
              <input type="email" className="input-field" required value={signupForm.email} onChange={(e)=>setSignupForm(prev=>({...prev,email:e.target.value}))} disabled={signupLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-icons mb-2">كلمة المرور</label>
              <input type="password" className="input-field" required value={signupForm.password} onChange={(e)=>setSignupForm(prev=>({...prev,password:e.target.value}))} disabled={signupLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-icons mb-2">رقم الجوال</label>
              <input className="input-field" value={signupForm.mobile} onChange={(e)=>setSignupForm(prev=>({...prev,mobile:e.target.value}))} disabled={signupLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-icons mb-2">نوع المستخدم</label>
              <select className="input-field bg-background" value={signupForm.userType} onChange={(e)=>setSignupForm(prev=>({...prev,userType:e.target.value}))} disabled={signupLoading}>
                <option value="">اختر...</option>
                {Array.isArray(userTypes) && userTypes.map(t => (
                  <option key={t.value || t.Value} value={t.value || t.Value}>{t.text || t.Text}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-icons mb-2">المشرف (اختياري)</label>
              <select className="input-field bg-background" value={signupForm.supervisorId} onChange={(e)=>setSignupForm(prev=>({...prev,supervisorId:e.target.value}))} disabled={signupLoading}>
                <option value="">بدون</option>
                {Array.isArray(supervisorsList) && supervisorsList.map(u => (
                  <option key={(u.id ?? u.Id)} value={u.id ?? u.Id}>{u.name || u.Name || u.userName || u.UserName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-icons mb-2">الصلاحية</label>
              <select className="input-field bg-background" value={signupForm.roleId} onChange={(e)=>setSignupForm(prev=>({...prev,roleId:e.target.value}))} disabled={signupLoading}>
                <option value="">اختر...</option>
                {Array.isArray(rolesList) && rolesList.map(r => (
                  <option key={r.id || r.Id} value={r.id || r.Id}>{r.name || r.Name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-icons mb-2">الصورة الشخصية</label>
              <input type="file" className="input-field" accept="image/*" onChange={(e)=>setSignupForm(prev=>({...prev,profile:e.target.files?.[0] || null}))} disabled={signupLoading} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary" disabled={signupLoading}>{signupLoading ? 'جاري الإنشاء...' : 'تسجيل'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '', isBulk: false, onConfirm: null })}
        onConfirm={deleteModal.onConfirm}
        title={deleteModal.isBulk ? "حذف المستخدمين" : "حذف المستخدم"}
        message={deleteModal.isBulk ? "هل أنت متأكد أنك تريد حذف المستخدمين المحددين؟" : "هل أنت متأكد أنك تريد حذف هذا المستخدم؟"}
        itemName={deleteModal.itemName}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  )
}



