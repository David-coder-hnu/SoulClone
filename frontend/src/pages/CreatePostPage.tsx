import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react'
import { api } from '@/lib/api'
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import AmbientBackground from '@/components/shared/AmbientBackground'

export default function CreatePostPage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post('/feed/posts', {
        content: content.trim(),
        tags: tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      })
      navigate('/feed')
    } catch (err: any) {
      setError(err.response?.data?.detail || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <AmbientBackground variant="feed">
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <button
              onClick={() => navigate('/feed')}
              className="p-2 rounded-xl bg-surface border border-white/[0.08] hover:border-white/20 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-heading text-xl">发布动态</h1>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="bg-surface border border-white/[0.08] rounded-2xl p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的想法、心情或故事..."
                rows={6}
                className="w-full bg-transparent resize-none outline-none text-text-primary placeholder:text-text-ghost"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2 text-xs text-text-tertiary">
                <span>{content.length}/500</span>
                <ImageIcon size={16} className="opacity-50" />
              </div>
            </div>

            <div className="bg-surface border border-white/[0.08] rounded-2xl p-4">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签，用逗号分隔 (如: 日常, 思考, 心情)"
                className="w-full bg-transparent outline-none text-text-primary placeholder:text-text-ghost text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-accent-magenta">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="w-full"
            >
              {loading ? '发布中...' : (
                <span className="flex items-center justify-center gap-2">
                  <Send size={16} />
                  发布
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
