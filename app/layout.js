import { CartProvider } from './contexts/CartContext'
import QueryProvider from './providers/QueryProvider'
import LayoutContent from './components/LayoutContent'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const metadata = {
  title: 'E-Commerce Store',
  description: 'Beautiful e-commerce store with user authentication and admin dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html dir='rtl' lang="en">
      <body className='overflow-x-hidden'>
        <QueryProvider>
          <CartProvider>
            <LayoutContent>
              {children}
            </LayoutContent>
            <ToastContainer position="top-center" autoClose={3000} newestOnTop closeOnClick rtl theme="dark" />
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
