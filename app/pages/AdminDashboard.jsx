'use client'

import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { toast } from 'react-toastify'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'
import { usePointConversionSettings, useUpdatePointConversionSetting } from '../hooks/usePointConversion'
import EmployeeManagement from '../components/EmployeeManagement'
import RolesManagement from '../components/RolesManagement'
import UsersManagement from '../components/UsersManagement'

export default function AdminDashboard({ setCurrentView }) {
  const [activeTab, setActiveTab] = useState('products')
  const { user, isLoading: authLoading } = useAuth()
  const { products, addProduct, updateProduct, deleteProduct, loading: productsLoading, error: productsError, fetchProducts } = useProducts()
  const { 
    orders, 
    pendingOrders, 
    fetchOrders, 
    fetchPendingOrders, 
    approveRequest, 
    rejectRequest, 
    deleteOrder,
    getOrderById,
    editRechargeRequest,
    editProductRequest,
    testNotification,
    investigateNotificationAPI,
    checkNotificationCreation,
    testAPIEndpoints,
    loading: ordersLoading
  } = useOrders()

  // Ensure orders are fetched when user is available
  useEffect(() => {
    if (user && !authLoading) {
      console.log('AdminDashboard: User available, fetching orders...')
      fetchOrders()
      fetchPendingOrders()
    }
  }, [user, authLoading])

  // Renders the transfer image. Falls back to fetching by id if path is not present in list item.
  const OrderImageCell = ({ orderId, initialPath }) => {
    const [path, setPath] = useState(initialPath || '')

    useEffect(() => {
      let cancelled = false
      const load = async () => {
        if (!path && orderId) {
          try {
            const res = await getOrderById(orderId)
            const fetched = res?.order?.transferImagePath || res?.order?.TransferImagePath || res?.order?.transferImage || res?.order?.TransferImage || ''
            if (!cancelled && fetched) setPath(fetched)
          } catch {}
        }
      }
      load()
      return () => { cancelled = true }
    }, [orderId, path])

    if (!path) return '—'
    const isAbsolute = /^https?:\/\//i.test(path)
    const src = isAbsolute ? path : `${ImagePath}${path}`
    return (
      <a href={src} target="_blank" rel="noreferrer">
        <img src={src} alt="Transfer" className="h-12 w-12 rounded object-cover border border-gray-700" />
      </a>
    )
  }
const ImagePath = "http://alameenapp.runasp.net/AppMedia/"
  // Point conversion settings
  const { 
    data: pointSettings, 
    isLoading: pointSettingsLoading, 
    error: pointSettingsError 
  } = usePointConversionSettings()
  
  const updatePointSetting = useUpdatePointConversionSetting()

  const [newProduct, setNewProduct] = useState({
    nameEn: '',
    nameAr: '',
    description: '',
    pointsCost: '',
    path: '',
    file: null
  })

  const [editingProduct, setEditingProduct] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  
  // Inline edit state for requests (both recharge and product)
  const [editingRequestId, setEditingRequestId] = useState(null)
  const [editingRequestType, setEditingRequestType] = useState(null) // 'recharge' | 'product'
  const [requestEditForm, setRequestEditForm] = useState({ amount: '', quantity: '', transferImage: null, transferImagePath: '' })
  const [editingRequestOrder, setEditingRequestOrder] = useState(null)

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading authentication...</div>
      </div>
    )
  }

  // Redirect if not admin
  if (!user?.isAdmin && user?.userType !== 10) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">Access denied. Admin privileges required.</div>
      </div>
    )
  }

  // Show authentication required message
  if (productsError && productsError.includes('Authentication required')) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Authentication Required</div>
          <div className="text-gray-600 mb-4">
            You need to be logged in to access admin features.
          </div>
          <button
            onClick={() => setCurrentView('signin')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    console.log('=== ADD PRODUCT FORM SUBMITTED ===')
    console.log('Form data:', newProduct)

    // Trim string fields
    const payload = {
      nameEn: (newProduct.nameEn || '').trim(),
      nameAr: (newProduct.nameAr || '').trim(),
      description: (newProduct.description || '').trim(),
      path: (newProduct.path || '').trim(),
      pointsCost: Number(newProduct.pointsCost)
    }

    // Add file if present
    if (newProduct.file) {
      payload.file = newProduct.file
    }

    // Client-side validation
    if (!payload.nameEn || !payload.description) {
      toast.error('يرجى تعبئة اسم المنتج (بالإنجليزية) والوصف')
      return
    }
    if (!Number.isFinite(payload.pointsCost) || payload.pointsCost < 0) {
      toast.error('يرجى إدخال تكلفة نقاط صحيحة (>= 0)')
      return
    }
    // Ensure at least Path or File is provided (server usually expects one)
    if (!payload.path && !payload.file) {
      toast.error('يرجى توفير مسار صورة/ملف أو رفع ملف')
      return
    }

    try {
      setIsAdding(true)
      console.log('Calling addProduct with payload...', payload)
      const result = await addProduct(payload)
      console.log('Add product result:', result)

      if (result.success) {
        console.log('Product added successfully!')
        setNewProduct({ nameEn: '', nameAr: '', description: '', pointsCost: 0, path: '', file: null })
        toast.success('تم إضافة المنتج بنجاح!')
      } else {
        console.error('Add product failed:', result.error)
        toast.error(`فشل في إضافة المنتج: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to add product:', error)
      toast.error(`خطأ أثناء إضافة المنتج: ${error.message}`)
    } finally {
      setIsAdding(false)
    }
  }

  const handleEditProduct = async (e) => {
    e.preventDefault()
    console.log('=== EDIT PRODUCT FORM SUBMITTED ===')
    console.log('Editing product:', editingProduct)

    if (!editingProduct || !editingProduct.id) {
      toast.error('لم يتم اختيار منتج للتعديل')
      return
    }

    // Trim string fields
    const payload = {
      id: editingProduct.id,
      nameEn: (editingProduct.nameEn || '').trim(),
      nameAr: (editingProduct.nameAr || '').trim(),
      description: (editingProduct.description || '').trim(),
      path: (editingProduct.path || '').trim(),
      pointsCost: Number(editingProduct.pointsCost)
    }

    // Add file if present
    if (editingProduct.file) {
      payload.file = editingProduct.file
    }

    // Client-side validation
    if (!payload.nameEn || !payload.description) {
      toast.error('يرجى تعبئة اسم المنتج (بالإنجليزية) والوصف')
      return
    }
    if (!Number.isFinite(payload.pointsCost) || payload.pointsCost < 0) {
      toast.error('يرجى إدخال تكلفة نقاط صحيحة (>= 0)')
      return
    }
    // Ensure at least Path or File is provided (server usually expects one)
    if (!payload.path && !payload.file) {
      toast.error('يرجى توفير مسار صورة/ملف أو رفع ملف')
      return
    }

    try {
      setIsAdding(true)
      console.log('Calling updateProduct with payload...', payload)
      const result = await updateProduct(editingProduct.id, payload)
      console.log('Update product result:', result)

      if (result.success) {
        console.log('Product updated successfully!')
        setIsEditing(false)
        setEditingProduct(null)
        toast.success('تم تحديث المنتج بنجاح!')
      } else {
        console.error('Update product failed:', result.error)
        toast.error(`فشل في تحديث المنتج: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to update product:', error)
      toast.error(`خطأ أثناء تحديث المنتج: ${error.message}`)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id)
        // Products list will be refreshed automatically by the hook
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  const startEditing = (product) => {
    setEditingProduct({
      id: product.id,
      nameEn: product.nameEn || product.name || '',
      nameAr: product.nameAr || '',
      description: product.description || '',
      pointsCost: product.pointsCost || product.price || 0,
      path: product.path || product.image || '',
      file: null
    })
    setIsEditing(true)
  }

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0]
    if (isEdit) {
      setEditingProduct({ ...editingProduct, file })
    } else {
      setNewProduct({ ...newProduct, file })
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    await updateOrderStatus(orderId, status)
  }
  
  // Determine request type and start editing
  const startEditingRequest = (order) => {
    console.log('=== START EDITING REQUEST ===')
    console.log('Order object:', order)
    console.log('Order ID:', order.id || order.Id)
    console.log('Order amount:', order.amount)
    console.log('Order quantity:', order.quantity)
    console.log('Order type:', order.type)
    console.log('Order typeValue:', order.typeValue)
    
    const isRecharge = (order.amount != null || order.Amount != null) || String(order.typeValue || order.type || '').toLowerCase().includes('recharge')
    console.log('Is recharge request:', isRecharge)
    
    const resolvedId = order.id || order.Id
    setEditingRequestId(resolvedId)
    setEditingRequestType(isRecharge ? 'recharge' : 'product')
    setEditingRequestOrder(order)
    
    // Initialize form with current values
    const formData = {
      amount: '',
      quantity: '',
      transferImage: null,
      transferImagePath: ''
    }
    
    if (isRecharge) {
      const resolvedAmount = (order.amount != null ? order.amount : order.Amount)
      formData.amount = resolvedAmount !== null && resolvedAmount !== undefined ? String(resolvedAmount) : ''
      formData.transferImagePath = order.transferImagePath || order.transferImage || ''
      console.log('Recharge form data:', formData)
    } else {
      formData.quantity = order.quantity !== null && order.quantity !== undefined ? order.quantity.toString() : ''
      console.log('Product form data:', formData)
    }
    
    console.log('Setting form data:', formData)
    setRequestEditForm(formData)
    console.log('=== END START EDITING REQUEST ===')
  }
  
  const handleRequestFileChange = (e) => {
    const file = e.target.files[0]
    setRequestEditForm(prev => ({ ...prev, transferImage: file, transferImagePath: file ? file.name : prev.transferImagePath }))
  }
  
  const saveRequestEdit = async () => {
    console.log('=== SAVE REQUEST EDIT START ===')
    console.log('editingRequestId:', editingRequestId)
    console.log('editingRequestType:', editingRequestType)
    console.log('requestEditForm:', requestEditForm)
    
    if (!editingRequestId) {
      console.error('No request selected for editing')
      toast.error('لم يتم اختيار طلب للتعديل')
      return
    }

    try {
      let payload = {}
      let success = false

      if (editingRequestType === 'recharge') {
        console.log('Processing recharge request...')
        // Validate recharge data
        if (requestEditForm.amount === '' || requestEditForm.amount === null) {
          console.error('Amount is empty')
          toast.error('يرجى إدخال مبلغ صالح لطلب الشحن')
          return
        }
        
        const amount = parseFloat(requestEditForm.amount)
        if (isNaN(amount) || amount <= 0) {
          console.error('Invalid amount:', amount)
          toast.error('يرجى إدخال مبلغ موجب صالح')
          return
        }

        payload = {
          Amount: amount
        }
        
        if (requestEditForm.transferImagePath) {
          payload.TransferImagePath = requestEditForm.transferImagePath
        }
        if (requestEditForm.transferImage) {
          payload.TransferImage = requestEditForm.transferImage
        }

        console.log('Saving recharge request with payload:', payload)
        const res = await editRechargeRequest(editingRequestId, payload)
        console.log('Recharge edit response:', res)
        success = !!res?.success
        
        if (!success) {
          console.error('Recharge edit failed:', res)
          toast.error(`فشل حفظ طلب الشحن: ${res?.error || 'خطأ غير معروف'}`)
          return
        }
      } else {
        console.log('Processing product request...')
        // Validate product data
        if (requestEditForm.quantity === '' || requestEditForm.quantity === null) {
          console.error('Quantity is empty')
          toast.error('يرجى إدخال كمية صالحة لطلب المنتج')
          return
        }
        
        const quantity = parseInt(requestEditForm.quantity)
        if (isNaN(quantity) || quantity <= 0) {
          console.error('Invalid quantity:', quantity)
          toast.error('يرجى إدخال كمية موجبة صالحة')
          return
        }

        // Build payload per Swagger: { id, productId, forUserId, quantity }
        const productId = editingRequestOrder?.productId || editingRequestOrder?.ProductId || editingRequestOrder?.product?.id
        const forUserId = editingRequestOrder?.forUserId || editingRequestOrder?.ForUserId || editingRequestOrder?.requestedByUserId
        payload = {
          id: editingRequestId,
          productId: productId != null ? Number(productId) : undefined,
          forUserId: forUserId != null ? String(forUserId) : undefined,
          quantity: quantity
        }
        console.log('Saving product request with payload:', payload)
        const res = await editProductRequest(editingRequestId, payload)
        console.log('Product edit response:', res)
        success = !!res?.success
        
        if (!success) {
          console.error('Product edit failed:', res)
          toast.error(`فشل حفظ طلب المنتج: ${res?.error || 'خطأ غير معروف'}`)
          return
        }
        
        // Show success message with method used
        if (res.method === 'recharge_fallback') {
          console.log('Product edit succeeded using recharge endpoint fallback')
        } else {
          console.log('Product edit succeeded using product endpoint')
        }
      }

      // Success - reset form and refresh
      console.log('Edit successful, resetting form...')
      toast.success('تم تحديث الطلب بنجاح!')
      setEditingRequestId(null)
      setEditingRequestType(null)
      setEditingRequestOrder(null) // Clear the order object
      setRequestEditForm({ amount: '', quantity: '', transferImage: null, transferImagePath: '' })
      // Refresh is handled optimistically and by a delayed hook refresh
      console.log('=== SAVE REQUEST EDIT SUCCESS ===')
      
    } catch (error) {
      console.error('=== SAVE REQUEST EDIT ERROR ===')
      console.error('Error saving request edit:', error)
      console.error('Error stack:', error.stack)
      toast.error(`خطأ أثناء حفظ التغييرات: ${error.message}`)
    }
  }
  
  const cancelRequestEdit = () => {
    setEditingRequestId(null)
    setEditingRequestType(null)
    setEditingRequestOrder(null) // Clear the order object
    setRequestEditForm({ amount: '', quantity: '', transferImage: null, transferImagePath: '' })
  }
  
  const handleApprove = async (id) => {
    const res = await approveRequest(id)
    if (res?.success) {
      toast.success('تمت الموافقة على الطلب بنجاح!')
    } else {
      toast.error(res?.error || 'فشل في الموافقة على الطلب')
    }
  }
  
  const handleReject = async (id) => {
    const res = await rejectRequest(id)
    if (res?.success) {
      toast.success('تم رفض الطلب بنجاح!')
    } else {
      toast.error(res?.error || 'فشل في رفض الطلب')
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    const ok = window.confirm('هل أنت متأكد أنك تريد حذف هذا الطلب؟')
    if (!ok) return
    const res = await deleteOrder(id)
    if (res?.success) {
      toast.success('تم حذف الطلب بنجاح!')
    } else {
      toast.error(res?.error || 'فشل في حذف الطلب')
      return
    }
    // Local UI is updated by hook deleteOrder via fetchOrders, but ensure quick feedback
    try { await fetchOrders() } catch {}
  }



  return (
    
    <div className="space-y-6 px-3 lg:px-0 ">
      <h1 className="text-3xl font-bold">لوحة التحكم</h1>
      
      {/* Tabs */}
      <div className="flex items-center justify-center flex-wrap space-x-4 gradient-border">
          <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'products' 
              ? 'text-icons ' 
              : 'text-gray-400 hover:text-icons'
          }`}
        >
          المنتجات
          </button>
          <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'orders' 
              ? 'text-icons ' 
              : 'text-gray-400 hover:text-icons'
          }`}
        >
          الطلبات
          </button>
          <button
          onClick={() => setActiveTab('employees')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'employees' 
              ? 'text-icons ' 
              : 'text-gray-400 hover:text-icons'
          }`}
        >
          الموظفين
          </button>
          <button
          onClick={() => setActiveTab('roles')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'roles' 
              ? 'text-icons ' 
              : 'text-gray-400 hover:text-icons'
          }`}
        >
          الصلاحيات
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'users' 
              ? 'text-icons ' 
              : 'text-gray-400 hover:text-icons'
          }`}
        >
          المستخدمين
        </button>
        
        <button
          onClick={() => setActiveTab('points')}
          className={`py-2 px-4 font-semibold ${
            activeTab === 'points' 
              ? 'text-icons' 
              : 'text-gray-400 hover:text-icons'
          }`}
        >
          النقاط
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6 flex flex-col  justify-center px-3">
          {/* Add/Edit Product Form */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">
              {isEditing ? ' تعديل المنتج' : 'اضف منتج جديد'}
            </h2>
            <form onSubmit={isEditing ? handleEditProduct : handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="اسم المنتج (English) *"
                required
                className="input-field"
                value={isEditing ? editingProduct.nameEn : newProduct.nameEn}
                onChange={(e) => isEditing 
                  ? setEditingProduct({...editingProduct, nameEn: e.target.value})
                  : setNewProduct({...newProduct, nameEn: e.target.value})
                }
              />
              <input
                type="text"
                placeholder="اسم المنتج (Arabic)"
                className="input-field"
                value={isEditing ? editingProduct.nameAr : newProduct.nameAr}
                onChange={(e) => isEditing 
                  ? setEditingProduct({...editingProduct, nameAr: e.target.value})
                  : setNewProduct({...newProduct, nameAr: e.target.value})
                }
              />
              <textarea
                placeholder="الوصف *"
                required
                className="input-field md:col-span-2"
                rows="3"
                value={isEditing ? editingProduct.description : newProduct.description}
                onChange={(e) => isEditing 
                  ? setEditingProduct({...editingProduct, description: e.target.value})
                  : setNewProduct({...newProduct, description: e.target.value})
                }
              />
              {/* <input
                type="text"
                placeholder="Image/File Path"
                className="input-field"
                value={isEditing ? editingProduct.path : newProduct.path}
                onChange={(e) => isEditing 
                  ? setEditingProduct({...editingProduct, path: e.target.value})
                  : setNewProduct({...newProduct, path: e.target.value})
                }
              /> */}
              <input
                type="number"
                placeholder="التكلفة *"
                required
                min="0"
                className="input-field"
                value={isEditing ? editingProduct.pointsCost : (newProduct.pointsCost ?? '')}
                onChange={(e) => {
                  const val = e.target.value
                  const num = val === '' ? '' : Number(val)
                  if (isEditing) {
                    setEditingProduct({ ...editingProduct, pointsCost: num === '' ? '' : Number.isNaN(num) ? editingProduct.pointsCost : num })
                  } else {
                    setNewProduct({ ...newProduct, pointsCost: num === '' ? '' : Number.isNaN(num) ? newProduct.pointsCost : num })
                  }
                }}
              />
              <input
                type="file"
                className="input-field md:col-span-2"
                onChange={(e) => handleFileChange(e, isEditing)}
                accept="image/*,.pdf,.doc,.docx"
              />
              <div className="md:col-span-2 flex space-x-2">
                <button type="submit" className="btn-primary  gradient-border-2" disabled={isAdding}>
                  {isEditing ? (isAdding ? 'جاري التعديل...' : ' تعديل') : (isAdding ? 'جاري الاضافة...' : 'اضافة')}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setIsEditing(false)
                      setEditingProduct(null)
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Products List */}
          {productsLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : productsError ? (
            <div className="text-center py-8 text-red-600">Error: {productsError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-3">
              {products && products.length > 0 ? products.map(product => (
                <div key={product.id} className="card gradient-border-2 gap-6 overflow-hidden">
                <img 
        src={   ImagePath + product?.path} 
        alt={product?.name} 
        className="w-full h-[250px] object-cover  rounded-xl"
      />
      <div className="p-6 flex flex-col items-center">
        <h3 className="text-xl text-icons font-semibold mb-2">{product?.name}</h3>
        <p className="text-gray-300 mb-4">{product?.description}</p>
       
        <div className="flex items-center gap-2 w-full justify-center px-3">
                      <button
                        onClick={() => startEditing(product)}
                        className="flex-1  btn-card px-4 py-2 rounded-xl bg-gradient-to-r from-background-content-1 via-background-content-3 to-background-content-1 text-icons gradient-border-button-header"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product?.id)}
                        className="flex-1 btn-card px-4 py-2 rounded-xl bg-gradient-to-r from-background-content-1 via-background-content-3 to-background-content-1 text-orange-500 gradient-border-button-header"
                      >
                        حذف
                      </button>
                    </div>
          {/* <button
            onClick={() => addToCart(product)}
            className="btn-card px-4 py-2 rounded-xl bg-gradient-to-r from-background-content-1 via-background-content-3 to-background-content-1 text-white gradient-border-button-header "
          >
           <span className="text-white font-bold "> تقديم طلب </span>
           <span className="text-sm  font-bold text-icons">${product?.pointsCost}</span>
          </button> */}
       
                  </div>
                  
                </div>
               
              )) : (
                <div className="col-span-full text-center py-8 text-gray-400">
                 لا يوجد منتجات متاحة
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">إدارة الطلبات</h2>
   
          
        
          {ordersLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-icons/40 text-center">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">رقم</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">النوع</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">مقدّم الطلب</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">المنتج</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">المبلغ/الكمية</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الحالة</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الصورة</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-icons uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-icons/40">
                  {orders && orders.length > 0 ? (
                    orders.map((order, index) => {
                      const orderId = order.id || order.Id
                      const isEditingThis = editingRequestId === orderId
                      const isRecharge = (order.amount != null || order.Amount != null) || String(order.typeValue || order.type || '').toLowerCase().includes('recharge')
                      
                      // Alternate row colors
                      const rowBgClass = index % 2 === 0 ? 'bg-background-content-1' : 'bg-background-content-1/50'
                      
                      return (
                        <tr key={orderId} className={rowBgClass}>
                          <td className="px-4 py-3 text-sm text-center">{orderId}</td>
                          <td className="px-4 py-3 text-sm text-center">{order.typeValue || order.type || (isRecharge ? 'شحن' : 'منتج')}</td>
                          <td className="px-4 py-3 text-sm text-center">{order.requestedByUserName || order.requestedByName || order.userName || '—'}</td>
                          <td className="px-4 py-3 text-sm text-center">{order.productName || order.product?.name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            {isEditingThis ? (
                              isRecharge ? (
                                <div className="space-y-2">
                                  <input
                                    type="number"
                                    className="input-field w-28"
                                    value={requestEditForm.amount}
                                    onChange={(e) => {
                                      console.log('Amount changed:', e.target.value)
                                      setRequestEditForm(prev => ({ ...prev, amount: e.target.value }))
                                    }}
                                    min="0"
                                    // step="0.01"
                                    placeholder="أدخل المبلغ"
                                  />
                                  <div className="text-xs text-gray-400">
                                    القيمة الحالية: {order.amount || '—'}
                    </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <input
                                    type="number"
                                    className="input-field w-24"
                                    value={requestEditForm.quantity}
                                    onChange={(e) => {
                                      console.log('Quantity changed:', e.target.value)
                                      setRequestEditForm(prev => ({ ...prev, quantity: e.target.value }))
                                    }}
                                    min="1"
                                    step="1"
                                    placeholder="أدخل الكمية"
                                  />
                                  <div className="text-xs text-gray-400">
                                    القيمة الحالية: {order.quantity || '—'}
                                  </div>
                                </div>
                              )
                            ) : (
                              isRecharge ? (order.amount ?? order.Amount ?? '—') : (order.quantity ?? '—')
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{
                            (() => {
                              const statusIsPending = (order.status === 0 || String(order.statusValue || '').toLowerCase() === 'pending')
                              const statusIsApproved = (order.status === 1 || String(order.statusValue || '').toLowerCase() === 'approved')
                              const statusIsRejected = (order.status === 2 || String(order.statusValue || '').toLowerCase() === 'rejected')
                              const label = statusIsPending ? 'في الانتظار' : statusIsApproved ? 'تمت الموافقة' : statusIsRejected ? 'مرفوض' : (order.statusValue || order.status || '—')
                              const base = 'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium'
                              const cls = statusIsPending
                                ? 'bg-yellow-400 text-black'
                                : statusIsApproved
                                  ? 'bg-green-400 text-black'
                                  : statusIsRejected
                                    ? 'bg-red-400 text-white'
                                    : 'bg-gray-100 text-gray-800'
                              return (
                                <span className={`${base} ${cls}`}>{label}</span>
                              )
                            })()
                          }</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <OrderImageCell 
                              orderId={orderId}
                              initialPath={order.transferImagePath || order.TransferImagePath || order.transferImage || order.TransferImage}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {isEditingThis ? (
                              <div className="flex items-center justify-center gap-2">
                                {isRecharge && (
                                  <input type="file" accept="image/*" onChange={handleRequestFileChange} className="text-xs" />
                                )}
                                <button onClick={saveRequestEdit} className="btn-primary px-3 py-1">Save</button>
                                <button onClick={cancelRequestEdit} className="btn-secondary px-3 py-1">Cancel</button>
                              </div>
                            ) : (
                              (order.status === 0 || String(order.statusValue || '').toLowerCase() === 'pending') ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleApprove(orderId)} className="btn-card bg-green-500 text-white px-3 py-1">Approve</button>
                                  <button onClick={() => handleReject(orderId)} className="btn-card bg-red-500 text-white px-3 py-1">Reject</button>
                                  <button 
                                    onClick={() => {
                                      console.log('Edit button clicked for order:', order)
                                      startEditingRequest(order)
                                    }} 
                                    className="btn-card px-3 py-1"
                                  >
                                    Edit
                                  </button>
                                  <button onClick={() => handleDelete(orderId)} className="btn-card px-3 py-1 bg-red-500 text-white border-red-400 hover:bg-red-500 hover:text-white">Delete</button>
                  </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleDelete(orderId)} className="btn-card px-3 py-1 text-white bg-red-500 border-red-400 hover:bg-red-500 hover:text-white">Delete</button>
                </div>
                              )
                            )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-6 text-center text-gray-400">لا توجد طلبات.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
          )}
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <EmployeeManagement />
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <RolesManagement />
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UsersManagement />
      )}

      {/* Points Tab */}
      {activeTab === 'points' && (
        <div className="card space-y-6">
          {pointSettingsLoading ? (
            <div className="text-center py-8">جاري تحميل إعدادات تحويل النقاط...</div>
          ) : pointSettingsError ? (
            <div className="text-center py-8 text-red-600">خطأ: {pointSettingsError}</div>
          ) : (
            <div className="space-y-6">
              {/* Current Settings Display */}
              <div className="bg-transparent p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">إعدادات تحويل النقاط الحالية</h3>
                {pointSettings && pointSettings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pointSettings.map(setting => (
                      <div key={setting.id} className="bg-transparent p-4 rounded-lg ">
                        <div className="space-y-2 text-sm">
                          {/* <p><span className="font-medium">المبلغ بالدولار:</span> ${setting.amountInMoney}</p> */}
                          {/* <p><span className="font-medium">النقاط المكافئة:</span> {setting.equivalentPoints} نقطة</p> */}
                          <p><span className="font-medium">معدل التحويل:</span> 1 = {(setting.equivalentPoints / (setting.amountInMoney || 1)).toFixed(2)} نقطة</p>
                        </div>
                      </div>
                    ))}
        </div>
                ) : (
                  <p className="text-gray-400">لا توجد إعدادات لتحويل النقاط.</p>
                )}
              </div>

              {/* Edit Settings Form */}
              <div className="bg-transparent p-6 rounded-lg ">
                <h3 className="text-lg font-semibold mb-4">تعديل إعداد تحويل النقاط</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target)
                  const settingId = parseInt(formData.get('settingId'))
                  const amountInMoney = parseFloat(formData.get('amountInMoney'))
                  const equivalentPoints = parseInt(formData.get('equivalentPoints'))
                  
                  if (!settingId || isNaN(amountInMoney) || isNaN(equivalentPoints)) {
                    toast.error('يرجى تعبئة جميع الحقول بأرقام صحيحة')
                    return
                  }
                  
                  updatePointSetting.mutate({
                    id: settingId,
                    data: {
                      id: settingId,
                      amountInMoney: amountInMoney,
                      equivalentPoints: equivalentPoints
                    }
                  })
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        معرّف الإعداد
                      </label>
                      <select
                        name="settingId"
                        required
                        className="input-field bg-background"
                      >
                        <option value="">اختر إعداداً</option>
                        {pointSettings && pointSettings.map(setting => (
                          <option key={setting.id} value={setting.id}>
                            الإعداد #{setting.id} (${setting.amountInMoney} = {setting.equivalentPoints} نقطة)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        المبلغ  
                      </label>
                      <input
                        type="number"
                        name="amountInMoney"
                        
                        min="0"
                        required
                        className="input-field"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        النقاط المكافئة
                      </label>
                      <input
                        type="number"
                        name="equivalentPoints"
                        min="1"
                        required
                        className="input-field"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={updatePointSetting.isPending}
                    className="btn-primary hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {updatePointSetting.isPending ? 'جاري التحديث...' : 'تحديث الإعداد'}
                  </button>
                  {updatePointSetting.isSuccess && (
                    <span className="ml-3 text-green-600">تم تحديث الإعداد بنجاح!</span>
                  )}
                  {updatePointSetting.isError && (
                    <span className="ml-3 text-red-600">خطأ: {updatePointSetting.error?.message}</span>
                  )}
                </form>
              </div>

        </div>
      )}
        </div>
      )}
    </div>
  )
} 