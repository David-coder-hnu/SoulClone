import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface UserProfile {
  id: string
  phone: string
  nickname: string | null
  avatar_url: string | null
  bio: string | null
  gender: string | null
  birth_date: string | null
  location_city: string | null
  status: string
  is_online: boolean
  last_active_at: string | null
  created_at: string
  big_five?: Record<string, number> | null
}

async function fetchUserProfile(): Promise<UserProfile> {
  const { data } = await api.get('/users/me')
  return {
    id: String(data.id),
    phone: data.phone || '',
    nickname: data.nickname || null,
    avatar_url: data.avatar_url || null,
    bio: data.bio || null,
    gender: data.gender || null,
    birth_date: data.birth_date || null,
    location_city: data.location_city || null,
    status: data.status || 'active',
    is_online: data.is_online || false,
    last_active_at: data.last_active_at || null,
    created_at: data.created_at || new Date().toISOString(),
    big_five: data.big_five || null,
  }
}

export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 2,
  })
}
