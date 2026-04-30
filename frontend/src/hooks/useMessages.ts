import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'human' | 'clone'
  sender_clone_id: string | null
  content: string
  content_type: string
  is_read: boolean
  emotion_tag: string | null
  created_at: string
}

export function useMessages(conversationId: string) {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await api.get(`/messages/${conversationId}`)
      return res.data.items || []
    },
    staleTime: 1000 * 30,
    enabled: !!conversationId,
  })
}

export function useAppendMessage(conversationId: string) {
  const queryClient = useQueryClient()

  return (message: Message) => {
    queryClient.setQueryData<Message[]>(
      ['messages', conversationId],
      (old) => (old ? [...old, message] : [message])
    )
  }
}
