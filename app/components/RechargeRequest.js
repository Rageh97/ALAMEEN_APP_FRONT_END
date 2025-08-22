'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'

export default function RechargeRequest() {
  const { user } = useAuth()
  const { createRechargeRequest, loading, error } = useOrders()
  
  const [formData, setFormData] = useState({
    amount: '',
    transferImage: null,
    transferImagePath: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState(null) // 'success' | 'error'

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        transferImage: file,
        transferImagePath: file.name
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.amount ) {
      setMessage('يرجى إدخال مبلغ صالح')
      setMessageType('error')
      toast.error('يرجى إدخال مبلغ صالح')
      return
    }

    if (!formData.transferImage) {
      setMessage('يرجى رفع صورة التحويل')
      setMessageType('error')
      toast.error('يرجى رفع صورة التحويل')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setMessageType(null)

    try {
      const result = await createRechargeRequest({
        amount: formData.amount,
        transferImage: formData.transferImage,
        transferImagePath: formData.transferImagePath
      })

      if (result.success) {
        setMessage('تم إرسال طلب الشحن بنجاح!')
        setMessageType('success')
        toast.success('تم إرسال طلب الشحن بنجاح!')
        setFormData({
          amount: '',
          transferImage: null,
          transferImagePath: ''
        })
        // Reset file input
        const fileInput = document.getElementById('transferImage')
        if (fileInput) fileInput.value = ''
      } else {
        setMessage(`فشل إرسال طلب الشحن: ${result.error}`)
        setMessageType('error')
        toast.error(`فشل إرسال طلب الشحن: ${result.error}`)
      }
    } catch (err) {
      setMessage(`خطأ: ${err.message}`)
      setMessageType('error')
      toast.error(`خطأ: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">يرجى تسجيل الدخول لإرسال طلبات الشحن.</div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto ">
      <div className=" rounded-lg shadow p-6 card">
        <h2 className="text-2xl font-bold mb-6 text-center">طلب شحن</h2>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 ">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-icons mb-1">
              المبلغ
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              // step="0.01"
              min="1"
              required
              className="input-field"
              placeholder="أدخل المبلغ"
            />
          </div>

          <div>
            <label htmlFor="transferImage" className="block text-sm font-medium text-icons mb-1">
              صورة التحويل
            </label>
            <input
              type="file"
              id="transferImage"
              name="transferImage"
              onChange={handleFileChange}
              accept="image/*"
              required
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              قم برفع صورة أو لقطة شاشة للحوالة البنكية
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white text-sm md:text-lg ${
              isSubmitting || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الشحن'}
          </button>
        </form>

   
      </div>
    </div>
  )
}
