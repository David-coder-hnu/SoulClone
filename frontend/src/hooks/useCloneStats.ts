import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CloneStats {
  id: string
  name: string | null
  status: string
  autonomy_level: number
  total_conversations: number
  total_messages_sent: number
  total_matches: number
  total_posts: number
  total_comments: number
  avg_response_time_sec: number | null
  success_rate: number | null
  current_mood: string | null
  last_activity_at: string | null
}

async function fetchCloneStats(): Promise<CloneStats> {
  const { data } = await api.get('/clones/me')
  return data
}

export function useCloneStats() {
  return useQuery<CloneStats>({
    queryKey: ['clone-stats'],
    queryFn: fetchCloneStats,
    staleTime: 1000 * 30,
  })
}
