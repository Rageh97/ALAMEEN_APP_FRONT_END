'use client'

import { useState } from 'react'
import { ShoppingBagIcon, UserIcon, CogIcon, HomeIcon, ClipboardDocumentListIcon, Bars3Icon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import "@/app/globals.css"

export default function Navigation() {
  const { user, signOut, isAuthenticated } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigateTo = (path) => {
    window.location.href = path
    setIsMobileMenuOpen(false) // Close mobile menu after navigation
  }

  const handleSignOut = () => {
    signOut()
    setIsMobileMenuOpen(false) // Close mobile menu after logout
    // Redirect to signin page after logout
    navigateTo('/signin')
  }

  return (
    <>
      <nav className="bg-gradient-to-r from-background-content-1 to-background-content-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <ShoppingBagIcon className="h-8 w-8 text-icons mx-2" />
              <span className="ml-2 text-xl font-bold text-white-900">الأمين</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigateTo('/')}
                className="flex items-center px-3 py-2 text-white-700 hover:text-icons transition-colors"
              >
                <HomeIcon className="h-5 w-5 mx-2 text-icons" />
                الرئيسية
              </button>
              
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigateTo('/signin')}
                    className="btn-secondary"
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    onClick={() => navigateTo('/signup')}
                    className="btn-primary"
                  >
                  انشاء حساب
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigateTo('/orders')}
                    className="flex items-center px-3 py-2 text-white-700 hover:text-icons transition-colors"
                  >
                    <ClipboardDocumentListIcon className="h-5 w-5 mx-2 text-icons" />
                    طلباتي
                  </button>
                  <button
                    onClick={() => navigateTo('/notifications')}
                    className="flex items-center px-3 py-2 text-white-700 hover:text-icons transition-colors"
                  >
                    <BellIcon className="h-5 w-5 mx-2 text-icons" />
                    الإشعارات
                  </button>
                  {user?.isAdmin && (
                    <button
                      onClick={() => navigateTo('/admin')}
                      className="flex items-center px-3 py-2 text-text hover:text-icons transition-colors"
                    >
                      <CogIcon className="h-5 w-5 mx-2 text-icons" />
                      لوحة التحكم
                    </button>
                  )}
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5 text-icons mx-2" />
                    <span className="text-sm text-text">{user?.userName}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 mx-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4 text-icons mx-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                    تسجيل خروج
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-icons hover:text-white transition-colors"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Side Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60  z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Side Menu */}
          <div className="fixed right-0 top-0 h-full w-64 bg-background/90 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <ShoppingBagIcon className="h-6 w-6 text-icons mx-2" />
                  <span className="text-lg font-bold text-white">الأمين</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6 text-orange-500" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-2">
                  {/* Home */}
                  <button
                    onClick={() => navigateTo('/')}
                    className="w-full flex items-center px-4 py-3 text-white hover:bg-icons transition-colors"
                  >
                    <HomeIcon className="h-5 w-5 mx-3 text-icons" />
                    الرئيسية
                  </button>

                  {!isAuthenticated ? (
                    <>
                      {/* Sign In */}
                      <button
                        onClick={() => navigateTo('/signin')}
                        className="w-full flex items-center px-4 py-3 text-white hover:bg-icons transition-colors"
                      >
                        <UserIcon className="h-5 w-5 mx-3 text-icons" />
                        تسجيل الدخول
                      </button>
                      
                      {/* Sign Up */}
                      <button
                        onClick={() => navigateTo('/signup')}
                        className="w-full flex items-center px-4 py-3 text-white hover:bg-icons transition-colors"
                      >
                        <UserIcon className="h-5 w-5 mx-3 text-icons" />
                        انشاء حساب
                      </button>
                    </>
                  ) : (
                    <>
                      {/* My Orders */}
                      <button
                        onClick={() => navigateTo('/orders')}
                        className="w-full flex items-center px-4 py-3 text-white hover:bg-icons transition-colors"
                      >
                        <ClipboardDocumentListIcon className="h-5 w-5 mx-3 text-icons" />
                        طلباتي
                      </button>
                      
                      {/* Notifications */}
                      <button
                        onClick={() => navigateTo('/notifications')}
                        className="w-full flex items-center px-4 py-3 text-white hover:bg-icons transition-colors"
                      >
                        <BellIcon className="h-5 w-5 mx-3 text-icons" />
                        الإشعارات
                      </button>
                      
                      {/* Admin Dashboard */}
                      {user?.isAdmin && (
                        <button
                          onClick={() => navigateTo('/admin')}
                          className="w-full flex items-center px-4 py-3 text-white hover:bg-icons transition-colors"
                        >
                          <CogIcon className="h-5 w-5 mx-3 text-icons" />
                          لوحة التحكم
                        </button>
                      )}
                      
                      {/* User Profile */}
                      <div className="px-4 py-3 border-t border-gray-200">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 mx-3 text-icons" />
                          <span className="text-sm text-white">{user?.name}</span>
                        </div>
                      </div>
                      
                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-3 text-orange-600 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 mx-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                        </svg>
                        تسجيل خروج
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 