import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { playSound } from '@/lib/sound'
import type { Message } from './useMessages'

interface ChatMessagePayload {
  type: 'message'
  conversation_id: string
  message: {
    id: string
    sender_id: string
    content: string
    created_at: string
  }
}

interface TypingPayload {
  type: 'typing'
  conversation_id: string
  user_id: string
  is_typing: boolean
}

interface AckPayload {
  type: 'ack'
  client_message_id: string
  server_message_id: string
  status: 'persisted' | 'delivered' | 'read'
  duplicate: boolean
}

interface ReadReceiptPayload {
  type: 'read_receipt'
  conversation_id: string
  read_by: string
  read_through_message_id: string
  message_ids: string[]
  read_at: string
}

const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_RECONNECT_DELAY = 1000

export function useChatWebSocket(conversationId: string) {
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const queryClient = useQueryClient()
  const { token } = useAuthStore()

  useEffect(() => {
    if (!token || !conversationId) return

    const connect = () => {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/chat?token=${token}`
      const socket = new WebSocket(wsUrl)
      ws.current = socket

      socket.onopen = () => {
        console.log('[WS] Chat connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as
            | ChatMessagePayload
            | TypingPayload
            | AckPayload
            | ReadReceiptPayload
          if (data.type === 'message' && data.conversation_id === conversationId) {
            playSound('receive-message')
            // Append incoming message to React Query cache
            queryClient.setQueryData<Message[]>(
              ['messages', conversationId],
              (old) => {
                if (!old) return []
                const msg: Message = {
                  id: data.message.id,
                  conversation_id: data.conversation_id,
                  sender_id: data.message.sender_id,
                  sender_type: 'human',
                  sender_clone_id: null,
                  content: data.message.content,
                  content_type: 'text',
                  is_read: false,
                  emotion_tag: null,
                  created_at: data.message.created_at,
                }
                // Avoid duplicates
                if (old.some((m) => m.id === msg.id)) return old
                return [...old, msg]
              }
            )
          } else if (data.type === 'read_receipt' && data.conversation_id === conversationId) {
            const readIds = new Set(data.message_ids)
            queryClient.setQueryData<Message[]>(
              ['messages', conversationId],
              (old) => old?.map((message) =>
                readIds.has(message.id)
                  ? {
                      ...message,
                      is_read: true,
                      read_at: data.read_at,
                      delivery_status: 'read',
                    }
                  : message
              ) || []
            )
          }
        } catch {
          // ignore non-JSON
        }
      }

      socket.onclose = () => {
        console.log('[WS] Chat disconnected')
        setIsConnected(false)
        ws.current = null
        // Exponential backoff reconnection
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current)
          reconnectAttempts.current += 1
          reconnectTimer.current = setTimeout(() => {
            console.log(`[WS] Reconnecting attempt ${reconnectAttempts.current}...`)
            connect()
          }, delay)
        }
      }

      socket.onerror = (err) => {
        console.error('[WS] Chat error', err)
        setIsConnected(false)
        socket.close()
      }
    }

    connect()

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
      if (ws.current) {
        ws.current.close()
        ws.current = null
      }
      reconnectAttempts.current = 0
    }
  }, [token, conversationId, queryClient])

  const sendMessage = useCallback(
    (content: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        const clientMessageId = crypto.randomUUID()
        ws.current.send(
          JSON.stringify({
            type: 'message',
            conversation_id: conversationId,
            client_message_id: clientMessageId,
            content,
          })
        )
        return clientMessageId
      }
      return null
    },
    [conversationId]
  )

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: 'typing',
            conversation_id: conversationId,
            is_typing: isTyping,
          })
        )
      }
    },
    [conversationId]
  )

  const sendReadReceipt = useCallback(
    (messageId: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: 'read_receipt',
            conversation_id: conversationId,
            message_id: messageId,
          })
        )
        return true
      }
      return false
    },
    [conversationId]
  )

  return { sendMessage, sendTyping, sendReadReceipt, isConnected }
}
