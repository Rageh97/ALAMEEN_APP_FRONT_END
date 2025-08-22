# React Query (TanStack Query) Implementation

This application has been refactored to use React Query (TanStack Query) for efficient state management, caching, and API integration.

## 🚀 **What's New with React Query**

### **Benefits:**
- **Automatic Caching**: Data is cached and automatically synchronized
- **Background Updates**: Data stays fresh with automatic refetching
- **Optimistic Updates**: UI updates immediately while API calls happen in background
- **Error Handling**: Built-in error states and retry mechanisms
- **Loading States**: Automatic loading states for better UX
- **DevTools**: Built-in debugging tools for development

## 🏗️ **Architecture Overview**

### **Providers Structure:**
```
App
├── QueryProvider (React Query)
├── CartProvider (Cart Context)
└── Components
```

### **Key Hooks:**
- `useAuth()` - Authentication state and mutations
- `useCurrentUser()` - User data management
- `useUpdateUser()` - User data updates
- `useRefreshUser()` - User data refresh

## 📁 **File Structure**

```
app/
├── providers/
│   └── QueryProvider.js          # React Query provider
├── hooks/
│   ├── useAuth.js               # Authentication hook
│   └── useUser.js               # User data management hooks
├── contexts/
│   └── CartContext.js           # Cart state (kept for now)
├── utils/
│   └── api.js                   # API utility functions
└── pages/
    ├── SignInPage.js            # Updated to use React Query
    └── SignUpPage.js            # Updated to use React Query
```

## 🔧 **Configuration**

### **QueryProvider Configuration:**
```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minute
      retry: 1,                    // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
    mutations: {
      retry: 1,                    // Retry failed mutations once
    },
  },
})
```

### **Query Keys:**
```javascript
export const userKeys = {
  all: ['user'],
  details: (id) => [...userKeys.all, 'details', id],
  current: () => [...userKeys.all, 'current'],
}
```

## 🎯 **Usage Examples**

### **Authentication Hook:**
```javascript
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
  const { 
    user, 
    signIn, 
    signUp, 
    signOut, 
    isAuthenticated,
    isLoggingIn,
    isRegistering,
    loginError,
    registerError 
  } = useAuth()

  // Use the hook methods
  const handleLogin = async () => {
    const result = await signIn('username', 'password')
    if (result.success) {
      // Handle success
    }
  }
}
```

### **User Data Management:**
```javascript
import { useCurrentUser, useUpdateUser } from '../hooks/useUser'

function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser()
  const updateUser = useUpdateUser()

  const handleUpdate = async (userData) => {
    await updateUser.mutateAsync(userData)
  }
}
```

## 🔄 **State Management Flow**

### **Login Flow:**
1. User submits login form
2. `useAuth.signIn()` is called
3. React Query mutation executes API call
4. On success: User data is stored, cache is updated
5. On error: Error state is managed automatically

### **Registration Flow:**
1. User submits registration form
2. `useAuth.signUp()` is called
3. React Query mutation executes API call
4. On success: User data is stored, cache is updated
5. User is redirected to sign-in page

### **Data Synchronization:**
- **Automatic Cache Invalidation**: When user data changes, related queries are automatically invalidated
- **Background Refetching**: Data stays fresh without manual intervention
- **Optimistic Updates**: UI updates immediately for better user experience

## 🎨 **UI State Management**

### **Loading States:**
```javascript
const { isLoggingIn, isRegistering } = useAuth()

// Use in UI
<button disabled={isLoggingIn}>
  {isLoggingIn ? 'Signing In...' : 'Sign In'}
</button>
```

### **Error States:**
```javascript
const { loginError, registerError, resetLoginError } = useAuth()

// Display errors
{loginError && <div className="error">{loginError.message}</div>}

// Reset errors
useEffect(() => {
  resetLoginError()
}, [])
```

### **Success States:**
```javascript
// Handle success in mutations
const result = await signUp(userData)
if (result.success) {
  setSuccess('Account created successfully!')
  // Redirect after delay
  setTimeout(() => setCurrentView('signin'), 2000)
}
```

## 🛠️ **Development Tools**

### **React Query DevTools:**
- Automatically included in development
- Shows all queries, mutations, and cache state
- Helps debug data flow and performance

### **Browser DevTools:**
- Check Network tab for API calls
- Check Application tab for localStorage
- Check Console for error logs

## 🔒 **Security Features**

### **Token Management:**
- Authentication tokens stored in localStorage
- Automatic token cleanup on sign out
- Cache clearing on authentication state changes

### **Data Validation:**
- Form validation before API calls
- Error handling for failed requests
- User-friendly error messages

## 🚀 **Performance Optimizations**

### **Caching Strategy:**
- **Stale Time**: 5 minutes for user data
- **Garbage Collection**: 10 minutes for unused data
- **Background Updates**: Automatic data refresh

### **Query Optimization:**
- **Deduplication**: Multiple components requesting same data share one request
- **Background Refetching**: Data updates without blocking UI
- **Smart Retries**: Failed requests retry automatically

## 🔧 **Customization Options**

### **Modifying Query Behavior:**
```javascript
// In useUser.js
export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,    // Customize stale time
    gcTime: 10 * 60 * 1000,      // Customize garbage collection
    retry: 3,                     // Customize retry attempts
  })
}
```

### **Adding New Queries:**
```javascript
// Example: Products query
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 2 * 60 * 1000,    // 2 minutes
  })
}
```

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **Cache Not Updating:**
   - Check if query keys are correct
   - Verify cache invalidation calls
   - Use DevTools to inspect cache state

2. **Loading States Not Working:**
   - Ensure mutation states are properly destructured
   - Check if loading flags are used in UI

3. **Errors Not Displaying:**
   - Verify error handling in mutations
   - Check if error states are properly managed

### **Debug Mode:**
- Enable React Query DevTools
- Check browser console for detailed logs
- Monitor Network tab for API calls

## 📚 **Next Steps**

### **Potential Enhancements:**
1. **Offline Support**: Implement offline-first data strategy
2. **Real-time Updates**: Add WebSocket integration
3. **Advanced Caching**: Implement custom cache strategies
4. **Performance Monitoring**: Add query performance metrics

### **Migration Guide:**
- All authentication logic now uses React Query
- Context-based state management replaced with hooks
- Better error handling and loading states
- Improved performance and user experience

This implementation provides a robust, scalable foundation for state management in your Next.js application!





