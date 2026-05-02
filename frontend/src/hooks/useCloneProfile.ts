import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CloneProfile {
  id: string
  distilled_persona: Record<string, unknown>
  chat_dna: Record<string, unknown>
  decision_patterns: Record<string, unknown>
  memory_seed: string
  system_prompt: string
  behavior_rules: Record<string, unknown>
  autonomy_level: number
  completion_score: number
  is_activated: boolean
  version: number
}

async function fetchCloneProfile(): Promise<CloneProfile | null> {
  try {
    const { data } = await api.get('/distillation/profile')
    return data
  } catch (err: any) {
    if (err.response?.status === 404) {
      return null
    }
    throw err
  }
}

export function useCloneProfile() {
  return useQuery<CloneProfile | null>({
    queryKey: ['clone-profile'],
    queryFn: fetchCloneProfile,
    staleTime: 1000 * 60 * 2,
  })
}
