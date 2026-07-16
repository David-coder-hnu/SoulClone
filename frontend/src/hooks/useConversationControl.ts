import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type ConversationControlMode =
  | 'clone_active'
  | 'human_active'
  | 'clone_cooldown'
  | 'paused'
  | 'blocked'

export interface ConversationControl {
  type: 'control_changed'
  conversation_id: string
  user_id: string
  mode: ConversationControlMode
  version: number
  changed_at: string
  expires_at: string | null
  changed_by: string
  reason: string | null
}

const controlKey = (conversationId: string) => ['conversation-control', conversationId]

export function useConversationControl(conversationId?: string) {
  return useQuery<ConversationControl>({
    queryKey: controlKey(conversationId || ''),
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}/control`)
      return data
    },
    enabled: Boolean(conversationId),
    staleTime: 15_000,
    retry: 1,
  })
}

function useControlTransition(action: 'takeover' | 'release') {
  const queryClient = useQueryClient()

  return useMutation<ConversationControl, unknown, string>({
    mutationFn: async (conversationId) => {
      const { data } = await api.post(`/conversations/${conversationId}/${action}`)
      return data
    },
    onSuccess: (control, conversationId) => {
      queryClient.setQueryData(controlKey(conversationId), control)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useTakeoverConversation() {
  return useControlTransition('takeover')
}

export function useReleaseConversation() {
  return useControlTransition('release')
}
