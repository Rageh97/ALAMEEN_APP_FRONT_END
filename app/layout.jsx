import { CartProvider } from './contexts/CartContext'
import QueryProvider from './providers/QueryProvider'
import SignalRProvider from './providers/SignalRProvider'
import LayoutContent from './components/LayoutContent'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const metadata = {
  title: 'AL Ameen',
  description: 'AL Ameen',
}

export default function RootLayout({ children }) {
  return (
    <html dir='rtl' lang="en">
      <body className='overflow-x-hidden' suppressHydrationWarning={true}>
        <QueryProvider>
          <CartProvider>
            <SignalRProvider>
              <LayoutContent>
                {children}
              </LayoutContent>
              <ToastContainer position="top-center" autoClose={3000} newestOnTop closeOnClick rtl theme="dark" />
            </SignalRProvider>
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
