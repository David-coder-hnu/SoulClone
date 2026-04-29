import { useEffect, useRef, useState, useCallback } from 'react'

export function useWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED)

  useEffect(() => {
    const connect = () => {
      const socket = new WebSocket(url)
      ws.current = socket

      socket.onopen = () => setReadyState(WebSocket.OPEN)
      socket.onmessage = (event) => {
        try {
          setLastMessage(JSON.parse(event.data))
        } catch {
          setLastMessage(event.data)
        }
      }
      socket.onclose = () => {
        setReadyState(WebSocket.CLOSED)
        // Auto reconnect after 3s
        setTimeout(connect, 3000)
      }
      socket.onerror = () => setReadyState(WebSocket.CLOSED)
    }

    connect()
    return () => {
      ws.current?.close()
    }
  }, [url])

  const sendMessage = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  return { lastMessage, readyState, sendMessage }
}
