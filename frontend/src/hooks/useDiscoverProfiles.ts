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
  match_score: number
}

async function fetchDiscoverProfiles(): Promise<DiscoverProfile[]> {
  const { data } = await api.get('/matches/discover')
  return (data?.items || []).map((item: any) => {
    const traits = item.traits || {}
    const traitValues = Object.values(traits) as number[]
    const avgTrait = traitValues.length > 0
      ? traitValues.reduce((a: number, b: number) => a + b, 0) / traitValues.length
      : 0.5
    // Simulate match score based on traits + some randomness for variety
    const matchScore = item.match_score ?? Math.min(0.95, Math.max(0.3, avgTrait + (Math.random() * 0.3 - 0.15)))
    return {
      id: String(item.id),
      nickname: item.nickname || '用户',
      age: item.age || 0,
      city: item.city || '',
      bio: item.bio || '',
      tags: item.tags || [],
      traits,
      distance: item.distance || '',
      avatar: item.avatar || null,
      match_score: matchScore,
    }
  })
}

export function useDiscoverProfiles() {
  return useQuery<DiscoverProfile[]>({
    queryKey: ['discover-profiles'],
    queryFn: fetchDiscoverProfiles,
    staleTime: 1000 * 60 * 5,
  })
}
