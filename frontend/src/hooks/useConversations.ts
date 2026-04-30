import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Conversation {
  id: string
  partner: {
    nickname: string
    avatar: string | null
    is_online: boolean
  }
  last_message: string
  last_message_time: string
  unread: number
  intimacy: number
}

async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await api.get('/conversations')
  // Backend returns ConversationOut list; map to frontend shape
  return (data || []).map((conv: any) => ({
    id: String(conv.id),
    partner: {
      nickname: conv.partner_nickname || '用户',
      avatar: conv.partner_avatar || null,
      is_online: conv.partner_is_online || false,
    },
    last_message: conv.last_message_preview || '',
    last_message_time: conv.last_message_at || conv.created_at,
    unread: conv.unread_count || 0,
    intimacy: Math.round(conv.intimacy_score || 0),
  }))
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    staleTime: 1000 * 30,
  })
}
