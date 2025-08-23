'use client'

import { useEffect } from 'react'
import { useSignalR } from '../hooks/useSignalR'

export default function SignalRProvider({ children }) {
  const { isConnected, connectionStatus } = useSignalR()

  // Make SignalR service globally available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import SignalR service dynamically to avoid SSR issues
      import('../utils/signalR').then(({ default: signalRService }) => {
        window.signalRService = signalRService
        console.log('🔌 SignalR service made globally available')
      })
    }
  }, [])

  // Log connection status
  useEffect(() => {
    console.log('🔌 SignalR connection status:', { isConnected, connectionStatus })
  }, [isConnected, connectionStatus])

  return children
}

