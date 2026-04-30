import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ConversationDetail {
  id: string
  match_id: string | null
  participant_a_id: string
  participant_b_id: string
  status: string
  intimacy_score: number
  relationship_stage: string
  last_message_at: string | null
  created_at: string
  partner_nickname: string | null
  partner_avatar: string | null
  partner_is_online: boolean
  last_message_preview: string | null
  unread_count: number
}

export function useConversation(conversationId: string) {
  return useQuery<ConversationDetail>({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const res = await api.get(`/conversations`)
      const items = res.data || []
      const found = items.find((c: any) => String(c.id) === conversationId)
      if (!found) throw new Error('Conversation not found')
      return {
        id: String(found.id),
        match_id: found.match_id ? String(found.match_id) : null,
        participant_a_id: String(found.participant_a_id),
        participant_b_id: String(found.participant_b_id),
        status: found.status,
        intimacy_score: found.intimacy_score,
        relationship_stage: found.relationship_stage,
        last_message_at: found.last_message_at,
        created_at: found.created_at,
        partner_nickname: found.partner_nickname || '用户',
        partner_avatar: found.partner_avatar || null,
        partner_is_online: found.partner_is_online || false,
        last_message_preview: found.last_message_preview || '',
        unread_count: found.unread_count || 0,
      }
    },
    staleTime: 1000 * 30,
    enabled: !!conversationId,
  })
}
