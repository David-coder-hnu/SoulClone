import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, Send, User, Bot, CheckCircle, RefreshCw, Sparkles, ArrowRight, Beaker, History, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'


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

interface CalibrationHistory {
  tests: Array<{ id: string; scenario: string; overall_match: number; created_at: string }>
  refinements: Array<{ id: string; version: number; confidence: number; changes_count: number; created_at: string }>
}

export default function CalibrationPage() {
  const [scenario, setScenario] = useState('')
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [userResponse, setUserResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [currentAnalysis, setCurrentAnalysis] = useState<TestResult['analysis']>(null)
  const [refinementResult, setRefinementResult] = useState<{
    confidence: number
    changes_made: string[]
    new_version: number
  } | null>(null)
  const [history, setHistory] = useState<CalibrationHistory | null>(null)
  const [showHistory, setShowHistory] = useState(false)

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
      setRefinementResult({
        confidence: res.data.confidence,
        changes_made: res.data.changes_made || [],
        new_version: res.data.new_version,
      })
      fetchHistory()
    } catch (err: any) {
      console.error('Refine failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await api.get('/calibration/history')
      setHistory(res.data)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-accent-magenta'
      case 'medium': return 'text-accent-gold'
      default: return 'text-accent-cyan'
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden bg-background">
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-cyan/3 rounded-full blur-[120px] pointer-events-none" />

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
          <h1 className="font-sans text-3xl md:text-4xl font-bold mb-2">让你的回复更自然</h1>
          <p className="text-text-secondary max-w-md mx-auto">
            测试在线状态的回复风格，提供真实回复作为对比，系统会学习差异并自动优化
          </p>
        </motion.div>

        {/* Scenario Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-500 border border-white/[0.06] rounded-3xl p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-3 text-text-secondary">输入一个对话场景</label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="例如：对方说：今天好累啊，想你了"
            className="w-full h-24 px-4 py-3 rounded-xl bg-bg-500 border border-white/[0.08] text-text-primary placeholder-text-placeholder focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_16px_rgba(0,240,255,0.4)] focus:bg-[rgba(24,24,32,0.6)] transition-all duration-200 ease-liquid resize-none mb-3"
          />

          <div className="flex flex-wrap gap-2 mb-4">
            {sampleScenarios.map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScenario(s)}
                className="px-3 py-1.5 rounded-lg bg-bg-500 border border-white/[0.08] text-xs text-text-secondary hover:border-accent-cyan/30 hover:text-accent-cyan transition-colors duration-150"
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
            className="w-full h-12 rounded-full bg-gradient-to-r from-accent-gold to-accent-magenta text-white font-semibold transition-all duration-150 ease-spring hover:shadow-lg hover:shadow-accent-gold/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-gold-md hover:glow-gold-lg"
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
              className="bg-bg-500 border border-white/[0.06] rounded-3xl p-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent-magenta/10 flex items-center justify-center">
                  <Bot size={16} className="text-accent-magenta" />
                </div>
                <span className="font-medium text-accent-magenta">系统生成的回复</span>
              </div>
              <div className="p-4 rounded-xl bg-bg-500 border border-accent-magenta/15 text-text-primary leading-relaxed">
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
              className="bg-bg-500 border border-white/[0.06] rounded-3xl p-6 mb-6"
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
                className="w-full h-24 px-4 py-3 rounded-xl bg-bg-500 border border-white/[0.08] text-text-primary placeholder-text-placeholder focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_16px_rgba(0,240,255,0.4)] focus:bg-[rgba(24,24,32,0.6)] transition-all duration-200 ease-liquid resize-none mb-4"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitFeedback}
                disabled={!userResponse.trim() || isAnalyzing}
                className="w-full h-10 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 font-medium transition-all duration-150 ease-spring hover:bg-cyan-500/20 hover:shadow-[0_0_16px_rgba(0,240,255,0.3)] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="bg-bg-500 border border-white/[0.06] rounded-3xl p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FlaskConical size={18} className="text-accent-gold" />
                  <span className="font-medium">风格差异分析</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary text-sm">匹配度</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`font-sans text-xl font-bold ${
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
                      className="p-3 rounded-xl bg-bg-500 border border-white/[0.04]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{gap.dimension}</span>
                        <span className={`text-xs font-medium ${getSeverityColor(gap.severity)}`}>
                          {gap.severity === 'high' ? '严重' : gap.severity === 'medium' ? '中等' : '轻微'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-text-tertiary">
                          <span className="text-accent-magenta">系统: </span>
                          {gap.clone_behavior}
                        </div>
                        <div className="text-text-tertiary">
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
        {/* Refinement Result */}
        <AnimatePresence>
          {refinementResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-bg-500 border border-white/[0.06] rounded-3xl p-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-accent-cyan" />
                <span className="font-medium">精调完成</span>
                <span className="text-text-ghost text-sm ml-auto">版本 v{refinementResult.new_version}</span>
              </div>
              <p className="text-text-secondary text-sm mb-3">
                信心度: <span className="text-accent-cyan font-bold">{refinementResult.confidence}%</span>
                ，共 {refinementResult.changes_made.length} 项修改
              </p>
              <div className="space-y-2">
                {refinementResult.changes_made.map((change, i) => (
                  <div key={i} className="text-sm text-text-secondary p-2 rounded-lg bg-bg-600">
                    · {change}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-bg-500 border border-white/[0.06] rounded-3xl p-6 mb-6"
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <History size={16} className="text-text-secondary" />
              <span className="font-medium">校准历史</span>
            </div>
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {showHistory && history && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Tests */}
                {history.tests.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-text-ghost mb-2">测试记录</p>
                    <div className="space-y-2">
                      {history.tests.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-bg-600 text-sm">
                          <span className="text-text-secondary truncate max-w-[200px]">{t.scenario}</span>
                          <span className={`font-medium ${t.overall_match >= 80 ? 'text-accent-cyan' : t.overall_match >= 60 ? 'text-accent-gold' : 'text-accent-magenta'}`}>
                            {t.overall_match}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Refinements */}
                {history.refinements.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-text-ghost mb-2">精调版本</p>
                    <div className="space-y-2">
                      {history.refinements.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-bg-600 text-sm">
                          <span className="text-text-secondary">版本 v{r.version}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-text-ghost">{r.changes_count} 项修改</span>
                            <span className="text-accent-cyan font-medium">{r.confidence}% 信心</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Current Session Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-bg-500 border border-white/[0.06] rounded-3xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">本次测试 ({results.length})</span>
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
                  className="flex items-center justify-between p-3 rounded-xl bg-bg-500 border border-white/[0.04]"
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
                className="w-full h-12 rounded-full bg-gradient-to-r from-accent-gold to-accent-magenta text-white font-semibold transition-all duration-150 ease-spring hover:shadow-lg hover:shadow-accent-gold/30 disabled:opacity-50 flex items-center justify-center gap-2 glow-gold-md hover:glow-gold-lg"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                基于 {results.length} 次测试精调风格
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
