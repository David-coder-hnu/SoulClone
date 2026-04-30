import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

async function fetchNotifications(): Promise<{ items: NotificationItem[]; unread_count: number }> {
  const { data } = await api.get('/notifications')
  const items = (data?.items || []).map((n: any) => ({
    id: String(n.id || Math.random()),
    type: n.type || 'system',
    title: n.title || '',
    message: n.message || '',
    is_read: n.is_read || false,
    created_at: n.created_at || new Date().toISOString(),
  }))
  const unread_count = items.filter((n: NotificationItem) => !n.is_read).length
  return { items, unread_count }
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 1000 * 30,
  })
}
