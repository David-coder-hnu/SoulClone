import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, MessageSquare, Brain, Sparkles, ChevronRight, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useDistillationProgress } from '@/hooks/useDistillationProgress'
import AnimatedBackground from '@/components/shared/AnimatedBackground'

const questions = [
  { id: 'values', question: '如果必须在以下三者中选择一个最看重的，你会选？', options: ['真诚与信任', '自由与冒险', '稳定与安全感'], category: '价值观' },
  { id: 'social_energy', question: '你在陌生聚会中通常...', options: ['主动找人聊天', '等别人来找你', '找个角落观察'], category: '社交能量' },
  { id: 'conflict', question: '当和伴侣发生分歧时，你倾向于...', options: ['立即沟通解决', '先冷静再谈', '避免冲突忍过去'], category: '冲突处理' },
  { id: 'love_language', question: '你表达喜欢的方式更偏向...', options: ['言语肯定', '实际行动', '肢体接触', '精心准备礼物'], category: '爱的语言' },
  { id: 'humor', question: '你的幽默风格更接近...', options: ['sarcastic 讽刺', 'self-deprecating 自嘲', 'absurd 无厘头', 'witty 机智'], category: '幽默风格' },
  { id: 'ideal_scene', question: '想象一个让你心动的人，TA此刻在做什么？', options: ['专注地工作/创作', '和朋友开怀大笑', '独自看书思考', '户外运动探险'], category: '理想场景' },
  { id: 'texting_style', question: '你平时回消息的习惯是...', options: ['秒回，看到就回', '想好了再回，几分钟', '忙完再回，可能很久', '看心情，忽快忽慢'], category: '聊天节奏' },
  { id: 'emotional_depth', question: '和不熟的人聊天，你更愿意聊...', options: ['日常琐事和趣事', '兴趣爱好和观点', '情感经历和心事', '抽象想法和幻想'], category: '情感深度' },
  { id: 'emoji_usage', question: '你使用 emoji / 表情包 的频率...', options: ['几乎每条都有', '偶尔用，看心情', '很少用，用文字表达', '完全不用'], category: '表情习惯' },
  { id: 'vulnerability', question: '在什么情况下你会向别人敞开心扉？', options: ['只有非常信任的人', '喝到微醺的时候', '深夜 emo 的时候', '基本上不会对人说'], category: '脆弱暴露' },
  { id: 'first_move', question: '遇到有好感的人，你会...', options: ['主动搭讪/发消息', '暗示等对方主动', '默默关注不敢行动', '直接表白不拖泥带水'], category: '主动程度' },
  { id: 'alone_time', question: '独处时，你通常感到...', options: ['充电，很享受', '有点寂寞但能忍', '必须找点事做', '很焦虑想找人陪'], category: '独处模式' },
]

interface ValidationResult {
  consistency_score: number
  stability_score: number
  safety_score: number
  plausibility_score: number
  critical_gaps: string[]
}

const STEP_LABELS: Record<string, string> = {
  queued: '排队中...',
  distilling_persona: '提取人格核心...',
  extracting_style: '分析聊天 DNA（句法、emoji、标点）...',
  forging_prompt: '锻造个性化回复引擎...',
  validating: '多轮验证与校准...',
  persisting: '保存数据...',
  completed: '完成',
  failed: '失败',
}

export default function OnboardingPage() {
  const [step, setStep] = useState<'questionnaire' | 'samples' | 'distilling' | 'complete'>('questionnaire')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatSamples, setChatSamples] = useState<string[]>([''])
  const [progress, setProgress] = useState(0)
  const [distillError, setDistillError] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const navigate = useNavigate()

  const { progress: sseProgress } = useDistillationProgress(jobId)

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQ].id]: answer }))
    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1)
    } else {
      setStep('samples')
    }
  }

  const addChatSample = () => setChatSamples((prev) => [...prev, ''])
  const updateChatSample = (index: number, value: string) => setChatSamples((prev) => { const n = [...prev]; n[index] = value; return n })
  const removeChatSample = (index: number) => setChatSamples((prev) => prev.filter((_, i) => i !== index))
  const getTotalChars = () => chatSamples.reduce((sum, s) => sum + s.length, 0)

  // Sync SSE progress to local progress
  useEffect(() => {
    if (!sseProgress) return
    setProgress(sseProgress.percent)
    if (sseProgress.status === 'completed') {
      setStep('complete')
      if (sseProgress.overall_score) {
        setValidationResult({
          consistency_score: Math.round(sseProgress.overall_score),
          stability_score: Math.round(sseProgress.overall_score),
          safety_score: Math.round(sseProgress.overall_score),
          plausibility_score: Math.round(sseProgress.overall_score),
          critical_gaps: [],
        })
      }
    }
    if (sseProgress.status === 'failed') {
      setDistillError(sseProgress.error || '创建失败，请重试')
      setStep('samples')
      setJobId(null)
    }
  }, [sseProgress])

  const startDistillation = async () => {
    const validSamples = chatSamples.filter((s) => s.trim().length > 10)
    if (validSamples.length === 0) {
      setDistillError('请至少提供一段有效的聊天样本（10字以上）')
      return
    }
    setStep('distilling')
    setDistillError('')
    setProgress(5)

    try {
      const res = await api.post('/distillation/start', {
        questionnaire_answers: answers,
        chat_samples: validSamples,
        social_import: null,
      })
      const data = res.data
      if (data.job_id) {
        setJobId(data.job_id)
      }
      if (data.validation) setValidationResult(data.validation)
    } catch (err: any) {
      setDistillError(err.response?.data?.detail || '创建失败，请重试')
      setStep('samples')
      setJobId(null)
    }
  }

  const handleRetry = () => {
    setDistillError('')
    setJobId(null)
    setProgress(0)
    setStep('samples')
  }

  const handleComplete = () => navigate('/home')
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-accent-cyan'
    if (score >= 70) return 'text-accent-gold'
    return 'text-accent-magenta'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">
      <AnimatedBackground opacity={0.4} />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-cyan/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">
          {step === 'questionnaire' && (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-bg-500 border border-white/[0.06] rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                  <Brain size={20} className="text-accent-cyan" />
                </div>
                <div>
                  <h2 className="font-sans text-xl font-bold">人格探测</h2>
                  <p className="text-text-secondary text-sm">问题 {currentQ + 1} / {questions.length} · {questions[currentQ].category}</p>
                </div>
              </div>

              <div className="h-1.5 bg-surface rounded-full mb-8 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>

              <motion.h3
                key={currentQ}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-medium mb-6 leading-relaxed"
              >
                {questions[currentQ].question}
              </motion.h3>

              <div className="space-y-3">
                {questions[currentQ].options.map((option, i) => (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left px-5 py-4 rounded-xl bg-surface border border-white/10 hover:border-accent-cyan/30 transition-all flex items-center justify-between group hover:bg-accent-cyan/5"
                  >
                    <span className="group-hover:text-accent-cyan transition-colors">{option}</span>
                    <ChevronRight size={18} className="text-text-ghost group-hover:text-accent-cyan transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'samples' && (
            <motion.div
              key="samples"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-bg-500 border border-white/[0.06] rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-magenta/10 flex items-center justify-center">
                  <MessageSquare size={20} className="text-accent-magenta" />
                </div>
                <div>
                  <h2 className="font-sans text-xl font-bold">聊天样本</h2>
                  <p className="text-text-secondary text-sm">提供 {chatSamples.length} 段真实对话 · 共 {getTotalChars()} 字</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {chatSamples.map((sample, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <textarea
                      value={sample}
                      onChange={(e) => updateChatSample(index, e.target.value)}
                      placeholder={index === 0
                        ? "粘贴一段你和朋友的真实聊天记录，包含双方的对话...\n\n示例：\n我：今天天气好好啊，想出去走走\n朋友：是啊，去哪？\n我：不知道诶，随便逛逛吧 ✨"
                        : "再添加一段不同场景的聊天..."
                      }
                      className="w-full h-40 px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder-text-ghost focus:outline-none focus:border-accent-magenta/50 transition-colors resize-none"
                    />
                    {chatSamples.length > 1 && (
                      <button
                        onClick={() => removeChatSample(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface/80 text-text-ghost hover:text-accent-magenta transition-colors"
                      >
                        <AlertCircle size={14} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {chatSamples.length < 3 && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  onClick={addChatSample}
                  className="w-full py-3 rounded-xl border border-dashed border-white/20 text-text-secondary hover:border-accent-cyan/50 hover:text-accent-cyan transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <RefreshCw size={14} />
                  添加更多聊天样本（推荐3段不同场景）
                </motion.button>
              )}

              <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-gold/5 border border-accent-gold/20 mb-6">
                <Upload size={18} className="text-accent-gold shrink-0 mt-0.5" />
                <div className="text-sm text-text-secondary space-y-1">
                  <p>样本越多，匹配越精准。建议提供：</p>
                  <ul className="list-disc list-inside text-text-ghost space-y-0.5">
                    <li>日常闲聊片段</li>
                    <li>表达情绪时的对话</li>
                    <li>暧昧/好感场景（如有）</li>
                  </ul>
                </div>
              </div>

              {distillError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-accent-magenta text-sm mb-4 flex items-center gap-2"
                >
                  <AlertCircle size={14} />
                  {distillError}
                </motion.p>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startDistillation}
                disabled={getTotalChars() < 20}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:shadow-xl hover:shadow-accent-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                开始创建
              </motion.button>
            </motion.div>
          )}

          {step === 'distilling' && (
            <motion.div
              key="distilling"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-bg-500 border border-white/[0.06] rounded-2xl p-12 text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-accent-cyan/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ borderTopColor: '#00f0ff' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-accent-magenta/30"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  style={{ borderBottomColor: '#ff006e' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={32} className="text-accent-cyan animate-spin" />
                </div>
              </div>

              <h2 className="font-heading text-2xl mb-2">正在深度创建...</h2>
              <p className="text-text-secondary mb-6">正在分析你的人格特征和聊天风格</p>

              <div className="h-2.5 bg-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-cyan via-accent-magenta to-accent-gold"
                  style={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 50 }}
                />
              </div>
              <p className="text-accent-cyan font-mono text-sm mt-3">{Math.round(progress)}%</p>

              <div className="mt-8 space-y-2.5 text-sm text-text-secondary">
                <motion.p animate={{ opacity: 1 }} className="text-accent-cyan">
                  {STEP_LABELS[sseProgress?.step || 'queued'] || '处理中...'}
                </motion.p>
                {sseProgress?.error && (
                  <p className="text-accent-magenta">{sseProgress.error}</p>
                )}
              </div>
              {sseProgress?.status === 'failed' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  className="mt-4 px-6 py-2 rounded-xl bg-bg-600 border border-white/10 text-text-primary hover:border-accent-cyan/50 transition-colors"
                >
                  重试
                </motion.button>
              )}
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-bg-500 border border-white/[0.06] rounded-2xl p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center shadow-lg shadow-accent-cyan/30"
              >
                <Sparkles size={40} className="text-white" />
              </motion.div>

              <h2 className="font-sans text-3xl font-bold mb-3">准备就绪</h2>
              <p className="text-text-secondary mb-8 max-w-sm mx-auto">
                你的在线状态已创建完成。现在你可以在 SoulClone 上开始社交了。
              </p>

              {validationResult ? (
                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '风格一致性', score: validationResult.consistency_score, icon: CheckCircle },
                      { label: '人格稳定性', score: validationResult.stability_score, icon: CheckCircle },
                      { label: '安全性', score: validationResult.safety_score, icon: CheckCircle },
                      { label: '真实感', score: validationResult.plausibility_score, icon: CheckCircle },
                    ].map((stat) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.03 }}
                        className="p-3 rounded-2xl bg-surface border border-white/5 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <stat.icon size={14} className={getScoreColor(stat.score)} />
                          <span className="text-text-ghost text-xs">{stat.label}</span>
                        </div>
                        <p className={`font-sans text-xl font-bold ${getScoreColor(stat.score)}`}>
                          {stat.score}%
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {validationResult.critical_gaps.length > 0 && (
                    <div className="p-4 rounded-xl bg-accent-magenta/5 border border-accent-magenta/20 text-left">
                      <p className="text-accent-magenta text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertCircle size={14} />
                        可进一步提升的方面
                      </p>
                      <ul className="space-y-1">
                        {validationResult.critical_gaps.map((gap, i) => (
                          <li key={i} className="text-text-secondary text-sm">· {gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: '人格完整度', value: '已完成' },
                    { label: '风格匹配', value: '已分析' },
                    { label: '记忆种子', value: '已植入' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-2xl bg-surface border border-white/5"
                    >
                      <p className="text-accent-cyan font-sans text-xl font-bold">{stat.value}</p>
                      <p className="text-text-ghost text-xs mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleComplete}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:shadow-xl hover:shadow-accent-cyan/20"
              >
                进入 SoulClone
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
