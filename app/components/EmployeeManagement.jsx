'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { useEmployees, useAddEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees'
import { useRolesList } from '../hooks/useRoles'
import { useUserTypes } from '../hooks/useUsers'
import { useSupervisorsDropdown } from '../hooks/useUsers'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import { formatDateTime, getRelativeTime } from '../utils/dateUtils'

export default function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState('list')
  const [isEditing, setIsEditing] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [originalEmployee, setOriginalEmployee] = useState(null)
  const [filters, setFilters] = useState({
    pageNumber: 1,
    pageSize: 10,
    filterValue: '',
    filterType: '',
    sortType: '',
    dateFrom: '',
    dateTo: '',
    balance: '',
    roleName: '',
    name: '',
    userName: '',
    phoneNumber: ''
  })

  const [newEmployee, setNewEmployee] = useState({
    Name: '',
    UserName: '',
    UserType: 10,
    Mobile: '',
    Email: '',
    Password: '',
    IsActive: true,
    RoleId: undefined,
    UserId: 0,
    Id: 0,
    Balance: 0,
    Profile: null,
    SupervisorId: undefined
  })

  const { data: employeesData, isLoading, error, refetch } = useEmployees(filters)
  const employees = employeesData?.items || []
  const totalItems = employeesData?.totalItems || 0
  const currentPage = employeesData?.currentPage || filters.pageNumber || 1
  const pageSize = filters.pageSize || 10
  

  
  // Filter and log active employees
  const activeEmployees = Array.isArray(employees) ? employees.filter(employee => !employee.isDeleted) : []
  
  const addEmployeeMutation = useAddEmployee()
  const updateEmployeeMutation = useUpdateEmployee()
  const deleteEmployeeMutation = useDeleteEmployee()
  const { data: rolesList } = useRolesList()
  const { data: userTypes } = useUserTypes()
  const { data: supervisorsList } = useSupervisorsDropdown()

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemName: '',
    onConfirm: null
  })
  
const ImagePath = "http://alameenapp.runasp.net/AppMedia/"
  const handleAddEmployee = async (e) => {
    e.preventDefault()
    
    try {
      await addEmployeeMutation.mutateAsync(newEmployee)
      setNewEmployee({
        Name: '',
        UserName: '',
        UserType: 10,
        Mobile: '',
        Email: '',
        Password: '',
        IsActive: true,
        RoleId: undefined,
        UserId: 0,
        Id: 0,
        Balance: 0,
        Profile: null,
        SupervisorId: undefined
      })
      toast.success('تمت إضافة الموظف بنجاح!')
    } catch (error) {
      console.error('Failed to add employee:', error)
      console.log(`Failed to add employee: ${error.message}`)
    }
  }

  const handleUpdateEmployee = async (e) => {
    e.preventDefault()
    console.log('handleUpdateEmployee called with editingEmployee:', editingEmployee)
    
    if (!editingEmployee?.Id) {
      toast.error('لم يتم اختيار موظف للتعديل')
      return
    }

    // Validate required fields (all except Password)
    const requiredFields = ['Name','UserName','UserType','Mobile','Email','RoleId','SupervisorId','Balance']
    const missing = requiredFields.filter((k) => {
      const v = editingEmployee?.[k]
      return v === undefined || v === null || v === ''
    })
    // Require image on edit
    if (!editingEmployee?.Profile) {
      missing.push('Profile')
    }
    if (missing.length > 0) {
      toast.error('يرجى ملء كل الحقول واختيار الصورة قبل الحفظ')
      return
    }

    try {
      // Build minimal payload: only changed fields + Id + Profile if provided
      const allowedFields = ['Name','UserName','UserType','Mobile','Email','IsActive','RoleId','UserId','Id','Balance','Profile','SupervisorId']
      const payload = { Id: editingEmployee.Id }
      const base = originalEmployee || {}
      const normalize = (val, key) => {
        if (val === undefined || val === null) return val
        if (key === 'IsActive') return !!val
        if (['UserType','RoleId','UserId','Id','SupervisorId','Balance'].includes(key)) {
          const n = Number(val)
          return isNaN(n) ? val : n
        }
        return val
      }
      allowedFields.forEach((key) => {
        if (key === 'Id') return
        if (key === 'Profile') {
          if (editingEmployee.Profile) payload.Profile = editingEmployee.Profile
          return
        }
        const newVal = normalize(editingEmployee[key], key)
        const oldVal = normalize(
          base[key] ?? base[key?.charAt(0).toLowerCase()+key?.slice(1)] ?? base[key?.charAt(0).toUpperCase()+key?.slice(1)],
          key
        )
        if (newVal !== undefined && newVal !== null && newVal !== '' && newVal !== oldVal) {
          payload[key] = newVal
        }
      })
      // Ensure required fields per Swagger
      if (!payload.Name && editingEmployee.Name) payload.Name = editingEmployee.Name
      if (!payload.UserName && editingEmployee.UserName) payload.UserName = editingEmployee.UserName
      console.log('Calling updateEmployeeMutation with minimal payload:', { id: editingEmployee.Id, employeeData: payload })
      await updateEmployeeMutation.mutateAsync({ id: editingEmployee.Id, employeeData: payload })
      // Force refresh list to reflect changes immediately
      try { await refetch() } catch {}
      setIsEditing(false)
      setEditingEmployee(null)
      setOriginalEmployee(null)
      toast.success('تم تحديث بيانات الموظف بنجاح!')
    } catch (error) {
      console.error('Failed to update employee:', error)
      toast.error(`فشل تحديث بيانات الموظف: ${error.message}`)
    }
  }

  const handleDeleteEmployee = async (id) => {
    const employee = activeEmployees.find(emp => (emp.id || emp.Id) === id)
    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemName: employee?.Name || employee?.name || `الموظف #${id}`,
      onConfirm: async () => {
      try {
        await deleteEmployeeMutation.mutateAsync(id)
        toast.success('تم حذف الموظف بنجاح!')
          setDeleteModal({ isOpen: false, itemId: null, itemName: '', onConfirm: null })
      } catch (error) {
        console.error('Failed to delete employee:', error)
        toast.error(`فشل حذف الموظف: ${error.message}`)
          setDeleteModal({ isOpen: false, itemId: null, itemName: '', onConfirm: null })
        }
      }
    })
  }

  const startEditing = (employee) => {
    console.log('startEditing called with employee:', employee)
    setOriginalEmployee(employee)
    setEditingEmployee({
      Name: employee.Name || employee.name || '',
      UserName: employee.UserName || employee.userName || '',
      UserType: employee.UserType || employee.userType || 10,
      Mobile: employee.Mobile || employee.phoneNumber || '',
      Email: employee.Email || employee.email || '',
      Password: '', // keep empty unless changed
      IsActive: employee.IsActive !== undefined ? employee.IsActive : (employee.isActive !== undefined ? employee.isActive : true),
      RoleId: employee.RoleId || employee.roleId || undefined,
      UserId: employee.UserId || employee.userId || 0,
      Id: employee.Id || employee.id || 0,
      Balance: employee.Balance != null ? employee.Balance : (employee.balance != null ? employee.balance : 0),
      Profile: null, // Will be set if user uploads new file
      SupervisorId: employee.SupervisorId || employee.supervisorId || undefined
      // Removed SupervisorName as it's not part of EditEmployeeDto
    })
    setIsEditing(true)
    setActiveTab('add') // Switch to add/edit tab
    console.log('startEditing completed, isEditing set to true, activeTab set to add')
  }

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0]
    if (isEdit) {
      setEditingEmployee({ ...editingEmployee, Profile: file })
    } else {
      setNewEmployee({ ...newEmployee, Profile: file })
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }




  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ادارة الموظفين</h2>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-icons">
        <button
          onClick={() => setActiveTab('list')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'list' 
              ? 'text-icons' 
              : 'text-gray-500 hover:text-icons'
          }`}
        >
          قائمة الموظفين
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'add' 
              ? 'text-icons' 
              : 'text-gray-500 hover:text-icons'
          }`}
        >
          اضافة موظف
        </button>
      </div>

      {/* Employee List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-6">
         
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="الاسم"
                className="input-field"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
              <input
                type="text"
                placeholder="اسم المستخدم"
                className="input-field"
                value={filters.userName}
                onChange={(e) => handleFilterChange('userName', e.target.value)}
              />
              <input
                type="text"
                placeholder="رقم الهاتف"
                className="input-field"
                value={filters.phoneNumber}
                onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
              />
              <select
                className="input-field bg-background"
                value={filters.roleName || ''}
                onChange={(e) => handleFilterChange('roleName', e.target.value || '')}
              >
                <option value="">اختر الصلاحية</option>
                {Array.isArray(rolesList) && rolesList.map(r => (
                  <option key={r.id || r.Id} value={(r.name || r.Name) || ''}>
                    {r.name || r.Name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="الرصيد"
                className="input-field"
                value={filters.balance}
                onChange={(e) => handleFilterChange('balance', e.target.value)}
              />
              <select
                className="input-field bg-background"
                value={filters.sortType}
                onChange={(e) => handleFilterChange('sortType', e.target.value)}
              >
                <option value="">ترتيب حسب</option>
                <option value="name">الاسم</option>
                <option value="username">اسم المستخدم</option>
                <option value="balance">الرصيد</option>
                <option value="createdDate">تاريخ الإنشاء</option>
              </select>
            </div>
           
          </div>

        
          {isLoading ? (
            <div className="text-center py-8">جاري تحميل الموظفين...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">خطأ: {error.message}</div>
          ) : (
                        <>
                        <div className="card overflow-x-auto">
              {employees && employees.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-transparent">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الصورة</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الاسم</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">اسم المستخدم</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">اسم المشرف</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الجوال</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الرصيد</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">تاريخ الإنشاء</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الحالة</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                                        {employees
                      .filter(employee => !employee.isDeleted) // Filter out deleted employees
                      .map((employee, index) => {
                        // Alternate row colors matching UsersManagement
                        const rowBgClass = index % 2 === 0 ? 'bg-background-content-1' : 'bg-background-content-1/50'
                        
                        // Handle both field name formats (API vs component expectations)
                        const employeeId = employee.Id || employee.id
                        const employeeName = employee.Name || employee.name
                        const employeeUserName = employee.UserName || employee.userName
                        const employeesupervisorName = employee.supervisorName || employee.SupervisorName || '-'
                        const employeeMobile = employee.Mobile || employee.phoneNumber
                        const employeeBalance = employee.Balance || employee.balance
                        const employeeIsActive = employee.IsActive !== undefined ? employee.IsActive : employee.isActive
                        const employeeProfile = employee.profilePath || employee.ProfilePath || ''
                        const employeeCreationTime = employee.CreationTime || employee.creationTime
                      
                      return (
                        <tr key={employeeId} className={rowBgClass}>
                          <td className="px-4 py-3 text-sm text-center">
                            {employeeProfile ? (
                              <img 
                                src={`${ImagePath}${employeeProfile}`} 
                                alt={employeeName}
                                className="w-12 h-12 rounded-full object-cover mx-auto"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mx-auto">
                                <span className="text-gray-600 text-sm">
                                  {employeeName ? employeeName.charAt(0).toUpperCase() : '?'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{employeeName}</td>
                          <td className="px-4 py-3 text-sm text-center">{employeeUserName}</td>
                          <td className="px-4 py-3 text-sm text-center">{employeesupervisorName}</td>
                          <td className="px-4 py-3 text-sm text-center">{employeeMobile}</td>
                          <td className="px-4 py-3 text-sm text-center">{employeeBalance}</td>
                          
                          <td className="px-4 py-3 text-sm text-center">
                            {employeeCreationTime ? (
                              <div className="flex flex-col items-center">
                                <span className="font-medium">
                                  {formatDateTime(employeeCreationTime)}
                                </span>
                                {/* <span className="text-xs text-gray-500">
                                  {getRelativeTime(employeeCreationTime)}
                                </span> */}
                        </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              employeeIsActive 
                                ? 'bg-green-700 text-text' 
                                : 'bg-red-700 text-text'
                            }`}>
                              {employeeIsActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                                                  <td className="px-4 py-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                      <button
                                onClick={() => {
                                  console.log('Edit button clicked for employee:', employee)
                                  startEditing(employee)
                                }}
                                className="btn-primary gradient-border-2 text-sm p-2"
                      >
                        تعديل
                      </button>
                      <button
                                onClick={() => handleDeleteEmployee(employeeId)}
                                className="cursor-pointer text-orange-500"
                      >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                      </button>
                    </div>
                          </td>
                      </tr>
                    )
                  })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {employees && employees.length > 0 
                    ? 'لا يوجد موظفون نشطون.' 
                    : 'لا يوجد موظفون.'
                  }
                </div>
              )}
            </div>
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
            </>
          )}
        </div>
      )}

      {/* Add/Edit Employee Tab */}
      {activeTab === 'add' && (
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">
            {isEditing ? 'تعديل ' : 'إضافة موظف جديد'}
          </h3>
          <form onSubmit={isEditing ? handleUpdateEmployee : handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Fields */}
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  الاسم *
                </label>
                <input
                  type="text"
                  placeholder="أدخل الاسم"
                  required
                  className="input-field"
                  value={isEditing ? editingEmployee.Name : newEmployee.Name}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, Name: e.target.value})
                    : setNewEmployee({...newEmployee, Name: e.target.value})
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  اسم المستخدم *
                </label>
                <input
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  required
                  className="input-field"
                  value={isEditing ? editingEmployee.UserName : newEmployee.UserName}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, UserName: e.target.value})
                    : setNewEmployee({...newEmployee, UserName: e.target.value})
                  }
                />
              </div>
              
              {/* Optional Fields */}
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  نوع المستخدم
                </label>
                <select
                  className="input-field bg-background"
                  value={isEditing ? (editingEmployee.UserType ?? '') : (newEmployee.UserType ?? '')}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : ''
                    if (isEditing) setEditingEmployee({ ...editingEmployee, UserType: val === '' ? 0 : val })
                    else setNewEmployee({ ...newEmployee, UserType: val === '' ? 0 : val })
                  }}
                >
                  <option value="">اختر نوع المستخدم</option>
                  {Array.isArray(userTypes) && userTypes.map(t => (
                    <option key={(t.id ?? t.value)} value={Number(t.id ?? t.value)}>
                      {t.name ?? t.text}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  الجوال
                </label>
                <input
                  type="tel"
                  placeholder="أدخل رقم الجوال"
                  className="input-field"
                  value={isEditing ? editingEmployee.Mobile : newEmployee.Mobile}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, Mobile: e.target.value})
                    : setNewEmployee({...newEmployee, Mobile: e.target.value})
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  placeholder="أدخل البريد الإلكتروني"
                  className="input-field"
                  value={isEditing ? editingEmployee.Email : newEmployee.Email}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, Email: e.target.value})
                    : setNewEmployee({...newEmployee, Email: e.target.value})
                  }
                />
              </div>
              
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-icons mb-2">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    className="input-field"
                    value={newEmployee.Password}
                    onChange={(e) => setNewEmployee({...newEmployee, Password: e.target.value})}
                  />
                </div>
              )}
              
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-icons mb-2">
                    كلمة المرور الجديدة (اختياري)
                  </label>
                  <input
                    type="password"
                    placeholder="اتركها فارغة إذا لم ترد تغييرها"
                    className="input-field"
                    value={editingEmployee.Password || ''}
                    onChange={(e) => setEditingEmployee({...editingEmployee, Password: e.target.value})}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  الصلاحية
                </label>
                <select
                  className="input-field bg-background"
                  value={isEditing ? (editingEmployee.RoleId ?? '') : (newEmployee.RoleId ?? '')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : Number(e.target.value)
                    if (isEditing) setEditingEmployee({...editingEmployee, RoleId: val})
                    else setNewEmployee({...newEmployee, RoleId: val})
                  }}
                >
                  <option value="">اختر صلاحية</option>
                  {Array.isArray(rolesList) && rolesList.map(r => (
                    <option key={r.id || r.Id} value={Number(r.id || r.Id)}>
                      {r.name || r.Name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  معرّف المستخدم
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="input-field"
                  value={isEditing ? editingEmployee.UserId : newEmployee.UserId}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, UserId: parseInt(e.target.value) || 0})
                    : setNewEmployee({...newEmployee, UserId: parseInt(e.target.value) || 0})
                  }
                />
              </div> */}
              
              {/* <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  المعرّف
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="input-field"
                  value={isEditing ? editingEmployee.Id : newEmployee.Id}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, Id: parseInt(e.target.value) || 0})
                    : setNewEmployee({...newEmployee, Id: parseInt(e.target.value) || 0})
                  }
                />
              </div> */}
              
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  الرصيد
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="1"
                  min="0"
                  className="input-field"
                  value={isEditing ? editingEmployee.Balance : newEmployee.Balance}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, Balance: parseFloat(e.target.value) || 0})
                    : setNewEmployee({...newEmployee, Balance: parseFloat(e.target.value) || 0})
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                 المشرف
                </label>
                <select
                  className="input-field bg-background"
                  value={isEditing ? (editingEmployee.SupervisorId ?? '') : (newEmployee.SupervisorId ?? '')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : Number(e.target.value)
                    if (isEditing) setEditingEmployee({ ...editingEmployee, SupervisorId: val })
                    else setNewEmployee({ ...newEmployee, SupervisorId: val })
                  }}
                >
                  <option value="">اختر مشرفاً</option>
                  {Array.isArray(supervisorsList) && supervisorsList.map(u => (
                    <option key={(u.id ?? u.Id)} value={Number(u.id ?? u.Id)}>
                      {u.name || u.Name || u.userName || u.UserName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isEditing ? editingEmployee.IsActive : newEmployee.IsActive}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, IsActive: e.target.checked})
                    : setNewEmployee({...newEmployee, IsActive: e.target.checked})
                  }
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-icons mx-2">
                  نشط
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-icons mb-2">
                صورة الملف الشخصي
              </label>
              <input
                type="file"
                className="input-field"
                onChange={(e) => handleFileChange(e, isEditing)}
                accept="image/*"
              />
            </div>
            <div className="flex space-x-2">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={addEmployeeMutation.isPending || updateEmployeeMutation.isPending}
              >
                {isEditing 
                  ? (updateEmployeeMutation.isPending ? 'جاري التعديل...' : 'تعديل')
                  : (addEmployeeMutation.isPending ? 'جاري الاضافة...' : 'اضافة')
                }
              </button>
              {isEditing && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditing(false)
                    setEditingEmployee(null)
                  }}
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '', onConfirm: null })}
        onConfirm={deleteModal.onConfirm}
        title="حذف الموظف"
        message="هل أنت متأكد أنك تريد حذف هذا الموظف؟"
        itemName={deleteModal.itemName}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  )
}

