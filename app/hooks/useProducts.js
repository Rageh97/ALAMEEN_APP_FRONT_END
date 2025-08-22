'use client'

import { useState, useEffect } from 'react'
import { productsAPI, authAPI } from '../utils/api'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const getTokenIfNeeded = async () => {
    try {
      const token = localStorage.getItem('authToken')
      console.log('Current token in localStorage:', token)
      
      // Check if user is logged in first - look for userData (what useAuth stores)
      const userData = localStorage.getItem('userData')
      if (!userData) {
        throw new Error('User not logged in. Please sign in first before accessing admin features.')
      }
      
      // Parse user data to check if it's valid
      try {
        const user = JSON.parse(userData)
        console.log('User data found:', user)
        console.log('User data type:', typeof user)
        console.log('User data keys:', Object.keys(user))
        
        // Check if user object is valid and has required properties
        if (!user || typeof user !== 'object') {
          throw new Error('Invalid user data format. Please sign in again.')
        }
        
        // Check for essential user properties
        if (!user.id && !user.userName) {
          console.warn('User data missing essential properties:', user)
          throw new Error('Invalid user data. Please sign in again.')
        } else {
          console.log('User data validation passed')
          console.log('User ID:', user.id)
          console.log('User Name:', user.name)
          console.log('User Type:', user.userType)
          console.log('User Type Name:', user.userTypeName)
          console.log('Is Admin:', user.isAdmin)
        }
      } catch (parseError) {
        console.error('Failed to parse user data:', parseError)
        throw new Error('Invalid user data. Please sign in again.')
      }
      
      // Check if we have a valid token
      if (!token) {
        throw new Error('No authentication token found. Please sign in again.')
      }
      
      console.log('Using existing token from login:', token)
      
      // Don't call GetToken API since it requires user session
      // Just use the token we got from login
      return
    } catch (error) {
      console.error('Failed to validate authentication:', error)
      
      // Provide specific guidance for authentication errors
      if (error.message.includes('requires user authentication') || error.message.includes('not logged in')) {
        throw new Error('Authentication required. Please sign in first, then try accessing the admin dashboard.')
      }
      
      throw error
    }
  }

  const fetchProducts = async (params = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      // Get token if needed
      await getTokenIfNeeded()
      
      // Ensure we use pageNumber: 1 as default
      const defaultParams = {
        pageNumber: 1,
        pageSize: 10,
        ...params
      }
      
      console.log('Fetching products with params:', defaultParams)
      const data = await productsAPI.getAll(defaultParams)
      console.log('Products fetched:', data)
      
      // Handle different response formats
      if (data && Array.isArray(data)) {
        setProducts(data)
      } else if (data && data.items && Array.isArray(data.items)) {
        setProducts(data.items)
      } else if (data && data.data && Array.isArray(data.data)) {
        setProducts(data.data)
        } else {
        console.warn('Unexpected products data format:', data)
        setProducts([])
      }
      
      setIsInitialized(true)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (productData) => {
    try {
      setError(null)
      
      // Get token if needed
      await getTokenIfNeeded()
      
      console.log('Adding product:', productData)
      
        const newProduct = await productsAPI.create(productData)
      console.log('Product added successfully:', newProduct)
      
      // Refresh the products list
      await fetchProducts()
      
        return { success: true, product: newProduct }
    } catch (err) {
      setError(err.message)
      console.error('Error adding product:', err)
      // Try to surface more explicit server message if wrapped
      return { success: false, error: err?.message || 'Failed to add product' }
    }
  }

  const deleteProduct = async (id) => {
    try {
      setError(null)
      
      // Get token if needed
      await getTokenIfNeeded()
      
      console.log('Deleting product with ID:', id)
      
        await productsAPI.delete(id)
      console.log('Product deleted successfully')
      
      // Refresh the products list
      await fetchProducts()
      
      return { success: true }
    } catch (err) {
      setError(err.message)
      console.error('Error deleting product:', err)
      return { success: false, error: err.message }
    }
  }

  const updateProduct = async (id, productData) => {
    try {
      setError(null)
      
      // Get token if needed
      await getTokenIfNeeded()
      
      console.log('Updating product with ID:', id, 'Data:', productData)
      
        const updatedProduct = await productsAPI.update(id, productData)
      console.log('Product updated successfully:', updatedProduct)
      
      // Refresh the products list
      await fetchProducts()
      
        return { success: true, product: updatedProduct }
    } catch (err) {
      setError(err.message)
      console.error('Error updating product:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    // Only fetch products once on mount
    if (!isInitialized) {
    fetchProducts()
    }
  }, []) // Empty dependency array to run only once on mount

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    deleteProduct,
    updateProduct
  }
} 