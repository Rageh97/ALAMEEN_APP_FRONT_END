'use client'

import { useEffect, useMemo, useState } from 'react'
import { 
  useUsers, 
  useUpdateUserProfile, 
  useDeleteUser, 
  useDeleteUsersRange, 
  useChangeUserPassword, 
  useUserTypes 
} from '../hooks/useUsers'
import { useRolesList } from '../hooks/useRoles'
import { usersAPI } from '../utils/api'
import { toast } from 'react-toastify'

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

  const { data: users, isLoading, error, refetch } = useUsers(filters)
  const { data: rolesList } = useRolesList()
  const { data: userTypes } = useUserTypes()
  
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

  const [selectedIds, setSelectedIds] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ id: null, password: '', rePassword: '' })
  const [balancesById, setBalancesById] = useState({})

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
      UserType: user.UserType != null ? user.UserType : (user.userType != null ? user.userType : undefined),
      Mobile: user.Mobile || user.mobile || '',
      IsActive: user.IsActive != null ? user.IsActive : (user.isActive != null ? user.isActive : true),
      RoleId: user.RoleId != null ? user.RoleId : (user.roleId != null ? user.roleId : undefined),
      Balance: user.Balance != null ? user.Balance : (user.balance != null ? user.balance : 0),
      Profile: null
    })
    setActiveTab('edit')
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (!editingUser?.Id) return
    await updateUserMutation.mutateAsync({ id: editingUser.Id, data: editingUser })
    setEditingUser(null)
    setActiveTab('list')
    refetch()
  }

  const deleteOne = async (id) => {
    if (!window.confirm('Delete this user?')) return
    await deleteUserMutation.mutateAsync(id)
    refetch()
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} users?`)) return
    await deleteRangeMutation.mutateAsync(selectedIds)
    setSelectedIds([])
    refetch()
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
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input className="input-field" placeholder="Name" value={filters.name || ''} onChange={(e) => handleFilterChange('name', e.target.value)} />
              <input className="input-field" placeholder="Mobile" value={filters.mobile || ''} onChange={(e) => handleFilterChange('mobile', e.target.value)} />
              <select className="input-field" value={filters.roleId ?? ''} onChange={(e) => handleFilterChange('roleId', e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">All Roles</option>
                {Array.isArray(rolesList) && rolesList.map(r => (
                  <option key={r.id || r.Id} value={Number(r.id || r.Id)}>{r.name || r.Name}</option>
                ))}
              </select>
              <select className="input-field bg-background" value={filters.userType ?? ''} onChange={(e) => handleFilterChange('userType', e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">All User Types</option>
                {Array.isArray(userTypes) && userTypes.map(t => (
                  <option key={t.value || t.Value} value={Number(t.value || t.Value)}>{t.text || t.Text}</option>
                ))}
              </select>
              <select className="input-field bg-background" value={filters.isActive ?? ''} onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}>
                <option value="">Any Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <select className="input-field bg-background" value={filters.isLocked ?? ''} onChange={(e) => handleFilterChange('isLocked', e.target.value === '' ? undefined : e.target.value === 'true')}>
                <option value="">Any Lock</option>
                <option value="true">Locked</option>
                <option value="false">Unlocked</option>
              </select>
            </div>
            <div className="flex space-x-2 mt-4">
              <button className="btn-primary px-1 md:px-3" onClick={applyFilters}>Apply</button>
              <button className="btn-secondary px-1 md:px-3" onClick={resetFilters}>Reset</button>
              <button className="btn-secondary px-1 md:px-3" onClick={deleteSelected} disabled={selectedIds.length === 0 || deleteRangeMutation.isPending}>
                {deleteRangeMutation.isPending ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error: {error.message}</div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {Array.isArray(users) && users.length > 0 ? users.map(u => {
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
                    return (
                      <tr key={id}>
                        <td className="px-4 py-3 text-sm">
                          <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelected(id)} />
                        </td>
                        <td className="px-4 py-3 text-sm">{id}</td>
                        <td className="px-4 py-3 text-sm">{u.name || u.Name}</td>
                        <td className="px-4 py-3 text-sm">{u.userName || u.UserName}</td>
                        <td className="px-4 py-3 text-sm">{u.mobile || u.Mobile || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {String(isActive)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{roleName}</td>
                        <td className="px-4 py-3 text-sm">{userType}</td>
                        <td className="px-4 py-3 text-sm">{balance ?? '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button className="btn-secondary" onClick={() => startEdit(u)}>Edit</button>
                            {/* <button className="btn-secondary" onClick={() => setPasswordForm({ id, password: '', rePassword: '' })}>Change Password</button> */}
                            <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => deleteOne(id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-6 text-center text-gray-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'edit' && (
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">تعديل المستخدم</h3>
          {editingUser ? (
            <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input-field" placeholder="Name" value={editingUser.Name} onChange={(e) => setEditingUser({ ...editingUser, Name: e.target.value })} />
              <input className="input-field" placeholder="Username" value={editingUser.UserName} onChange={(e) => setEditingUser({ ...editingUser, UserName: e.target.value })} />
              <input className="input-field" placeholder="Mobile" value={editingUser.Mobile} onChange={(e) => setEditingUser({ ...editingUser, Mobile: e.target.value })} />
              <input type="number" className="input-field" placeholder="Balance" value={editingUser.Balance} onChange={(e) => setEditingUser({ ...editingUser, Balance: Number(e.target.value) })} />
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
            <div className="text-gray-600">Select a user from the list to edit.</div>
          )}
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">Change Password</h3>
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
            <div className="text-gray-600">Select a user from the list tab and click Password to change their password.</div>
          )}
        </div>
      )}
    </div>
  )
}



