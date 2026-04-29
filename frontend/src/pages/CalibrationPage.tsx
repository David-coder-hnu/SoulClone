import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, Send, User, Bot, CheckCircle, RefreshCw, Sparkles, ArrowRight, Beaker } from 'lucide-react'
import { api } from '@/lib/api'
import AnimatedBackground from '@/components/shared/AnimatedBackground'
import CursorTrail from '@/components/shared/CursorTrail'

interface TestResult {
  scenario: string
  generatedResponse: string
  userResponse: string
  analysis: {
    overall_match: number
    style_gaps: Array<{
      dimension: string
      clone_behavior: string
      user_behavior: string
      severity: string
    }>
    improvement_suggestions: string[]
  } | null
}

const sampleScenarios = [
  '对方说：今天好累啊，想你了',
  '对方说：周末有空吗？一起看电影？',
  '对方说：我刚刚被领导批评了...',
  '对方说：你觉得我新剪的头发怎么样？',
  '对方说：哈哈你上次说的那个笑死我了',
]

export default function CalibrationPage() {
  const [scenario, setScenario] = useState('')
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [userResponse, setUserResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [currentAnalysis, setCurrentAnalysis] = useState<TestResult['analysis']>(null)

  const testStyle = async () => {
    if (!scenario.trim()) return
    setIsLoading(true)
    setGeneratedResponse('')
    setCurrentAnalysis(null)
    try {
      const res = await api.post('/calibration/test', { scenario })
      setGeneratedResponse(res.data.generated_response)
    } catch (err: any) {
      console.error('Test failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const submitFeedback = async () => {
    if (!generatedResponse || !userResponse.trim()) return
    setIsAnalyzing(true)
    try {
      const res = await api.post('/calibration/feedback', {
        scenario,
        generated_response: generatedResponse,
        user_response: userResponse,
      })
      const analysis = res.data.analysis
      setCurrentAnalysis(analysis)
      setResults((prev) => [...prev, { scenario, generatedResponse, userResponse, analysis }])
    } catch (err: any) {
      console.error('Feedback failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const refineStyle = async () => {
    if (results.length < 2) return
    setIsLoading(true)
    try {
      const res = await api.post('/calibration/refine', {
        test_results: results.map((r) => ({
          scenario: r.scenario,
          generated_response: r.generatedResponse,
          user_response: r.userResponse,
          issues: r.analysis?.style_gaps?.map((g) => g.dimension) || [],
        })),
      })
      alert(`精调完成！信心度: ${res.data.confidence}%\n修改项: ${res.data.changes_made?.length || 0} 条`)
    } catch (err: any) {
      console.error('Refine failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-accent-magenta'
      case 'medium': return 'text-accent-gold'
      default: return 'text-accent-cyan'
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden bg-background">
      <CursorTrail />
      <AnimatedBackground opacity={0.4} />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-accent-magenta/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-4"
          >
            <Beaker size={16} className="text-accent-cyan" />
            <span className="text-accent-cyan text-sm font-medium">风格校准实验室</span>
          </motion.div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">让你的回复更自然</h1>
          <p className="text-text-secondary max-w-md mx-auto">
            测试在线状态的回复风格，提供真实回复作为对比，系统会学习差异并自动优化
          </p>
        </motion.div>

        {/* Scenario Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-elevated rounded-3xl p-6 mb-6 border border-white/5"
        >
          <label className="block text-sm font-medium mb-3 text-text-secondary">输入一个对话场景</label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="例如：对方说：今天好累啊，想你了"
            className="w-full h-24 px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder-text-ghost focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-colors resize-none mb-3"
          />

          <div className="flex flex-wrap gap-2 mb-4">
            {sampleScenarios.map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScenario(s)}
                className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-text-secondary hover:border-accent-cyan/30 hover:text-accent-cyan transition-colors"
              >
                {s.length > 20 ? s.slice(0, 20) + '...' : s}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={testStyle}
            disabled={!scenario.trim() || isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:shadow-xl hover:shadow-accent-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                <Sparkles size={18} />
                测试回复风格
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Generated Response */}
        <AnimatePresence>
          {generatedResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-elevated rounded-3xl p-6 mb-6 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent-magenta/10 flex items-center justify-center">
                  <Bot size={16} className="text-accent-magenta" />
                </div>
                <span className="font-medium text-accent-magenta">系统生成的回复</span>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-accent-magenta/15 text-text-primary leading-relaxed">
                {generatedResponse}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Real Response */}
        <AnimatePresence>
          {generatedResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-elevated rounded-3xl p-6 mb-6 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                  <User size={16} className="text-accent-cyan" />
                </div>
                <span className="font-medium text-accent-cyan">你的真实回复</span>
              </div>
              <p className="text-text-secondary text-sm mb-3">
                如果是你，你会怎么回复？写下最真实的反应：
              </p>
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="写下你的真实回复..."
                className="w-full h-24 px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder-text-ghost focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-colors resize-none mb-4"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitFeedback}
                disabled={!userResponse.trim() || isAnalyzing}
                className="w-full py-3 rounded-xl bg-surface border border-accent-cyan/30 text-accent-cyan font-semibold transition-all hover:bg-accent-cyan/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    提交对比分析
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Result */}
        <AnimatePresence>
          {currentAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-elevated rounded-3xl p-6 mb-6 border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FlaskConical size={18} className="text-accent-gold" />
                  <span className="font-medium">风格差异分析</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-ghost text-sm">匹配度</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`font-display text-xl font-bold ${
                      currentAnalysis.overall_match >= 80 ? 'text-accent-cyan' :
                      currentAnalysis.overall_match >= 60 ? 'text-accent-gold' : 'text-accent-magenta'
                    }`}
                  >
                    {currentAnalysis.overall_match}%
                  </motion.span>
                </div>
              </div>

              {currentAnalysis.style_gaps && currentAnalysis.style_gaps.length > 0 && (
                <div className="space-y-3 mb-4">
                  {currentAnalysis.style_gaps.map((gap, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-xl bg-surface border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{gap.dimension}</span>
                        <span className={`text-xs font-medium ${getSeverityColor(gap.severity)}`}>
                          {gap.severity === 'high' ? '严重' : gap.severity === 'medium' ? '中等' : '轻微'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-text-ghost">
                          <span className="text-accent-magenta">系统: </span>
                          {gap.clone_behavior}
                        </div>
                        <div className="text-text-ghost">
                          <span className="text-accent-cyan">真实: </span>
                          {gap.user_behavior}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {currentAnalysis.improvement_suggestions && currentAnalysis.improvement_suggestions.length > 0 && (
                <div className="p-3 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20">
                  <p className="text-accent-cyan text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle size={14} />
                    改进建议
                  </p>
                  <ul className="space-y-1">
                    {currentAnalysis.improvement_suggestions.map((s, i) => (
                      <li key={i} className="text-text-secondary text-sm">· {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test History & Refine */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-elevated rounded-3xl p-6 mb-6 border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">已完成的测试 ({results.length})</span>
              <span className="text-text-ghost text-sm">
                平均匹配度: {Math.round(results.reduce((s, r) => s + (r.analysis?.overall_match || 0), 0) / results.length)}%
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-white/5"
                >
                  <span className="text-sm text-text-secondary truncate max-w-[200px]">
                    测试 {i + 1}: {r.scenario}
                  </span>
                  <span className={`text-sm font-medium ${
                    (r.analysis?.overall_match || 0) >= 80 ? 'text-accent-cyan' :
                    (r.analysis?.overall_match || 0) >= 60 ? 'text-accent-gold' : 'text-accent-magenta'
                  }`}>
                    {r.analysis?.overall_match || 0}%
                  </span>
                </motion.div>
              ))}
            </div>

            {results.length >= 3 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={refineStyle}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:shadow-xl hover:shadow-accent-cyan/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowRight size={18} />
                基于 {results.length} 次测试精调风格
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
