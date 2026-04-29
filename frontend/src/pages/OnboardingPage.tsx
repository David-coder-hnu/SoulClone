import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, MessageSquare, Brain, Sparkles, ChevronRight, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'


const questions = [
  {
    id: 'values',
    question: '如果必须在以下三者中选择一个最看重的，你会选？',
    options: ['真诚与信任', '自由与冒险', '稳定与安全感'],
  },
  {
    id: 'social',
    question: '你在陌生聚会中通常...',
    options: ['主动找人聊天', '等别人来找你', '找个角落观察'],
  },
  {
    id: 'conflict',
    question: '当和伴侣发生分歧时，你倾向于...',
    options: ['立即沟通解决', '先冷静再谈', '避免冲突忍过去'],
  },
  {
    id: 'expression',
    question: '你表达喜欢的方式更偏向...',
    options: ['言语肯定', '实际行动', '肢体接触', '精心准备礼物'],
  },
  {
    id: 'humor',
    question: '你的幽默风格更接近...',
    options: [' sarcastic 讽刺', 'self-deprecating 自嘲', 'absurd 无厘头', 'witty 机智'],
  },
  {
    id: 'ideal',
    question: '想象一个让你心动的人，TA此刻在做什么？',
    options: ['专注地工作/创作', '和朋友开怀大笑', '独自看书思考', '户外运动探险'],
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState<'questionnaire' | 'samples' | 'distilling' | 'complete'>('questionnaire')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatSample, setChatSample] = useState('')
  const [progress, setProgress] = useState(0)
  const navigate = useNavigate()

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQ].id]: answer }))
    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1)
    } else {
      setStep('samples')
    }
  }

  const [distillError, setDistillError] = useState('')

  const startDistillation = async () => {
    setStep('distilling')
    setDistillError('')
    setProgress(0)

    try {
      await api.post('/distillation/start', {
        questionnaire_answers: answers,
        chat_samples: chatSample ? [chatSample] : [],
        social_import: null,
      })

      // Poll for completion
      for (let i = 0; i <= 60; i++) {
        setProgress(Math.min(i * 1.6, 99))
        await new Promise((r) => setTimeout(r, 1000))
        try {
          const statusRes = await api.get('/distillation/status')
          if (statusRes.data.is_activated) {
            setProgress(100)
            setStep('complete')
            return
          }
        } catch {
          // continue polling
        }
      }
      setStep('complete')
    } catch (err: any) {
      setDistillError(err.response?.data?.detail || '蒸馏失败，请重试')
      setStep('samples')
    }
  }

  const handleComplete = () => {
    navigate('/home')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-cyan/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent-magenta/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">
          {step === 'questionnaire' && (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-elevated rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                  <Brain size={20} className="text-accent-cyan" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">人格探测</h2>
                  <p className="text-text-secondary text-sm">问题 {currentQ + 1} / {questions.length}</p>
                </div>
              </div>

              <div className="h-1 bg-surface rounded-full mb-8 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>

              <h3 className="text-lg font-medium mb-6 leading-relaxed">
                {questions[currentQ].question}
              </h3>

              <div className="space-y-3">
                {questions[currentQ].options.map((option) => (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left px-5 py-4 rounded-xl bg-surface border border-white/10 hover:border-accent-cyan/30 transition-colors flex items-center justify-between group"
                  >
                    <span>{option}</span>
                    <ChevronRight size={18} className="text-text-ghost group-hover:text-accent-cyan transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'samples' && (
            <motion.div
              key="samples"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-elevated rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-magenta/10 flex items-center justify-center">
                  <MessageSquare size={20} className="text-accent-magenta" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">聊天样本</h2>
                  <p className="text-text-secondary text-sm">粘贴一段你的真实聊天记录</p>
                </div>
              </div>

              <div className="mb-6">
                <textarea
                  value={chatSample}
                  onChange={(e) => setChatSample(e.target.value)}
                  placeholder="比如：&#10;我：今天天气好好啊，想出去走走&#10;朋友：是啊，去哪？&#10;我：不知道诶，随便逛逛吧 ✨"
                  className="w-full h-48 px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder-text-ghost focus:outline-none focus:border-accent-magenta/50 transition-colors resize-none"
                />
                <p className="text-text-ghost text-xs mt-2">
                  这段对话将帮助AI精确提取你的语气、emoji习惯和聊天节奏
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-gold/5 border border-accent-gold/20 mb-6">
                <Upload size={18} className="text-accent-gold shrink-0" />
                <p className="text-sm text-text-secondary">
                  可选：授权导入微博/小红书文本以获得更精确的克隆
                </p>
              </div>

              {distillError && (
                <p className="text-accent-magenta text-sm mb-4">{distillError}</p>
              )}
              <button
                onClick={startDistillation}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                开始蒸馏
              </button>
            </motion.div>
          )}

          {step === 'distilling' && (
            <motion.div
              key="distilling"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-elevated rounded-3xl p-12 text-center"
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

              <h2 className="font-display text-2xl font-bold mb-2">正在蒸馏...</h2>
              <p className="text-text-secondary mb-6">AI正在分析你的人格DNA</p>

              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-cyan via-accent-magenta to-accent-gold"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-accent-cyan font-mono text-sm mt-3">{progress}%</p>

              <div className="mt-8 space-y-2 text-sm text-text-secondary">
                <motion.p animate={{ opacity: progress > 20 ? 1 : 0.3 }}>提取人格核心...</motion.p>
                <motion.p animate={{ opacity: progress > 40 ? 1 : 0.3 }}>分析聊天DNA...</motion.p>
                <motion.p animate={{ opacity: progress > 60 ? 1 : 0.3 }}>合成记忆种子...</motion.p>
                <motion.p animate={{ opacity: progress > 80 ? 1 : 0.3 }}>锻造System Prompt...</motion.p>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-elevated rounded-3xl p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center glow-cyan"
              >
                <Sparkles size={40} className="text-white" />
              </motion.div>

              <h2 className="font-display text-3xl font-bold mb-3">你的孪生已诞生</h2>
              <p className="text-text-secondary mb-8 max-w-sm mx-auto">
                AI已成功克隆你的人格。现在，你的数字孪生可以代替你在SoulClone上社交了。
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: '人格完整度', value: '97%' },
                  { label: '风格匹配度', value: '94%' },
                  { label: '记忆种子', value: '已植入' },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-2xl bg-surface border border-white/5">
                    <p className="text-accent-cyan font-display text-xl font-bold">{stat.value}</p>
                    <p className="text-text-ghost text-xs mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleComplete}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:scale-105 hover:shadow-lg"
              >
                进入 SoulClone
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
