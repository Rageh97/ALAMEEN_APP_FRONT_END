'use client'

import { useState } from 'react'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useUpdateRolePermissions } from '../hooks/useRoles'

export default function RolesManagement() {
  const [activeTab, setActiveTab] = useState('list')
  const [isEditing, setIsEditing] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [roleForm, setRoleForm] = useState({ name: '', nameAr: '', nameEn: '' })
  const [permissions, setPermissions] = useState([{ type: '', value: '' }])

  const { data: roles, isLoading, error, refetch } = useRoles({ pageNumber: 1, pageSize: 20 })
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()
  const updatePermsMutation = useUpdateRolePermissions()

  const resetForm = () => {
    setRoleForm({ name: '', nameAr: '', nameEn: '' })
    setIsEditing(false)
    setEditingRoleId(null)
  }

  const startEdit = (role) => {
    setRoleForm({ name: role.name || '', nameAr: role.nameAr || '', nameEn: role.nameEn || '' })
    setIsEditing(true)
    setEditingRoleId(role.id || role.Id)
    setActiveTab('add')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isEditing) {
      await updateRoleMutation.mutateAsync({ id: editingRoleId, data: roleForm })
    } else {
      await createRoleMutation.mutateAsync(roleForm)
    }
    resetForm()
    setActiveTab('list')
    refetch()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this role?')) return
    await deleteRoleMutation.mutateAsync(id)
    refetch()
  }

  const handlePermissionChange = (index, key, value) => {
    const next = [...permissions]
    next[index] = { ...next[index], [key]: value }
    setPermissions(next)
  }

  const addPermissionRow = () => setPermissions([...permissions, { type: '', value: '' }])
  const removePermissionRow = (index) => setPermissions(permissions.filter((_, i) => i !== index))

  const submitPermissions = async () => {
    if (!editingRoleId) {
      if (typeof window !== 'undefined') {
        const { toast } = await import('react-toastify')
        toast.error('يرجى اختيار صلاحية من القائمة لتحديث الأذونات.')
      }
      return
    }
    const cleaned = permissions.filter(p => p.type && p.value)
    await updatePermsMutation.mutateAsync({ roleId: editingRoleId, permissions: cleaned })
    if (typeof window !== 'undefined') {
      const { toast } = await import('react-toastify')
      toast.success('تم تحديث الأذونات')
    }
  }

  return (
    <div className="space-y-6">
      {/* <h2 className="text-2xl font-bold">ادارة الصلاحيات</h2> */}

      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('list')}
          className={`text-sm  md:text-lg py-2 px-4 font-semibold ${activeTab === 'list' ? 'text-icons' : 'text-gray-500 hover:text-icons'}`}
        >
          القائمة
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`text-sm  md:text-lg py-2 px-4 font-semibold ${activeTab === 'add' ? 'text-icons' : 'text-gray-500 hover:text-icons'}`}
        >
          اضافة / تعديل الصلاحية
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`text-sm  md:text-lg py-2 px-4 font-semibold ${activeTab === 'permissions' ? 'text-icons' : 'text-gray-500 hover:text-icons'}`}
        >
          الصلاحيات
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading roles...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error: {error.message}</div>
          ) : (
            <div className="space-y-3">
              {roles && roles.length > 0 ? roles.map(role => (
                <div key={role.id || role.Id} className="card p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{role.name || role.Name}</div>
                    <div className="text-sm text-gray-600"> {role.nameAr || role.NameAr} </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => startEdit(role)}>تعديل</button>
                    <button className="btn-secondary" onClick={() => { setIsEditing(true); setEditingRoleId(role.id || role.Id); setActiveTab('permissions') }}>الصلاحيات</button>
                    <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => handleDelete(role.id || role.Id)}>حذف</button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">No roles found.</div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">{isEditing ? 'تعديل الصلاحية' : 'اضف صلاحية'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input-field" placeholder="Name" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
            <input className="input-field" placeholder="Name (AR)" value={roleForm.nameAr} onChange={(e) => setRoleForm({ ...roleForm, nameAr: e.target.value })} />
            <input className="input-field" placeholder="Name (EN)" value={roleForm.nameEn} onChange={(e) => setRoleForm({ ...roleForm, nameEn: e.target.value })} />
            <div className="md:col-span-2 flex gap-2 mt-2">
              <button type="submit" className="btn-primary" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                {isEditing ? (updateRoleMutation.isPending ? 'جاري التعديل...' : 'تعديل') : (createRoleMutation.isPending ? 'جاري الاضافة...' : 'اضف صلاحية')}
              </button>
              {isEditing && (
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">تعديل الصلاحيات</h3>
          {editingRoleId ? (
            <>
              <div className="space-y-2">
                {permissions.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input className="input-field" placeholder="Type" value={p.type} onChange={(e) => handlePermissionChange(idx, 'type', e.target.value)} />
                    <input className="input-field" placeholder="Value" value={p.value} onChange={(e) => handlePermissionChange(idx, 'value', e.target.value)} />
                    <div className="flex gap-2 items-center">
                      <button type="button" className="btn-secondary" onClick={addPermissionRow}>Add</button>
                      {permissions.length > 1 && (
                        <button type="button" className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg" onClick={() => removePermissionRow(idx)}>حذف</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="btn-primary" disabled={updatePermsMutation.isPending} onClick={submitPermissions}>
                  {updatePermsMutation.isPending ? 'جاري التعديل...' : 'حفظ الصلاحيات'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-600">Select a role from the list tab and click Permissions to manage its permissions.</div>
          )}
        </div>
      )}
    </div>
  )
}


