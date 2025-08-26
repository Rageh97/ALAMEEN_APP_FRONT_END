'use client'

import { useState } from 'react'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useUpdateRolePermissions } from '../hooks/useRoles'
import DeleteConfirmationModal from './DeleteConfirmationModal'

export default function RolesManagement() {
  const [activeTab, setActiveTab] = useState('list')
  const [isEditing, setIsEditing] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [roleForm, setRoleForm] = useState({ name: '', nameAr: '', nameEn: '' })
  const [permissions, setPermissions] = useState([{ type: '', value: '' }])

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemName: '',
    onConfirm: null
  })

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
    const role = roles?.find(r => (r.id || r.Id) === id)
    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemName: role?.name || role?.Name || `الصلاحية #${id}`,
      onConfirm: async () => {
        await deleteRoleMutation.mutateAsync(id)
        setDeleteModal({ isOpen: false, itemId: null, itemName: '', onConfirm: null })
        refetch()
      }
    })
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
                    <div className="text-sm text-icons"> {role.nameAr || role.NameAr} </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary  gradient-border-2 text-sm p-2" onClick={() => startEdit(role)}>تعديل</button>
                    <button className="cursor-pointer text-orange-500" onClick={() => handleDelete(role.id || role.Id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>
                    </button>
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
            <div className="text-gray-400">يرجى اختيار صلاحية من القائمة لتحديث الأذونات.</div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '', onConfirm: null })}
        onConfirm={deleteModal.onConfirm}
        title="حذف الصلاحية"
        message="هل أنت متأكد أنك تريد حذف هذه الصلاحية؟"
        itemName={deleteModal.itemName}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  )
}


