'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { useEmployees, useAddEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees'
import { useRolesList } from '../hooks/useRoles'
import { useUserTypes } from '../hooks/useUsers'
import { useSupervisorsDropdown } from '../hooks/useUsers'

export default function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState('list')
  const [isEditing, setIsEditing] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [filters, setFilters] = useState({
    pageNumber: 1,
    pageSize: 10,
    filterValue: '',
    filterType: '',
    sortType: '',
    dateFrom: '',
    dateTo: '',
    balance: 0,
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
    RoleId: 0,
    UserId: 0,
    Id: 0,
    Balance: 0,
    Profile: null,
    SupervisorId: 0
  })

  const { data: employees, isLoading, error, refetch } = useEmployees(filters)
  const addEmployeeMutation = useAddEmployee()
  const updateEmployeeMutation = useUpdateEmployee()
  const deleteEmployeeMutation = useDeleteEmployee()
  const { data: rolesList } = useRolesList()
  const { data: userTypes } = useUserTypes()
  const { data: supervisorsList } = useSupervisorsDropdown()

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
        RoleId: 0,
        UserId: 0,
        Id: 0,
        Balance: 0,
        Profile: null,
        SupervisorId: 0
      })
      toast.success('تمت إضافة الموظف بنجاح!')
    } catch (error) {
      console.error('Failed to add employee:', error)
      console.log(`Failed to add employee: ${error.message}`)
    }
  }

  const handleUpdateEmployee = async (e) => {
    e.preventDefault()
    
    if (!editingEmployee?.Id) {
      toast.error('لم يتم اختيار موظف للتعديل')
      return
    }

    try {
      await updateEmployeeMutation.mutateAsync({
        id: editingEmployee.Id,
        employeeData: editingEmployee
      })
      setIsEditing(false)
      setEditingEmployee(null)
      toast.success('تم تحديث بيانات الموظف بنجاح!')
    } catch (error) {
      console.error('Failed to update employee:', error)
      toast.error(`فشل تحديث بيانات الموظف: ${error.message}`)
    }
  }

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف هذا الموظف؟')) {
      try {
        await deleteEmployeeMutation.mutateAsync(id)
        toast.success('تم حذف الموظف بنجاح!')
      } catch (error) {
        console.error('Failed to delete employee:', error)
        toast.error(`فشل حذف الموظف: ${error.message}`)
      }
    }
  }

  const startEditing = (employee) => {
    setEditingEmployee({
      Name: employee.Name || '',
      UserName: employee.UserName || '',
      UserType: employee.UserType || 10,
      Mobile: employee.Mobile || '',
      Email: employee.Email || '',
      Password: '',
      IsActive: employee.IsActive !== undefined ? employee.IsActive : true,
      RoleId: employee.RoleId || 0,
      UserId: employee.UserId || 0,
      Id: employee.Id || 0,
      Balance: employee.Balance || 0,
      Profile: null,
      SupervisorId: employee.SupervisorId || 0
    })
    setIsEditing(true)
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

  const applyFilters = () => {
    refetch()
  }

  const resetFilters = () => {
    setFilters({
      pageNumber: 1,
      pageSize: 10,
      filterValue: '',
      filterType: '',
      sortType: '',
      dateFrom: '',
      dateTo: '',
      balance: 0,
      roleName: '',
      name: '',
      userName: '',
      phoneNumber: ''
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ادارة الموظفين</h2>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-icons">
        {/* <button
          onClick={() => setActiveTab('list')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'list' 
              ? 'text-icons' 
              : 'text-gray-500 hover:text-icons'
          }`}
        >
          قائمة الموظفين
        </button> */}
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
      {/* {activeTab === 'list' && (
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
                value={filters.roleId || ''}
                onChange={(e) => handleFilterChange('roleId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">اختر الصلاحية</option>
                {Array.isArray(rolesList) && rolesList.map(r => (
                  <option key={r.id || r.Id} value={Number(r.id || r.Id)}>
                    {r.name || r.Name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="الرصيد"
                className="input-field"
                value={filters.balance}
                onChange={(e) => handleFilterChange('balance', Number(e.target.value))}
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
            <div className="flex space-x-2 mt-4">
              <button
                onClick={applyFilters}
                className="btn-primary"
              >
                تطبيق الفلاتر
              </button>
              <button
                onClick={resetFilters}
                className="btn-secondary"
              >
                إعادة تعيين
              </button>
            </div>
          </div>

        
          {isLoading ? (
            <div className="text-center py-8">جاري تحميل الموظفين...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">خطأ: {error.message}</div>
          ) : (
            <div className="space-y-4">
              {employees && employees.length > 0 ? employees.map(employee => (
                <div key={employee.Id} className="card p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        {employee.Profile && (
                          <img 
                            src={employee.Profile} 
                            alt={employee.Name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-semibold">{employee.Name}</h3>
                          <p className="text-gray-600">اسم المستخدم: {employee.UserName}</p>
                          <p className="text-gray-600">البريد الإلكتروني: {employee.Email}</p>
                          <p className="text-gray-600">الجوال: {employee.Mobile}</p>
                          <p className="text-gray-600">الرصيد: {employee.Balance}</p>
                          <p className="text-gray-600">الحالة: {employee.IsActive ? 'نشط' : 'غير نشط'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(employee)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.Id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  لا يوجد موظفون.
                </div>
              )}
            </div>
          )}
        </div>
      )} */}

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
              
              <div>
                <label className="block text-sm font-medium text-icons mb-2">
                  الصلاحية
                </label>
                <select
                  className="input-field bg-background"
                  value={isEditing ? editingEmployee.RoleId : newEmployee.RoleId}
                  onChange={(e) => isEditing 
                    ? setEditingEmployee({...editingEmployee, RoleId: Number(e.target.value)})
                    : setNewEmployee({...newEmployee, RoleId: Number(e.target.value)})
                  }
                >
                  <option value={0}>اختر صلاحية</option>
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
                  type="number"
                  step="0.01"
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
                  value={isEditing ? (editingEmployee.SupervisorId || 0) : (newEmployee.SupervisorId || 0)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    if (isEditing) setEditingEmployee({ ...editingEmployee, SupervisorId: val })
                    else setNewEmployee({ ...newEmployee, SupervisorId: val })
                  }}
                >
                  <option value={0}>اختر مشرفاً</option>
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
    </div>
  )
}

