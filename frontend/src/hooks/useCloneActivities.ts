import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CloneActivity {
  id: string
  action_type: string
  description: string
  created_at: string
}

async function fetchCloneActivities(): Promise<CloneActivity[]> {
  const { data } = await api.get('/clones/me/activities')
  return data
}

export function useCloneActivities() {
  return useQuery<CloneActivity[]>({
    queryKey: ['clone-activities'],
    queryFn: fetchCloneActivities,
    staleTime: 1000 * 30,
  })
}
