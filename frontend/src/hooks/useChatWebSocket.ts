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
    sender_type?: 'human' | 'clone'
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

interface PongPayload {
  type: 'pong'
  client_time: string | null
  server_time: string
}

interface ConnectedPayload {
  type: 'connected'
  heartbeat_interval_seconds: number
}

type ControlMode =
  | 'clone_active'
  | 'human_active'
  | 'clone_cooldown'
  | 'paused'
  | 'blocked'

interface ControlChangedPayload {
  type: 'control_changed'
  conversation_id: string
  user_id: string
  mode: ControlMode
  version: number
  changed_at: string
  expires_at: string | null
  changed_by: 'human' | 'system' | 'admin'
  reason: string | null
}

interface CloneReplyApprovalRequiredPayload {
  type: 'clone_reply_approval_required'
  job_id: string
  conversation_id: string
  risk_level: 'L1' | 'L2'
  categories: string[]
  expires_at: string
}

interface CloneReplyReviewedPayload {
  type: 'clone_reply_reviewed'
  job_id: string
  conversation_id: string
  decision: 'approved' | 'rejected'
  status: string
}

const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_RECONNECT_DELAY = 1000
const HEARTBEAT_INTERVAL = 25_000
const HEARTBEAT_TIMEOUT = 60_000

export function useChatWebSocket(conversationId: string) {
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const heartbeatWatchdog = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPongAt = useRef(Date.now())
  const shouldReconnect = useRef(true)
  const [isConnected, setIsConnected] = useState(false)
  const [controlMode, setControlMode] = useState<ControlMode>('clone_active')
  const [approvalRevision, setApprovalRevision] = useState(0)
  const queryClient = useQueryClient()
  const { token, user } = useAuthStore()

  useEffect(() => {
    if (!token || !conversationId) return
    shouldReconnect.current = true

    const stopHeartbeat = () => {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current)
        heartbeatTimer.current = null
      }
      if (heartbeatWatchdog.current) {
        clearInterval(heartbeatWatchdog.current)
        heartbeatWatchdog.current = null
      }
    }

    const connect = () => {
      if (!shouldReconnect.current) return
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/chat?token=${token}`
      const socket = new WebSocket(wsUrl)
      ws.current = socket

      socket.onopen = () => {
        console.log('[WS] Chat connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
        lastPongAt.current = Date.now()
        stopHeartbeat()
        heartbeatTimer.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'ping',
              client_time: new Date().toISOString(),
            }))
          }
        }, HEARTBEAT_INTERVAL)
        heartbeatWatchdog.current = setInterval(() => {
          if (Date.now() - lastPongAt.current > HEARTBEAT_TIMEOUT) {
            socket.close(4000, 'Heartbeat timeout')
          }
        }, 10_000)
        socket.send(JSON.stringify({
          type: 'control',
          conversation_id: conversationId,
          action: 'get',
        }))
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as
            | ChatMessagePayload
            | TypingPayload
            | AckPayload
            | ReadReceiptPayload
            | PongPayload
            | ConnectedPayload
            | ControlChangedPayload
            | CloneReplyApprovalRequiredPayload
            | CloneReplyReviewedPayload
          if (data.type === 'pong') {
            lastPongAt.current = Date.now()
          } else if (data.type === 'message' && data.conversation_id === conversationId) {
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
                  sender_type: data.message.sender_type || 'human',
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
          } else if (
            data.type === 'control_changed'
            && data.conversation_id === conversationId
            && data.user_id === user?.id
          ) {
            setControlMode(data.mode)
          } else if (
            (data.type === 'clone_reply_approval_required'
              || data.type === 'clone_reply_reviewed')
            && data.conversation_id === conversationId
          ) {
            setApprovalRevision((revision) => revision + 1)
          }
        } catch {
          // ignore non-JSON
        }
      }

      socket.onclose = () => {
        console.log('[WS] Chat disconnected')
        setIsConnected(false)
        ws.current = null
        stopHeartbeat()
        // Exponential backoff reconnection
        if (
          shouldReconnect.current
          && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS
        ) {
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
      shouldReconnect.current = false
      stopHeartbeat()
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
  }, [token, conversationId, queryClient, user?.id])

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

  const sendControl = useCallback(
    (action: 'takeover' | 'release' | 'pause' | 'resume') => {
      if (ws.current?.readyState !== WebSocket.OPEN) return false
      ws.current.send(
        JSON.stringify({
          type: 'control',
          conversation_id: conversationId,
          action,
        })
      )
      return true
    },
    [conversationId]
  )

  return {
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendControl,
    controlMode,
    approvalRevision,
    isConnected,
  }
}
