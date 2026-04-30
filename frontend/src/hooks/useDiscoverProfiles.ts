import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface DiscoverProfile {
  id: string
  nickname: string
  age: number
  city: string
  bio: string
  tags: string[]
  traits: Record<string, number>
  distance: string
  avatar: string | null
}

async function fetchDiscoverProfiles(): Promise<DiscoverProfile[]> {
  const { data } = await api.get('/matches/discover')
  return (data?.items || []).map((item: any) => ({
    id: String(item.id),
    nickname: item.nickname || '用户',
    age: item.age || 0,
    city: item.city || '',
    bio: item.bio || '',
    tags: item.tags || [],
    traits: item.traits || {},
    distance: item.distance || '',
    avatar: item.avatar || null,
  }))
}

export function useDiscoverProfiles() {
  return useQuery<DiscoverProfile[]>({
    queryKey: ['discover-profiles'],
    queryFn: fetchDiscoverProfiles,
    staleTime: 1000 * 60 * 5,
  })
}
