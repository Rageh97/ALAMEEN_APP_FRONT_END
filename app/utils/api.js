// API utility functions for making HTTP requests

const API_BASE_URL = "/api"

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Get token from localStorage
  const token = localStorage.getItem('authToken')

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'lang': 'en',
      ...options.headers
    },
    ...options
  }

  // Add authorization header if token exists
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

 
 

  const response = await fetch(url, config)
  

    
    if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    try {
      const errorData = await response.text()
      
      if (errorData) {
        try {
          const parsedError = JSON.parse(errorData)
          errorMessage = parsedError.message || parsedError.error || errorMessage
        } catch {
          errorMessage = errorData || errorMessage
        }
      }
    } catch (e) {
      console.log('Could not read error response:', e)
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  
  return data
}

// Auth API functions
export const authAPI = {
  // Get authentication token
  getToken: async () => {
    try {
      
      
      const response = await fetch(`${API_BASE_URL}/Auth/GetToken`, {
        method: 'GET',
        headers: {
          'lang': 'en'
        }
      })



      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          
          
          // Check if this is the specific authentication error
          if (errorData.includes('System.ArgumentException') || errorData.includes('IndexOutOfRangeException')) {
            errorMessage = 'GetToken requires user authentication. Please login first.'
          } else if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
     
      
      // Handle different possible token response formats
      let tokenToStore = null
      if (result.token) {
        tokenToStore = result.token
      } else if (result.accessToken) {
        tokenToStore = result.accessToken
      } else if (result.access_token) {
        tokenToStore = result.access_token
      } else if (typeof result === 'string') {
        tokenToStore = result
      } else if (result.data && result.data.token) {
        tokenToStore = result.data.token
      } else {
        tokenToStore = JSON.stringify(result)
      }
      
      
      // Store token in localStorage
      if (tokenToStore) {
        localStorage.setItem('authToken', tokenToStore)
      } else {
        throw new Error('No authentication token received from server')
      }
      
      return result
    } catch (error) {
    
      
      // If it's the authentication error, provide helpful guidance
      if (error.message.includes('requires user authentication')) {
        
      }
      
      throw error
    }
  },

  // Login endpoint
  signIn: async (userName, password) => {
    try {
    
      
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'lang': 'en'
        },
      body: JSON.stringify({ userName, password })
    })



      if (!response.ok) {
       
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
     
      return result
    } catch (error) {
     
      throw error
    }
  },

  // Register endpoint
  signUp: async (userData) => {
    try {
     
      
    // Create FormData for multipart/form-data
    const formData = new FormData()
    
      // Required fields - must be strings
      formData.append('UserName', userData.userName.toString())
      formData.append('Name', userData.name.toString())
      formData.append('Password', userData.password.toString())
      formData.append('Email', userData.email.toString()) // Email is required
      
      // Optional fields - only send if provided and not default values
      if (userData.mobile && userData.mobile.trim()) {
        formData.append('Mobile', userData.mobile.trim())
      }
      if (userData.userType !== undefined && userData.userType !== null && userData.userType !== '') {
        formData.append('UserType', userData.userType.toString())
      }
      if (userData.roleId !== undefined && userData.roleId !== null && userData.roleId !== 0) {
        formData.append('RoleId', userData.roleId.toString()) // Convert to string for FormData
      }
      if (userData.balance !== undefined && userData.balance !== null && userData.balance !== 0) {
        formData.append('Balance', userData.balance.toString()) // Convert to string for FormData
      }
      if (userData.profile) {
        formData.append('Profile', userData.profile)
      }




      // Add optional Authorization header if token exists (as in Swagger example)
      const token = localStorage.getItem('authToken')
      const headers = {
        'lang': 'en'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/Auth/register`, {
      method: 'POST',
      headers,
      body: formData
      })



      if (!response.ok) {
       
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              
              // Check for specific error messages
              if (parsedError.message && parsedError.message.includes('found')) {
                if (parsedError.message.includes('email') || parsedError.message.includes('Email')) {
                  errorMessage = 'This email address is already registered. Please use a different email or try signing in instead.'
                } else {
                  errorMessage = parsedError.message
                }
              } else if (parsedError.UserType) {
                // Handle UserType validation errors
                errorMessage = `UserType validation error: ${parsedError.UserType.join(', ')}`
              } else {
                errorMessage = parsedError.message || parsedError.error || errorMessage
              }
            } catch {
              // If it's not JSON, check if it contains specific error text
              if (errorData.includes('found') && (errorData.includes('email') || errorData.includes('Email'))) {
                errorMessage = 'This email address is already registered. Please use a different email or try signing in instead.'
              } else {
                errorMessage = errorData || errorMessage
              }
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        console.log('Final error message:', errorMessage)
        throw new Error(errorMessage)
      }

      const result = await response.json()
     
      return result
    } catch (error) {
     
      throw error
    }
  },

  signOut: async () => {
    return apiRequest('/auth/signout', {
      method: 'POST'
    })
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me')
  }
}

// Products API functions
export const productsAPI = {
  // Get all products with pagination and filtering
  getAll: async (params = {}) => {
    try {
     
      
      const {
        pageNumber = 1, // Start from page 1 instead of 0
        pageSize = 10,
        filterValue = '',
        filterType = '',
        sortType = '',
        dateFrom = '',
        dateTo = '',
        name = '',
        pointsCost = 0
      } = params

      const url = `${API_BASE_URL}/Product`


      // Get token from localStorage (from login)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }

      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }

      // Prepare request body - ensure positive values for pagination
      const requestBody = {
        pageNumber: Math.max(1, pageNumber || 1), // Ensure pageNumber is at least 1
        pageSize: Math.max(1, Math.min(100, pageSize || 10)) // Ensure pageSize is between 1 and 100
      }

      // Only add optional parameters if they have meaningful values
      if (filterValue && filterValue.trim()) {
        requestBody.filterValue = filterValue.trim()
      }
      if (filterType && filterType.trim()) {
        requestBody.filterType = filterType.trim()
      }
      if (sortType && sortType.trim()) {
        requestBody.sortType = sortType.trim()
      }
      if (dateFrom && dateFrom.trim()) {
        requestBody.dateFrom = dateFrom.trim()
      }
      if (dateTo && dateTo.trim()) {
        requestBody.dateTo = dateTo.trim()
      }
      if (name && name.trim()) {
        requestBody.name = name.trim()
      }
      if (pointsCost !== undefined && pointsCost !== null && pointsCost !== 0) {
        requestBody.pointsCost = pointsCost
      }



      let response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      // Retry once on 401 by refreshing token
      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody)
            })
          }
        } catch (e) {
          // Fall through to normal error handling
        }
      }



      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
     
      throw error
    }
  },

  getById: async (id) => {
    try {
      
      
      const url = `${API_BASE_URL}/Product/${id}`
    

      // Get token from localStorage (from login)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }

      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }



      let response = await fetch(url, {
        method: 'GET',
        headers
      })

      // Retry once on 401 by refreshing token
      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(url, {
              method: 'GET',
              headers
            })
          }
        } catch {}
      }



      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      throw error
    }
  },

  // Create new product
  create: async (productData) => {
    try {
     
      
      // Get token from localStorage (from login)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }
      
      // Create FormData for multipart/form-data
      const formData = new FormData()
      
      // Add fields to FormData
      if (productData.id) formData.append('Id', productData.id.toString())
      if (productData.nameEn) formData.append('NameEn', productData.nameEn)
      if (productData.nameAr) formData.append('NameAr', productData.nameAr)
      if (productData.description) formData.append('Description', productData.description)
      if (productData.pointsCost !== undefined) formData.append('PointsCost', productData.pointsCost.toString())
      if (productData.path) formData.append('Path', productData.path)
      if (productData.file) formData.append('File', productData.file)



      const headers = {
        'lang': 'en'
      }

      // Add authorization header with token from login
      headers['Authorization'] = `Bearer ${token}`

      let response = await fetch(`${API_BASE_URL}/Product/register`, {
      method: 'POST',
        headers,
        body: formData
      })

      // Retry once on 401 by refreshing token
      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(`${API_BASE_URL}/Product/register`, {
              method: 'POST',
              headers,
              body: formData
            })
          }
        } catch {}
      }



      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          console.log('Error response body:', errorData)
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      throw error
    }
  },

  // Update existing product
  update: async (id, productData) => {
    try {
     
      
      // Get token from localStorage (from login)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }
      
      // Create FormData for multipart/form-data
      const formData = new FormData()
      
      // Add fields to FormData
      formData.append('Id', id.toString())
      if (productData.nameEn) formData.append('NameEn', productData.nameEn)
      if (productData.nameAr) formData.append('NameAr', productData.nameAr)
      if (productData.description) formData.append('Description', productData.description)
      if (productData.pointsCost !== undefined) formData.append('PointsCost', productData.pointsCost.toString())
      if (productData.path) formData.append('Path', productData.path)
      if (productData.file) formData.append('File', productData.file)



      const headers = {
        'lang': 'en'
      }

      // Add authorization header with token from login
      headers['Authorization'] = `Bearer ${token}`

      let response = await fetch(`${API_BASE_URL}/Product/Edit/${id}`, {
      method: 'PUT',
        headers,
        body: formData
      })

      // Retry once on 401 by refreshing token
      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(`${API_BASE_URL}/Product/Edit/${id}`, {
              method: 'PUT',
              headers,
              body: formData
            })
          }
        } catch {}
      }



      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      throw error
    }
  },

  delete: async (id) => {
    try {
     
      
      // Get token from localStorage (from login)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }
      
      const headers = {
        'lang': 'en'
      }

      // Add authorization header with token from login
      headers['Authorization'] = `Bearer ${token}`

      let response = await fetch(`${API_BASE_URL}/Product/${id}`, {
        method: 'DELETE',
        headers
      })

      // Retry once on 401 by refreshing token
      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(`${API_BASE_URL}/Product/${id}`, {
              method: 'DELETE',
              headers
            })
          }
        } catch {}
      }



      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          console.log('Error response body:', errorData)
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      throw error
    }
  }
}

// Orders API functions
export const ordersAPI = {
  getAll: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')

    const url = `${API_BASE_URL}/UserRequest`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    
    // Build request body with only meaningful parameters
    const body = {
      pageNumber: Math.max(1, parseInt(params.pageNumber) || 1),
      pageSize: Math.max(1, Math.min(100, parseInt(params.pageSize) || 10))
    }
    
    // Only add optional parameters if they have meaningful values
    if (params.filterValue && params.filterValue.trim() !== '') {
      body.filterValue = params.filterValue.trim()
    }
    
    if (params.filterType && params.filterType.trim() !== '') {
      body.filterType = params.filterType.trim()
    }
    
    if (params.sortType && params.sortType.trim() !== '') {
      body.sortType = params.sortType.trim()
    }
    
    if (params.productName && params.productName.trim() !== '') {
      body.productName = params.productName.trim()
    }
    
    if (params.requestedByUserName && params.requestedByUserName.trim() !== '') {
      body.requestedByUserName = params.requestedByUserName.trim()
    }
    
    if (params.forUserId && params.forUserId.toString().trim() !== '') {
      body.forUserId = params.forUserId.toString().trim()
    }
    
    if (params.dateFrom && params.dateFrom.trim() !== '') {
      body.dateFrom = params.dateFrom.trim()
    }
    
    if (params.dateTo && params.dateTo.trim() !== '') {
      body.dateTo = params.dateTo.trim()
    }
    
    // Only add status if it's a valid number
    if (params.status !== undefined && params.status !== null && params.status !== '') {
      const statusValue = parseInt(params.status)
      if (!isNaN(statusValue)) {
        body.status = statusValue
      }
    }
    
    if (params.statusValue && params.statusValue.trim() !== '') {
      body.statusValue = params.statusValue.trim()
    }
    
    // Only add type if it's a valid number
    if (params.type !== undefined && params.type !== null && params.type !== '') {
      const typeValue = parseInt(params.type)
      if (!isNaN(typeValue)) {
        body.type = typeValue
      }
    }
    
    if (params.typeValue && params.typeValue.trim() !== '') {
      body.typeValue = params.typeValue.trim()
    }
    
    // Only add quantity if it's a valid number
    if (params.quantity !== undefined && params.quantity !== null && params.quantity !== '') {
      const quantityValue = parseInt(params.quantity)
      if (!isNaN(quantityValue) && quantityValue > 0) {
        body.quantity = quantityValue
      }
    }
    
    // Only add amount if it's a valid number
    if (params.amount !== undefined && params.amount !== null && params.amount !== '') {
      const amountValue = parseFloat(params.amount)
      if (!isNaN(amountValue) && amountValue > 0) {
        body.amount = amountValue
      }
    }
    
    
    
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        }
      } catch {}
    }
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Failed to load orders: ${response.status}`)
    }
    return await response.json()
  },

  getPending: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')

    const url = `${API_BASE_URL}/UserRequest/GetPending`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    
    // Build request body with only meaningful parameters
    const body = {
      pageNumber: Math.max(1, parseInt(params.pageNumber) || 1),
      pageSize: Math.max(1, Math.min(100, parseInt(params.pageSize) || 10))
    }
    
    // Only add optional parameters if they have meaningful values
    if (params.filterValue && params.filterValue.trim() !== '') {
      body.filterValue = params.filterValue.trim()
    }
    
    if (params.filterType && params.filterType.trim() !== '') {
      body.filterType = params.filterType.trim()
    }
    
    if (params.sortType && params.sortType.trim() !== '') {
      body.sortType = params.sortType.trim()
    }
    
    if (params.productName && params.productName.trim() !== '') {
      body.productName = params.productName.trim()
    }
    
    if (params.requestedByUserName && params.requestedByUserName.trim() !== '') {
      body.requestedByUserName = params.requestedByUserName.trim()
    }
    
    if (params.forUserId && params.forUserId.toString().trim() !== '') {
      body.forUserId = params.forUserId.toString().trim()
    }
    
    if (params.dateFrom && params.dateFrom.trim() !== '') {
      body.dateFrom = params.dateFrom.trim()
    }
    
    if (params.dateTo && params.dateTo.trim() !== '') {
      body.dateTo = params.dateTo.trim()
    }
    
    // Only add status if it's a valid number
    if (params.status !== undefined && params.status !== null && params.status !== '') {
      const statusValue = parseInt(params.status)
      if (!isNaN(statusValue)) {
        body.status = statusValue
      }
    }
    
    if (params.statusValue && params.statusValue.trim() !== '') {
      body.statusValue = params.statusValue.trim()
    }
    
    // Only add type if it's a valid number
    if (params.type !== undefined && params.type !== null && params.type !== '') {
      const typeValue = parseInt(params.type)
      if (!isNaN(typeValue)) {
        body.type = typeValue
      }
    }
    
    if (params.typeValue && params.typeValue.trim() !== '') {
      body.typeValue = params.typeValue.trim()
    }
    
    // Only add quantity if it's a valid number
    if (params.quantity !== undefined && params.quantity !== null && params.quantity !== '') {
      const quantityValue = parseInt(params.quantity)
      if (!isNaN(quantityValue) && quantityValue > 0) {
        body.quantity = quantityValue
      }
    }
    
    // Only add amount if it's a valid number
    if (params.amount !== undefined && params.amount !== null && params.amount !== '') {
      const amountValue = parseFloat(params.amount)
      if (!isNaN(amountValue) && amountValue > 0) {
        body.amount = amountValue
      }
    }
    
    
    
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        }
      } catch {}
    }
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Failed to load pending orders: ${response.status}`)
    }
    return await response.json()
  },

  getById: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/UserRequest/${id}`
    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'GET', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'GET', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Failed to load order: ${response.status}`)
    }
    return await response.json()
  },

  delete: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/UserRequest/${id}`
    const headers = { 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'DELETE', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'DELETE', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Failed to delete order: ${response.status}`)
    }
    return await response.json()
  },

  registerRecharge: async (data) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    // According to the API spec, the correct endpoint is registerRechargeReuest (with typo)
    const primaryUrl = `${API_BASE_URL}/UserRequest/registerRechargeReuest`
    const altUrls = [
      `${API_BASE_URL}/UserRequest/registerRechargeRequest`,
      `${API_BASE_URL}/UserRequest/RegisterRechargeRequest`,
      `${API_BASE_URL}/UserRequest/registerRecharge`,
      `${API_BASE_URL}/UserRequest/RegisterRecharge`
    ]
    
    
    
    const formData = new FormData()
    if (data.Id) formData.append('Id', data.Id.toString())
    if (data.Amount != null) formData.append('Amount', data.Amount.toString())
    if (data.TransferImagePath) formData.append('TransferImagePath', data.TransferImagePath)
    if (data.TransferImage) formData.append('TransferImage', data.TransferImage)
    
    console.log('📋 FormData entries:')
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value)
    }
    
    const headers = { 'lang': 'en', 'Authorization': `Bearer ${token}` }
    console.log('📋 Headers:', headers)
    
    const doAttempt = async (attemptUrl) => {
      let resp = await fetch(attemptUrl, { method: 'POST', headers, body: formData })
      if (resp.status === 401) {
        try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
            const retryHeaders = { ...headers, Authorization: `Bearer ${refreshedToken}` }
            resp = await fetch(attemptUrl, { method: 'POST', headers: retryHeaders, body: formData })
        }
      } catch {}
    }
      return resp
    }
    
    let response = await doAttempt(primaryUrl)
    if (!response.ok) {
      for (const u of altUrls) {
        try {
          response = await doAttempt(u)
          if (response.ok) {
            break
          }
        } catch {}
      }
    }
    
    if (!response.ok) {
      const text = await response.text()
      // Try to get more details about the error
      if (response.status === 405) {
       
      }
      
      throw new Error(text || `Failed to register recharge request: ${response.status}`)
    }
    
    const responseData = await response.json()
   
    
    // Since the API returns data: null, we need to construct a mock order object
    // This is a workaround until the backend is fixed to return the actual order data
    if (responseData.success && responseData.data === null) {
      
      // Get current user info to construct the order
      const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
      const currentUser = userDataStr ? JSON.parse(userDataStr) : null
      
      const mockOrder = {
        id: Date.now(), // Temporary ID
        Id: Date.now(),
        amount: data.Amount,
        Amount: data.Amount,
        transferImage: data.TransferImage,
        TransferImage: data.TransferImage,
        transferImagePath: data.TransferImagePath,
        TransferImagePath: data.TransferImagePath,
        status: 0, // Pending
        Status: 0,
        statusValue: 0,
        StatusValue: 0,
        type: 2, // Recharge request type
        Type: 2,
        typeValue: 2,
        TypeValue: 2,
        forUserId: currentUser?.id || currentUser?.Id,
        ForUserId: currentUser?.id || currentUser?.Id,
        createdAt: new Date().toISOString(),
        CreatedAt: new Date().toISOString()
      }
      
      console.log('📋 Created mock order object:', mockOrder)
      return mockOrder
    }
    
    // If responseData is an array, it might be the direct order data
    if (Array.isArray(responseData)) {
      console.log('📋 Response is array, returning as-is')
      return responseData
    }
    
    // If responseData has a data property that's an array, return that
    if (responseData.data && Array.isArray(responseData.data)) {
      console.log('📋 Response has data array, returning data')
      return responseData.data
    }
    
    // If responseData has a data property that's an object, return it wrapped in an array
    if (responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
      console.log('📋 Response has data object, wrapping in array')
      return [responseData.data]
    }
    
    // Otherwise return the response as-is
    console.log('📋 Returning response as-is')
    return responseData
  },

  editRecharge: async (id, data) => {
    // Edit existing recharge: PUT /api/UserRequest/EditRechargeReuest/{id}
   
    
    const token = localStorage.getItem('authToken')
    if (!token) {
     
      throw new Error('No authentication token found. Please sign in first.')
    }
    
    console.log('Token found:', token.substring(0, 20) + '...')
    
    const primaryUrl = `${API_BASE_URL}/UserRequest/EditRechargeReuest/${id}`
    const altUrls = [
      `${API_BASE_URL}/UserRequest/EditRechargeRequest/${id}`,
      `${API_BASE_URL}/UserRequest/editRechargeReuest/${id}`,
      `${API_BASE_URL}/UserRequest/editRechargeRequest/${id}`,
      `${API_BASE_URL}/UserRequest/EditRecharge/${id}`,
      `${API_BASE_URL}/UserRequest/editRecharge/${id}`
    ]
    
   
    
    const formData = new FormData()
    // Always append all fields, using empty value when not provided (matches Swagger UI)
    formData.append('Id', id != null ? String(id) : '')
    formData.append('Amount', data && data.Amount != null ? String(data.Amount) : '')
    formData.append('TransferImagePath', data && typeof data.TransferImagePath === 'string' ? data.TransferImagePath : '')
    // For file field, if no file provided, append empty string (Swagger sends empty)
    if (data && data.TransferImage) {
      formData.append('TransferImage', data.TransferImage)
    } else {
      formData.append('TransferImage', '')
    }
    
    
    
    const headers = { 'lang': 'en', 'Authorization': `Bearer ${token}` }

    const doAttempt = async (attemptUrl, method = 'PUT') => {
     
      let resp = await fetch(attemptUrl, { method, headers, body: formData })
      
      if (resp.status === 401) {
      
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
            const retryHeaders = { ...headers, Authorization: `Bearer ${refreshedToken}` }
            resp = await fetch(attemptUrl, { method, headers: retryHeaders, body: formData })
        }
      } catch (refreshError) {
       
      }
      }
      return resp
    }
    
    // Try PUT first (primary method according to API spec)
    let response = await doAttempt(primaryUrl, 'PUT')
    
    // If PUT fails, try POST as fallback
    if (!response.ok) {
     
      response = await doAttempt(primaryUrl, 'POST')
    }
    
    // If still fails, try alternative URLs with both methods
    if (!response.ok) {
     
      for (const altUrl of altUrls) {
        try {
          // Try PUT first
          response = await doAttempt(altUrl, 'PUT')
          if (response.ok) {
           
            break
          }
          
          // Try POST as fallback
          response = await doAttempt(altUrl, 'POST')
          if (response.ok) {
           
            break
          }
        } catch (err) {
          console.warn('Alternative URL failed:', altUrl, err)
        }
      }
    }
    
    if (!response.ok) {
      const text = await response.text()
     
      
      // Provide more specific error messages
      if (response.status === 405) {
        throw new Error('Method not allowed. The server may not support PUT/POST for this endpoint.')
      } else if (response.status === 404) {
        throw new Error('Recharge request not found. It may have been deleted or moved.')
      } else if (response.status === 403) {
        throw new Error('Access denied. You may not have permission to edit this recharge request.')
      } else if (response.status === 400) {
        throw new Error('Invalid request data. Please check your input.')
      } else if (response.status === 500) {
        throw new Error('Server error during edit. Please try again later.')
      }
      
      throw new Error(text || `Failed to edit recharge request: ${response.status}`)
    }
    
    const responseData = await response.json()
   
    return responseData
  },

  registerProductRequest: async (data) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    const primaryUrl = `${API_BASE_URL}/UserRequest/registerProductRequest`
    const altUrls = [
      `${API_BASE_URL}/UserRequest/RegisterProductRequest`,
      `${API_BASE_URL}/UserRequest/registerProduct`,
      `${API_BASE_URL}/UserRequest/RegisterProduct`
    ]

    // Normalize to API expected casing (PascalCase)
    const apiPayload = {}
    if (data.productId != null || data.ProductId != null) {
      apiPayload.ProductId = Number(data.productId ?? data.ProductId)
    }
    if (data.quantity != null || data.Quantity != null) {
      apiPayload.Quantity = Number(data.quantity ?? data.Quantity)
    }
    if (data.forUserId != null || data.ForUserId != null) {
      apiPayload.ForUserId = String(data.forUserId ?? data.ForUserId)
    }
    if (data.notes != null || data.Notes != null) {
      apiPayload.Notes = String(data.notes ?? data.Notes)
    }



    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }

    const doAttempt = async (attemptUrl) => {
      let resp = await fetch(attemptUrl, { method: 'POST', headers, body: JSON.stringify(apiPayload) })
      if (resp.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            const retryHeaders = { ...headers, Authorization: `Bearer ${refreshedToken}` }
            resp = await fetch(attemptUrl, { method: 'POST', headers: retryHeaders, body: JSON.stringify(apiPayload) })
          }
        } catch {}
      }
      return resp
    }

    let response = await doAttempt(primaryUrl)
    if (!response.ok) {
      for (const u of altUrls) {
        try {
          response = await doAttempt(u)
          if (response.ok) break
        } catch {}
      }
    }
    if (!response.ok) {
      const text = await response.text()
     
      throw new Error(text || `Failed to register product request: ${response.status}`)
    }

    try { return await response.json() } catch { return {} }
  },

  editProductRequest: async (id, data) => {
   
    
    const token = localStorage.getItem('authToken')
    if (!token) {
     
      throw new Error('No authentication token found. Please sign in first.')
    }
    
    console.log('Token found:', token.substring(0, 20) + '...')
    
    // Try multiple endpoints since EditProductRequest might not exist
    const primaryUrl = `${API_BASE_URL}/UserRequest/EditProductRequest/${id}`
    const altUrls = [
      `${API_BASE_URL}/UserRequest/editProductRequest/${id}`,
      `${API_BASE_URL}/UserRequest/EditProduct/${id}`,
      `${API_BASE_URL}/UserRequest/editProduct/${id}`,
      `${API_BASE_URL}/UserRequest/${id}` // Generic update endpoint
    ]
    
        
        const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
        
    const doAttempt = async (attemptUrl, method = 'PUT') => {
      let resp = await fetch(attemptUrl, { method, headers, body: JSON.stringify(data) })
      
      if (resp.status === 401) {
          try {
            await authAPI.getToken()
            const refreshedToken = localStorage.getItem('authToken')
            if (refreshedToken) {
            const retryHeaders = { ...headers, Authorization: `Bearer ${refreshedToken}` }
            resp = await fetch(attemptUrl, { method, headers: retryHeaders, body: JSON.stringify(data) })
           
          }
        } catch {}
      }
      return resp
    }
    
    // Try PUT first (primary method according to API spec)
    let response = await doAttempt(primaryUrl, 'PUT')
    
    // If PUT fails, try POST as fallback
    if (!response.ok) {
     
      response = await doAttempt(primaryUrl, 'POST')
    }
    
    // If still fails, try alternative URLs with both methods
    if (!response.ok) {
     
      for (const altUrl of altUrls) {
        try {
          // Try PUT first
          response = await doAttempt(altUrl, 'PUT')
        if (response.ok) {
           
            break
          }
          
          // Try POST as fallback
          response = await doAttempt(altUrl, 'POST')
          if (response.ok) {
           
            break
          }
        } catch (err) {
          console.warn('Alternative URL failed:', altUrl, err)
        }
      }
    }
    
    if (!response.ok) {
      const text = await response.text()
     
      
      // Provide more specific error messages
      if (response.status === 405) {
        throw new Error('Method not allowed. The server may not support PUT/POST for this endpoint.')
      } else if (response.status === 404) {
        throw new Error('Product request not found. It may have been deleted or moved.')
      } else if (response.status === 403) {
        throw new Error('Access denied. You may not have permission to edit this product request.')
      } else if (response.status === 400) {
        throw new Error('Invalid request data. Please check your input.')
      } else if (response.status === 500) {
        throw new Error('Server error during edit. Please try again later.')
      }
      
      throw new Error(text || `Failed to edit product request: ${response.status}`)
    }
    
    const responseData = await response.json()
   
    return responseData
  },

  approve: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    // According to the API spec, the correct endpoint is ApproveRequest/{id}
    const url = `${API_BASE_URL}/UserRequest/ApproveRequest/${id}`
    
    
    
    const headers = { 'lang': 'en', 'Authorization': `Bearer ${token}` }
    
    const doAttempt = async (method = 'PUT') => {
     
      let resp = await fetch(url, { method, headers })
     
      
      if (resp.status === 401) {
        try {
         
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
            const retryHeaders = { ...headers, Authorization: `Bearer ${refreshedToken}` }
            resp = await fetch(url, { method, headers: retryHeaders })
           
        }
      } catch {}
    }
      return resp
    }
    
    // Try PUT first (primary method according to API spec)
    let response = await doAttempt('PUT')
    
    // If PUT fails, try POST as fallback (some APIs support both)
    if (!response.ok) {
     
      response = await doAttempt('POST')
    }
    
    if (!response.ok) {
      const text = await response.text()
      
      
      // Friendly message for EF async provider issue
      if (text && text.includes('IDbAsyncQueryProvider')) {
        throw new Error('Backend error during approval (async DB provider). Please contact support to fix the server. Details: ' + text)
      }
      
      // Provide more specific error messages
      if (response.status === 404) {
        throw new Error('Order not found. It may have been deleted or moved.')
      } else if (response.status === 403) {
        throw new Error('Access denied. You may not have permission to approve this order.')
      } else if (response.status === 400) {
        throw new Error('Invalid request. The order may be in an invalid state for approval.')
      } else if (response.status === 500) {
        throw new Error('Server error during approval. Please try again later.')
      }
      
      throw new Error(text || `Failed to approve request: ${response.status}`)
    }
    
    const responseData = await response.json()
   
    
    // Check if the API returned success: false even with 200 status
    if (responseData && responseData.success === false) {
     
      
      // Handle specific business logic errors
      if (responseData.message && responseData.message.includes('balance')) {
        throw new Error('Insufficient balance. The user does not have enough balance to complete this request.')
      } else if (responseData.message && responseData.message.includes('permission')) {
        throw new Error('Permission denied. You may not have the required permissions to approve this request.')
      } else if (responseData.message && responseData.message.includes('state')) {
        throw new Error('Invalid state. The request may not be in a valid state for approval.')
      } else if (responseData.message) {
        throw new Error(responseData.message)
      } else {
        throw new Error('Approval failed due to business logic error. Please check the request details.')
      }
    }
    
    
    return responseData
  },

  reject: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    // According to the API spec, the correct endpoint is RejectRequest/{id}
    const url = `${API_BASE_URL}/UserRequest/RejectRequest/${id}`
    
    
    
    const headers = { 'lang': 'en', 'Authorization': `Bearer ${token}` }
    
    const doAttempt = async (method = 'PUT') => {
     
      let resp = await fetch(url, { method, headers })
     
      
      if (resp.status === 401) {
        try {
         
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
            const retryHeaders = { ...headers, Authorization: `Bearer ${refreshedToken}` }
            resp = await fetch(url, { method, headers: retryHeaders })
           
        }
      } catch {}
    }
      return resp
    }
    
    // Try PUT first (primary method according to API spec)
    let response = await doAttempt('PUT')
    
    // If PUT fails, try POST as fallback (some APIs support both)
    if (!response.ok) {
     
      response = await doAttempt('POST')
    }
    
    if (!response.ok) {
      const text = await response.text()
     
      
      // Provide more specific error messages
      if (response.status === 404) {
        throw new Error('Order not found. It may have been deleted or moved.')
      } else if (response.status === 403) {
        throw new Error('Access denied. You may not have permission to reject this order.')
      } else if (response.status === 400) {
        throw new Error('Invalid request. The order may be in an invalid state for rejection.')
      } else if (response.status === 500) {
        throw new Error('Server error during rejection. Please try again later.')
      }
      
      throw new Error(text || `Failed to reject request: ${response.status}`)
    }
    
    const responseData = await response.json()
   
    
    // Check if the API returned success: false even with 200 status
    if (responseData && responseData.success === false) {
     
      
      // Handle specific business logic errors
      if (responseData.message && responseData.message.includes('permission')) {
        throw new Error('Permission denied. You may not have the required permissions to reject this request.')
      } else if (responseData.message && responseData.message.includes('state')) {
        throw new Error('Invalid state. The request may not be in a valid state for rejection.')
      } else if (responseData.message) {
        throw new Error(responseData.message)
      } else {
        throw new Error('Rejection failed due to business logic error. Please check the request details.')
      }
    }
    
   
    return responseData
  },

  getMyRequests: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')

    const url = `${API_BASE_URL}/UserRequest/GetMyRequests`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }

    // Create absolutely minimal request body - only essential parameters
    const body = {
      pageNumber: 1,
      pageSize: 10
    }
    
    // Only add type parameter if explicitly provided and valid
    if (params.type !== undefined && params.type !== null && params.type !== '') {
      const typeValue = parseInt(params.type)
      if (!isNaN(typeValue) && typeValue > 0) {
        body.type = typeValue
      }
    }

    
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    
    
    if (response.status === 401) {
      try {
        
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
          
        }
      } catch {}
    }
    if (!response.ok) {
      const text = await response.text()
     
      throw new Error(text || `Failed to load my requests: ${response.status}`)
    }
    
    const responseData = await response.json()
   
    return responseData
  },

  // Get all requests (both product and recharge) using the generic endpoint
  getAllMyRequests: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')

    const url = `${API_BASE_URL}/UserRequest/GetMyRequests`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }

    // Create absolutely minimal request body - only essential parameters
    const body = {
      pageNumber: 1,
      pageSize: 10
    }
    
    // Only add type parameter if explicitly provided and valid
    if (params.type !== undefined && params.type !== null && params.type !== '') {
      const typeValue = parseInt(params.type)
      if (!isNaN(typeValue) && typeValue > 0) {
        body.type = typeValue
      }
    }

    // Add user-specific filters to get only current user's requests
    const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
    const currentUser = userDataStr ? JSON.parse(userDataStr) : null
    
    
    
    // Handle different user types
    if (currentUser?.id) {
      if (currentUser?.userType === 2 || currentUser?.userTypeName?.toLowerCase().includes('employee')) {
        // For employees, try both forUserId and requestedByUserId
        body.forUserId = currentUser.id.toString()
        body.requestedByUserId = currentUser.id.toString()
        
      } else {
        // For regular users, use forUserId
        body.forUserId = currentUser.id.toString()
        
      }
    }
    
    // Try to get all requests without type filter first

    
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })

    
    if (response.status === 401) {
      try {
        
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
          
        }
      } catch {}
    }
    
    if (!response.ok) {
      const text = await response.text()
     
      
      // For employees, try alternative approach
      if (currentUser?.userType === 2 || currentUser?.userTypeName?.toLowerCase().includes('employee')) {
        
        try {
          const altBody = { ...body }
          delete altBody.forUserId
          delete altBody.requestedByUserId
          
          const altResponse = await fetch(url, { method: 'POST', headers, body: JSON.stringify(altBody) })
          if (altResponse.ok) {
            const altData = await altResponse.json()
            
            return altData
          }
        } catch (altError) {
          console.error('❌ Alternative approach also failed:', altError)
        }
      }
      
      throw new Error(text || `Failed to load all my requests: ${response.status}`)
    }
    
    const responseData = await response.json()
   
    return responseData
  },

  // Try multiple approaches to get recharge requests
  getRechargeRequestsMultiApproach: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')

    
    // Approach 1: Try the generic endpoint with type 2 (recharge)
    try {
     
      const url1 = `${API_BASE_URL}/UserRequest/GetMyRequests`
      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }
      
      const body1 = {
        pageNumber: Math.max(1, parseInt(params.pageNumber) || 1),
        pageSize: Math.max(1, Math.min(100, parseInt(params.pageSize) || 10)),
        type: 2 // Recharge type
      }
      
    
      
      let response1 = await fetch(url1, { method: 'POST', headers, body: JSON.stringify(body1) })
      if (response1.ok) {
        const data1 = await response1.json()
        
        if (data1?.data && data1.data.length > 0) {
          return data1
        }
      }
    } catch (e) {
      console.log('❌ Approach 1 failed:', e.message)
    }
    
    // Approach 2: Try without type filter
    try {
     
      const url2 = `${API_BASE_URL}/UserRequest/GetMyRequests`
      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }
      
      const body2 = {
        pageNumber: Math.max(1, parseInt(params.pageNumber) || 1),
        pageSize: Math.max(1, Math.min(100, parseInt(params.pageSize) || 10))
        // No type filter
      }
      
    
      
      let response2 = await fetch(url2, { method: 'POST', headers, body: JSON.stringify(body2) })
      if (response2.ok) {
        const data2 = await response2.json()
        
        if (data2?.data && data2.data.length > 0) {
          // Filter for recharge requests in the response
          const rechargeOnly = {
            ...data2,
            data: data2.data.filter(item => 
              item.type === 2 || 
              item.typeValue === 2 || 
              item.Type === 2 || 
              item.TypeValue === 2 ||
              String(item.type || item.typeValue || item.Type || item.TypeValue || '').toLowerCase().includes('recharge') ||
              item.amount != null || item.Amount != null
            )
          }
          console.log('🔍 Filtered recharge requests:', rechargeOnly)
          return rechargeOnly
        }
      }
    } catch (e) {
      console.log('❌ Approach 2 failed:', e.message)
    }
    
    // Approach 3: Try the original GetMyRequests endpoint
    try {
      
      const url3 = `${API_BASE_URL}/UserRequest/GetMyRequests`
      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }
      
      const body3 = {
        pageNumber: Math.max(1, parseInt(params.pageNumber) || 1),
        pageSize: Math.max(1, Math.min(100, parseInt(params.pageSize) || 10))
      }
      
    
      
      let response3 = await fetch(url3, { method: 'POST', headers, body: JSON.stringify(body3) })
      if (response3.ok) {
        const data3 = await response3.json()
        
        return data3
      }
    } catch (e) {
      console.log('❌ Approach 3 failed:', e.message)
    }
    
    
    return { data: [], success: false, message: 'All approaches failed' }
  },

  // Get recharge requests specifically for users with zero balance
  getRechargeRequestsForZeroBalance: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')

    const url = `${API_BASE_URL}/UserRequest/GetMyRequests`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }

    // Build request body specifically for recharge requests
    const body = {
      pageNumber: Math.max(1, parseInt(params.pageNumber) || 1),
      pageSize: Math.max(1, Math.min(100, parseInt(params.pageSize) || 10)),
      type: 2 // Specifically request recharge requests
    }

    // Add user-specific filters
    const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('userData') : null
    const currentUser = userDataStr ? JSON.parse(userDataStr) : null
    if (currentUser?.id) {
      body.forUserId = currentUser.id.toString()
    }

   
    
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
   
    
    if (response.status === 401) {
      try {
        
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
          
        }
      } catch {}
    }
    
    if (!response.ok) {
      const text = await response.text()
     
      throw new Error(text || `Failed to load recharge requests: ${response.status}`)
    }
    
    const responseData = await response.json()
   
    return responseData
  }
}

// Employees API functions
export const employeesAPI = {
  getAll: async (params = {}) => {
    try {
      const url = `${API_BASE_URL}/Employee`
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }

      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }

      const requestBody = {
        pageNumber: Math.max(1, params.pageNumber || 1),
        pageSize: Math.max(1, Math.min(100, params.pageSize || 10))
      }
      if (params.filterValue && params.filterValue.trim()) requestBody.filterValue = params.filterValue.trim()
      if (params.filterType && params.filterType.trim()) requestBody.filterType = params.filterType.trim()
      if (params.sortType && params.sortType.trim()) requestBody.sortType = params.sortType.trim()
      if (params.dateFrom && params.dateFrom.trim()) requestBody.dateFrom = params.dateFrom.trim()
      if (params.dateTo && params.dateTo.trim()) requestBody.dateTo = params.dateTo.trim()
      if (params.balance !== undefined && params.balance !== null) requestBody.balance = params.balance
      if (params.roleName && params.roleName.trim()) requestBody.roleName = params.roleName.trim()
      if (params.roleId !== undefined && params.roleId !== null && params.roleId !== '') requestBody.roleId = Number(params.roleId)
      if (params.name && params.name.trim()) requestBody.name = params.name.trim()
      if (params.userName && params.userName.trim()) requestBody.userName = params.userName.trim()
      if (params.phoneNumber && params.phoneNumber.trim()) requestBody.phoneNumber = params.phoneNumber.trim()

      let response = await fetch(url, {
      method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody)
            })
          }
        } catch {}
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Failed to load employees: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Employees getAll error:', error)
      throw error
    }
  },

  getById: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token found. Please sign in first.')
    }

    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }

    let response = await fetch(`${API_BASE_URL}/Employee/${id}`, {
      method: 'GET',
      headers
    })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(`${API_BASE_URL}/Employee/${id}`, {
            method: 'GET',
            headers
          })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load employee: ${response.status}`)
    }
    return await response.json()
  },

  register: async (employeeData) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token found. Please sign in first.')
    }



    const formData = new FormData()
    Object.keys(employeeData).forEach(key => {
      const value = employeeData[key]
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value)
        
      }
    })

    const headers = {
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }



    let response = await fetch(`${API_BASE_URL}/Employee/register`, {
      method: 'POST',
      headers,
      body: formData
    })
    

    
    if (response.status === 401) {
      try {
        console.log('🔄 Token expired, attempting refresh...')
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(`${API_BASE_URL}/Employee/register`, {
            method: 'POST',
            headers,
            body: formData
          })
          console.log('🔄 Retry response status:', response.status)
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
     
      throw new Error(errorText || `Failed to register employee: ${response.status}`)
    }
    
    const responseData = await response.json()
    
    return responseData
  },

  update: async (id, employeeData) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token found. Please sign in first.')
    }
    
   
    const formData = new FormData()
    formData.append('Id', id.toString())
    Object.keys(employeeData).forEach(key => {
      const value = employeeData[key]
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value)
      }
    })
    
   

    const headers = {
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }

    let response = await fetch(`${API_BASE_URL}/Employee/Edit/${id}`, {
      method: 'PUT',
      headers,
      body: formData
    })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(`${API_BASE_URL}/Employee/Edit/${id}`, {
            method: 'PUT',
            headers,
            body: formData
          })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to update employee: ${response.status}`)
    }
    return await response.json()
  },

  delete: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token found. Please sign in first.')
    }

    const headers = {
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }

    let response = await fetch(`${API_BASE_URL}/Employee/${id}`, {
      method: 'DELETE',
      headers
    })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(`${API_BASE_URL}/Employee/${id}`, {
            method: 'DELETE',
            headers
          })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to delete employee: ${response.status}`)
    }
    return await response.json()
  }
}

// Roles API functions
export const rolesAPI = {
  getAll: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')

    const url = `${API_BASE_URL}/Roles`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }

    const body = {
      pageNumber: Math.max(1, params.pageNumber || 1),
      pageSize: Math.max(1, Math.min(100, params.pageSize || 10))
    }
    if (params.filterValue && params.filterValue.trim()) body.filterValue = params.filterValue.trim()
    if (params.filterType && params.filterType.trim()) body.filterType = params.filterType.trim()
    if (params.sortType && params.sortType.trim()) body.sortType = params.sortType.trim()

    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load roles: ${response.status}`)
    }
    return await response.json()
  },

  getAllList: async () => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Roles/getallList`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    let response = await fetch(url, { method: 'GET', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'GET', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load roles list: ${response.status}`)
    }
    return await response.json()
  },

  getById: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Roles/${id}`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    let response = await fetch(url, { method: 'GET', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'GET', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load role: ${response.status}`)
    }
    return await response.json()
  },

  register: async (data) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Roles/register`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to register role: ${response.status}`)
    }
    return await response.json()
  },

  update: async (id, data) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Roles/Edit/${id}`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    let response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(data) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(data) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to update role: ${response.status}`)
    }
    return await response.json()
  },

  updatePermissions: async ({ roleId, permissions }) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Roles/UpdatePermissions`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    // Note: backend expects property name 'permisions'
    const payload = { roleId, permisions: permissions || [] }
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to update permissions: ${response.status}`)
    }
    return await response.json()
  },

  delete: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Roles/${id}`
    const headers = {
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    let response = await fetch(url, { method: 'DELETE', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'DELETE', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to delete role: ${response.status}`)
    }
    return await response.json()
  },

  deleteRange: async (ids) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Roles/deleterange`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(ids || []) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`

          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(ids || []) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to delete roles range: ${response.status}`)
    }
    return await response.json()
  }
}

// Users API functions
export const usersAPI = {
  getAll: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')

    const url = `${API_BASE_URL}/Users`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }

    const body = {
      pageNumber: Math.max(1, params.pageNumber || 1),
      pageSize: Math.max(1, Math.min(100, params.pageSize || 10)),
      filterValue: params.filterValue || '',
      filterType: params.filterType || '',
      sortType: params.sortType || '',
      isLocked: params.isLocked ?? undefined,
      name: params.name || '',
      mobile: params.mobile || '',
      isActive: params.isActive ?? undefined,
      userType: params.userType ?? undefined,
      roleId: params.roleId ?? undefined
    }
    // Remove undefined keys
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k])

    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load users: ${response.status}`)
    }
    return await response.json()
  },

  getDropdown: async () => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Users/GetDropDown`
    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'GET', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'GET', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load users dropdown: ${response.status}`)
    }
    return await response.json()
  },

  getDropdownExceptEmployee: async () => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Users/GetDropDownExceptEmployee`
    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'GET', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'GET', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load users dropdown (except employee): ${response.status}`)
    }
    return await response.json()
  },

  getById: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Users/${id}`
    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'GET', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'GET', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load user: ${response.status}`)
    }
    const raw = await response.json()
    // Normalize common API shapes: { data: {...} } or direct object
    const user = raw?.data ?? raw?.item ?? raw
    return user
  },

  delete: async (id) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Users/${id}`
    const headers = { 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'DELETE', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'DELETE', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to delete user: ${response.status}`)
    }
    return await response.json()
  },

  changePassword: async (id, { password, rePassword }) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Users/changepassword/${id}`
    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
    const payload = { password, rePassword }
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to change password: ${response.status}`)
    }
    return await response.json()
  },

  update: async (id, data) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    // Build query string for scalar fields
    const query = new URLSearchParams()
    if (data.Name) query.set('Name', data.Name)
    if (data.UserName) query.set('UserName', data.UserName)
    if (data.UserType != null && data.UserType > 0) query.set('UserType', String(data.UserType))
    if (data.Mobile) query.set('Mobile', data.Mobile)
    if (data.IsActive != null) query.set('IsActive', String(data.IsActive))
    if (data.RoleId != null && data.RoleId > 0) query.set('RoleId', String(data.RoleId))
    if (data.Balance != null) query.set('Balance', String(data.Balance))
    
    console.log('Query string:', query.toString())

    const url = `${API_BASE_URL}/Users/Edit/${id}?${query.toString()}`
    const formData = new FormData()
    if (data.Profile) formData.append('Profile', data.Profile)

    const headers = { 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'POST', headers, body: formData })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: formData })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to update user: ${response.status}`)
    }
    return await response.json()
  },

  deleteRange: async (ids) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Users/deleterange`
    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(ids || []) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(ids || []) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to delete users range: ${response.status}`)
    }
    return await response.json()
  },

  getUserTypes: async () => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Users/UserTypeDropDown`
    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
    let response = await fetch(url, { method: 'GET', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'GET', headers })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load user types: ${response.status}`)
    }
    return await response.json()
  },

  getByType: async (userType) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    const url = `${API_BASE_URL}/Users/getByType`
    const headers = { 'Content-Type': 'application/json', 'lang': 'en', 'Authorization': `Bearer ${token}` }
    // API expects a raw number in the body
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(userType) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(userType) })
        }
      } catch {}
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load users by type: ${response.status}`)
    }
    return await response.json()
  }
}

export const pointConversionAPI = {
  getAll: async () => {
    try {
      
      const url = `${API_BASE_URL}/PointConversionSetting`

      // Get token from localStorage
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }

      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }

      console.log('Request headers:', headers)

      let response = await fetch(url, {
        method: 'GET',
        headers
      })

      // Retry once on 401 by refreshing token
      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(url, {
              method: 'GET',
              headers
            })
          }
        } catch {}
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          console.log('Error response body:', errorData)
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      // Normalize to either array or object as returned by server
      return result
    } catch (error) {
      throw error
    }
  },

  getById: async (id) => {
    try {
      
      const url = `${API_BASE_URL}/PointConversionSetting/${id}`

      // Get token from localStorage
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }

      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }

      console.log('Request headers:', headers)

      let response = await fetch(url, {
        method: 'GET',
        headers
      })

      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(url, {
              method: 'GET',
              headers
            })
          }
        } catch {}
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          console.log('Error response body:', errorData)
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      throw error
    }
  },

  update: async (id, data) => {
    try {
      
      const url = `${API_BASE_URL}/PointConversionSetting/Edit/${id}`

      // Get token from localStorage
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found. Please sign in first.')
      }

      const headers = {
        'Content-Type': 'application/json',
        'lang': 'en',
        'Authorization': `Bearer ${token}`
      }

      console.log('Request headers:', headers)

      let response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      })

      if (response.status === 401) {
        try {
          await authAPI.getToken()
          const refreshedToken = localStorage.getItem('authToken')
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken}`
            response = await fetch(url, {
              method: 'PUT',
              headers,
              body: JSON.stringify(data)
            })
          }
        } catch {}
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          console.log('Error response body:', errorData)
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData)
              errorMessage = parsedError.message || parsedError.error || errorMessage
            } catch {
              errorMessage = errorData || errorMessage
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      throw error
    }
  }
}

// Notification API functions
export const notificationAPI = {
  getAll: async (params = {}) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    const url = `${API_BASE_URL}/Notification`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    
    const body = {
      pageNumber: Math.max(1, params.pageNumber || 1),
      pageSize: Math.max(1, Math.min(100, params.pageSize || 10)),
      filterValue: params.filterValue || '',
      filterType: params.filterType || '',
      sortType: params.sortType || ''
    }
    
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        }
      } catch {}
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load notifications: ${response.status}`)
    }
    
    const result = await response.json()
    return result
  },

  getUserNotifications: async () => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    const url = `${API_BASE_URL}/Notification/GetUserNotifications`
    const headers = {
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    
    console.log('📧 GET request to:', url)
    console.log('📧 Headers:', headers)
    
    let response = await fetch(url, { method: 'GET', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'GET', headers })
        }
      } catch {}
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to load user notifications: ${response.status}`)
    }
    
    const result = await response.json()
    return result
  },

  markAsRead: async (notificationId) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    const url = `${API_BASE_URL}/Notification/MarkAsRead/${notificationId}`
    const headers = {
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    
    let response = await fetch(url, { method: 'PUT', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'PUT', headers })
        }
      } catch {}
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to mark notification as read: ${response.status}`)
    }
    
    // Check if response has content before trying to parse JSON
    const responseText = await response.text()
    
    if (!responseText || responseText.trim() === '') {
      return { success: true, message: 'Notification marked as read successfully' }
    }
    
    try {
      const result = JSON.parse(responseText)
      return result
    } catch (parseError) {
      return { success: true, message: 'Notification marked as read successfully' }
    }
  },

  markAllAsRead: async () => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    console.log('📧 Marking all notifications as read')
    
    const url = `${API_BASE_URL}/Notification/MarkAsReadAll`
    const headers = {
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    
    let response = await fetch(url, { method: 'PUT', headers })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'PUT', headers })
        }
      } catch {}
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to mark all notifications as read: ${response.status}`)
    }
    
    // Check if response has content before trying to parse JSON
    const responseText = await response.text()
    
    if (!responseText || responseText.trim() === '') {
      return { success: true, message: 'All notifications marked as read successfully' }
    }
    
    try {
      const result = JSON.parse(responseText)
      return result
    } catch (parseError) {
      return { success: true, message: 'All notifications marked as read successfully' }
    }
  },

  createNotification: async (notificationData) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    // Based on the Swagger response, the notification system works differently
    // The API returns { "approvals": [], "tasks": [] } structure
    // This suggests notifications are managed through the approval/task system
    
    const url = `${API_BASE_URL}/Notification`
    const headers = {
      'Content-Type': 'application/json',
      'lang': 'en',
      'Authorization': `Bearer ${token}`
    }
    
    // Based on the Swagger POST endpoint, we need to send pagination parameters
    const body = {
      pageNumber: 1,
      pageSize: 10,
      filterValue: notificationData.title || '',
      filterType: 'title',
      sortType: 'desc'
    }
    
    let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (response.status === 401) {
      try {
        await authAPI.getToken()
        const refreshedToken = localStorage.getItem('authToken')
        if (refreshedToken) {
          headers['Authorization'] = `Bearer ${refreshedToken}`
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        }
      } catch {}
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to create notification: ${response.status}`)
    }
    
    const result = await response.json()
    
    // The API returns { "approvals": [], "tasks": [] } structure
    // We need to check if our notification was added to either array
    if (result.success && result.data) {
    }
    
    return result
  },

  // Investigate notification API structure
  investigateNotificationAPI: async () => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    // Try different possible notification endpoints
    const endpointsToTry = [
      '/Notification',
      '/Notification/Create',
      '/Notification/Add',
      '/Notification/Post',
      '/Notification/Send',
      '/Notification/Register',
      '/Notification/Submit',
      '/Notification/Insert',
      '/Notification/New',
      '/Notification/AddNotification',
      '/Notification/CreateNotification',
      '/Notification/SendNotification',
      // Try some alternative patterns
      '/Notifications',
      '/Notifications/Create',
      '/Notifications/Add',
      '/Notifications/Send',
      // Try order-related notification endpoints
      '/Orders/Notification',
      '/Orders/Notify',
      '/Orders/SendNotification',
      // Try user-related notification endpoints
      '/Users/Notification',
      '/Users/Notify',
      '/Users/SendNotification',
      // Try approval-related endpoints
      '/Approval/Notification',
      '/Approval/Notify',
      '/Approval/SendNotification',
      // Try task-related endpoints
      '/Task/Notification',
      '/Task/Notify',
      '/Task/SendNotification'
    ]
    
    const results = {}
    
    for (const endpoint of endpointsToTry) {
      try {
        // Try POST method first
        const postUrl = `${API_BASE_URL}${endpoint}`
        const headers = {
          'Content-Type': 'application/json',
          'lang': 'en',
          'Authorization': `Bearer ${token}`
        }
        
        const testPayload = {
          userId: 1,
          title: 'Test',
          message: 'Test notification',
          type: 'test'
        }
        
        const response = await fetch(postUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(testPayload)
        })
        
        results[endpoint] = {
          method: 'POST',
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: postUrl
        }
        
        if (response.ok) {
          try {
            const responseData = await response.json()
            results[endpoint].data = responseData
          } catch (e) {
            results[endpoint].data = 'Could not parse response'
          }
        } else {
          console.log(`❌ POST ${endpoint} failed: ${response.status} ${response.statusText}`)
        }
        
      } catch (error) {
        results[endpoint] = {
          method: 'POST',
          error: error.message,
          url: `${API_BASE_URL}${endpoint}`
        }
        console.log(`❌ POST ${endpoint} error:`, error.message)
      }
    }
    
    return results
  },

  // Check if notifications are created automatically
  checkNotificationCreation: async (orderId, action) => {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('No authentication token found. Please sign in first.')
    
    // First, get current notifications
    try {
      const beforeNotifications = await notificationAPI.getUserNotifications()
      
      // Wait a bit for any async operations
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Get notifications again
      const afterNotifications = await notificationAPI.getUserNotifications()
      
      // Compare the two
      const beforeApprovals = beforeNotifications?.data?.approvals || []
      const afterApprovals = afterNotifications?.data?.approvals || []
      const beforeTasks = beforeNotifications?.data?.tasks || []
      const afterTasks = afterNotifications?.data?.tasks || []
      
      // Check if any new notifications were created
      const newApprovals = afterApprovals.filter(after => 
        !beforeApprovals.find(before => 
          before.id === after.id || 
          before.Id === after.Id ||
          before.relatedEntityId === after.relatedEntityId
        )
      )
      
      const newTasks = afterTasks.filter(after => 
        !beforeTasks.find(before => 
          before.id === after.id || 
          before.Id === after.Id ||
          before.relatedEntityId === after.relatedEntityId
        )
      )
      
      return {
        success: true,
        before: beforeNotifications,
        after: afterNotifications,
        newApprovals,
        newTasks,
        hasNewNotifications: newApprovals.length > 0 || newTasks.length > 0
      }
      
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
} 