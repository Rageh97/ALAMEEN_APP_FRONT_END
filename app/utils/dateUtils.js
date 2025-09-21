// Date utility functions for Arabic formatting

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '—'
  
  try {
    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—'
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
    
    const mergedOptions = { ...defaultOptions, ...options }
    
    // Format for English locale (Milady/Gregorian calendar)
    return date.toLocaleDateString('en-US', mergedOptions)
  } catch (error) {
    console.error('Error formatting date:', error)
    return '—'
  }
}

export const formatDateOnly = (dateString) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatTimeOnly = (dateString) => {
  return formatDate(dateString, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export const formatDateTime = (dateString) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export const getRelativeTime = (dateString) => {
  if (!dateString) return '—'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInMinutes < 1) {
      return 'الآن'
    } else if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`
    } else if (diffInDays < 7) {
      return `منذ ${diffInDays} يوم`
    } else {
      return formatDateOnly(dateString)
    }
  } catch (error) {
    console.error('Error calculating relative time:', error)
    return '—'
  }
}

export const isToday = (dateString) => {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    const today = new Date()
    
    return date.toDateString() === today.toDateString()
  } catch (error) {
    return false
  }
}

export const isYesterday = (dateString) => {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    return date.toDateString() === yesterday.toDateString()
  } catch (error) {
    return false
  }
}


