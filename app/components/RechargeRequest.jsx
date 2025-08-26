'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function RechargeRequest({ isOpen, onClose }) {
  const { user } = useAuth()
  const { createRechargeRequest, loading } = useOrders()
  
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
        
        // Close modal after success
        setTimeout(() => {
          onClose()
        }, 2000)
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

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        amount: '',
        transferImage: null,
        transferImagePath: null
      })
      setMessage('')
      setMessageType(null)
      onClose()
    }
  }

  if (!user) {
    return null
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/70 bg-opacity-50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
        {/* Modal Content */}
        <div className="card rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-background-content-2">
            <h2 className="text-xl font-bold text-text">طلب شحن</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-icons hover:text-text transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {message && (
              <div className={`mb-4 p-3 rounded ${
                messageType === 'success' 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-icons mb-1">
                  المبلغ
                </label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-background-content-2 border border-background-content-3 rounded-lg text-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-background-content-3 focus:border-transparent"
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
                  className="w-full px-3 py-2 bg-background-content-2 border border-background-content-3 rounded-lg text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-background-content-3 file:text-text hover:file:bg-background-content-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  قم برفع صورة أو لقطة شاشة للحوالة البنكية
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white text-sm md:text-lg transition-all duration-200 ${
                  isSubmitting || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-background-content-3 focus:ring-offset-2 focus:ring-offset-background-content-1'
                }`}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الشحن'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
