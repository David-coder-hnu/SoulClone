import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Notification {
  id: string
  user_id: string
  type: 'match' | 'message' | 'date_invite' | 'takeover_request' | 'clone_activity' | 'system'
  title: string
  content: string | null
  payload: Record<string, any> | null
  is_read: boolean
  created_at: string
}

async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await api.get('/notifications')
  return (data || []).map((n: any) => ({
    id: String(n.id),
    user_id: String(n.user_id),
    type: n.type,
    title: n.title,
    content: n.content || null,
    payload: n.payload || null,
    is_read: n.is_read || false,
    created_at: n.created_at || new Date().toISOString(),
  }))
}

async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-count')
  return data?.count || 0
}

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data: notifications, ...rest } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 1000 * 30,
  })

  const { data: unreadCount } = useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 1000 * 30,
  })

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    markAsRead,
    markAllAsRead,
    ...rest,
  }
}
