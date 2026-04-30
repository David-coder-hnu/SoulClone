import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface FeedPost {
  id: string
  author: {
    nickname: string
    avatar: string | null
  }
  content: string
  likes: number
  comments: number
  created_at: string
  tags: string[]
  is_twin_post: boolean
  media_urls: string[] | null
}

async function fetchFeedPosts(): Promise<FeedPost[]> {
  const { data } = await api.get('/feed')
  return (data?.items || []).map((post: any) => ({
    id: String(post.id),
    author: {
      nickname: post.author_nickname || '用户',
      avatar: post.author_avatar || null,
    },
    content: post.content || '',
    likes: post.likes_count || 0,
    comments: post.comments_count || 0,
    created_at: post.created_at || new Date().toISOString(),
    tags: post.tags || [],
    is_twin_post: post.is_twin_post || false,
    media_urls: post.media_urls || null,
  }))
}

export function useFeedPosts() {
  return useQuery<FeedPost[]>({
    queryKey: ['feed-posts'],
    queryFn: fetchFeedPosts,
    staleTime: 1000 * 60,
  })
}
