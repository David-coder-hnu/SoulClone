export interface User {
  id: string
  phone: string
  email?: string
  nickname?: string
  avatar_url?: string
  gender?: string
  birth_date?: string
  location_city?: string
  bio?: string
  status: string
  is_online: boolean
}

export interface CloneProfile {
  id: string
  user_id: string
  completion_score: number
  is_activated: boolean
  distilled_persona: Record<string, unknown>
  chat_dna: Record<string, unknown>
  system_prompt: string
  autonomy_level: number
}

export interface Conversation {
  id: string
  participant_a_id: string
  participant_b_id: string
  status: string
  intimacy_score: number
  relationship_stage: string
  last_message_at?: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  likes_count: number
  comments_count: number
  created_at: string
}
