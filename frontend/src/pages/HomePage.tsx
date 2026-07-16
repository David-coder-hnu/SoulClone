import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Bot,
  ChevronRight,
  CirclePause,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import AmbientBackground from '@/components/shared/AmbientBackground'
import HandoverCeremony from '@/components/shared/HandoverCeremony'
import { ErrorState } from '@/components/shared/DataStates'
import { useSoundSettings } from '@/components/shared/SoundProvider'
import { useAuthStore } from '@/stores/authStore'
import { useCloneStats } from '@/hooks/useCloneStats'
import { useConversations, type Conversation } from '@/hooks/useConversations'
import {
  useConversationControl,
  useReleaseConversation,
  useTakeoverConversation,
} from '@/hooks/useConversationControl'
import { useDailyBrief } from '@/hooks/useDailyBrief'
import { useNotifications } from '@/hooks/useNotifications'
import { useToggleActive } from '@/hooks/useToggleActive'
import { playSound } from '@/lib/sound'

const stageLabel: Record<Conversation['relationshipStage'], string> = {
  stranger: '刚刚认识',
  acquaintance: '正在了解',
  friend: '稳定交流',
  close: '关系深入',
  intimate: '深度连接',
}

function isHandoverReady(conversation: Conversation) {
  return conversation.status === 'active'
    && (conversation.intimacy >= 70 || ['close', 'intimate'].includes(conversation.relationshipStage))
}

function selectTopConversation(conversations: Conversation[], readyOnly: boolean) {
  return [...conversations]
    .filter((conversation) => conversation.status === 'active')
    .filter((conversation) => !readyOnly || isHandoverReady(conversation))
    .sort((a, b) => {
      if (b.intimacy !== a.intimacy) return b.intimacy - a.intimacy
      if (b.unread !== a.unread) return b.unread - a.unread
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    })[0]
}

function errorMessage(error: unknown, fallback: string) {
  const apiError = error as { response?: { data?: { detail?: string } }; message?: string }
  return apiError.response?.data?.detail || apiError.message || fallback
}

export default function HomePage() {
  const { user } = useAuthStore()
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundSettings()
  const navigate = useNavigate()
  const cloneQuery = useCloneStats()
  const conversationsQuery = useConversations()
  const notifications = useNotifications()
  const toggleActive = useToggleActive()
  const takeover = useTakeoverConversation()
  const release = useReleaseConversation()
  const [handoverTarget, setHandoverTarget] = useState<Conversation | null>(null)
  const [statusAnnouncement, setStatusAnnouncement] = useState('')

  const candidate = useMemo(
    () => selectTopConversation(conversationsQuery.data || [], true),
    [conversationsQuery.data]
  )
  const developingRelationship = useMemo(
    () => selectTopConversation(conversationsQuery.data || [], false),
    [conversationsQuery.data]
  )
  const controlQuery = useConversationControl(candidate?.id)

  const stats = cloneQuery.data
  const cloneIsActive = stats?.status === 'active'
  const unreadCount = notifications.unreadCount
  const controlMode = controlQuery.data?.mode
  const handleCloneActivity = () => {
    if (!stats || toggleActive.isPending) return
    const nextActive = !cloneIsActive
    setStatusAnnouncement('')
    toggleActive.mutate(nextActive, {
      onSuccess: () => {
        setStatusAnnouncement(
          nextActive
            ? '孪生已开始寻找新的连接。'
            : '孪生已暂停寻找。已有的真人接管关系不会改变。'
        )
        if (nextActive) playSound('toggle-on')
      },
    })
  }

  const handleTakeover = () => {
    if (!candidate || takeover.isPending) return
    setStatusAnnouncement('')
    takeover.mutate(candidate.id, {
      onSuccess: () => {
        setStatusAnnouncement(`你已接管与${candidate.partner.nickname}的对话，孪生已退出这段关系。`)
        setHandoverTarget(candidate)
      },
    })
  }

  const handleUndoTakeover = () => {
    if (!handoverTarget || release.isPending) return
    release.mutate(handoverTarget.id, {
      onSuccess: () => {
        setStatusAnnouncement(`已撤销接管，孪生将在冷却结束后重新协助与${handoverTarget.partner.nickname}的对话。`)
        setHandoverTarget(null)
      },
    })
  }

  const handleReleaseCandidate = () => {
    if (!candidate || release.isPending) return
    release.mutate(candidate.id, {
      onSuccess: () => {
        setStatusAnnouncement(`已将与${candidate.partner.nickname}的对话交还孪生。30 秒冷却结束后，它才会重新回复。`)
      },
    })
  }

  return (
    <AppShell>
      <AmbientBackground variant="home" intensity="subtle" particles={false} mesh={false}>
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {statusAnnouncement}
          </p>

          <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-accent-cyan">今天值得你关注的关系</p>
              <h1 className="font-heading text-2xl text-text-primary sm:text-3xl">
                你好，{user?.nickname || '探索者'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
                孪生负责穿过噪声。真正值得投入的人，会留在这里等你亲自出现。
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto" aria-label="首页快捷设置">
              <button
                type="button"
                onClick={() => {
                  toggleSound()
                  setStatusAnnouncement(soundEnabled ? '界面声音已关闭。' : '界面声音已开启。')
                }}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? '关闭界面声音' : '开启界面声音'}
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-bg-600 text-text-secondary transition-colors hover:border-white/15 hover:text-text-primary"
              >
                {soundEnabled ? <Volume2 size={19} aria-hidden="true" /> : <VolumeX size={19} aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                aria-label={
                  notifications.unreadCountError
                    ? '查看通知，未读数量暂时无法获取'
                    : unreadCount > 0
                      ? `查看通知，${unreadCount} 条未读`
                      : '查看通知，没有未读消息'
                }
                className="focus-ring relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-bg-600 text-text-secondary transition-colors hover:border-white/15 hover:text-text-primary"
              >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && !notifications.unreadCountError && (
                  <>
                    <span className="absolute right-1.5 top-1.5 h-2.5 min-w-2.5 rounded-full bg-accent-magenta" aria-hidden="true" />
                    <span className="sr-only">{unreadCount} 条未读通知</span>
                  </>
                )}
                {notifications.unreadCountError && (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-background bg-warning" aria-hidden="true" />
                )}
              </button>
            </div>
          </header>

          {cloneQuery.isLoading ? (
            <StatusSkeleton />
          ) : cloneQuery.isError ? (
            <section className="mb-8" aria-label="孪生状态加载失败">
              <ErrorState message="暂时无法确认孪生是否正在寻找，请重试。" onRetry={() => cloneQuery.refetch()} />
            </section>
          ) : stats === null ? (
            <CreateCloneSection onCreate={() => navigate('/onboarding')} />
          ) : (
            <section className="mb-8" aria-labelledby="search-status-title">
              <div className="flex flex-col gap-5 border-y border-white/[0.06] py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cloneIsActive ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-bg-600 text-text-secondary'}`}>
                    {cloneIsActive ? <Bot size={21} aria-hidden="true" /> : <CirclePause size={21} aria-hidden="true" />}
                  </div>
                  <div className="min-w-0">
                    <h2 id="search-status-title" className="text-base font-medium text-text-primary">
                      {cloneIsActive ? '孪生正在寻找新的连接' : '孪生已暂停寻找'}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      {cloneIsActive
                        ? '它只负责初步了解和过滤噪声，不会替你维持已经值得投入的关系。'
                        : '暂停只影响新的自动行动，不会改变已经由你本人接管的对话。'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={cloneIsActive ? 'ghost' : 'primary'}
                  size="md"
                  aria-pressed={cloneIsActive}
                  aria-label={cloneIsActive ? '暂停孪生寻找新的连接' : '让孪生开始寻找新的连接'}
                  onClick={handleCloneActivity}
                  disabled={toggleActive.isPending}
                  className="min-h-11 w-full shrink-0 sm:w-auto"
                >
                  {toggleActive.isPending
                    ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    : cloneIsActive
                      ? <Pause size={16} aria-hidden="true" />
                      : <Play size={16} aria-hidden="true" />}
                  {toggleActive.isPending ? '正在同步…' : cloneIsActive ? '暂停寻找' : '开始寻找'}
                </Button>
              </div>
              {toggleActive.isError && (
                <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/25 bg-error/[0.06] px-4 py-3 text-sm text-text-primary">
                  <span>{errorMessage(toggleActive.error, '状态同步失败，孪生状态没有改变。')}</span>
                  <button type="button" onClick={handleCloneActivity} className="focus-ring min-h-11 rounded-lg px-3 text-error hover:bg-error/10">
                    重试
                  </button>
                </div>
              )}
            </section>
          )}

          {stats && !cloneQuery.isError && (
            <section className="mb-9" aria-labelledby="handover-candidate-title">
              <div className="mb-4">
                <h2 id="handover-candidate-title" className="font-heading text-xl text-text-primary sm:text-2xl">
                  值得你亲自看一眼
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  这里只出现达到关系深度阈值的真实对话。系统提供依据，决定始终由你作出。
                </p>
              </div>

              {conversationsQuery.isLoading ? (
                <CandidateSkeleton />
              ) : conversationsQuery.isError ? (
                <ErrorState message="暂时无法读取关系，请重试。" onRetry={() => conversationsQuery.refetch()} />
              ) : candidate ? (
                <CandidatePanel
                  candidate={candidate}
                  controlMode={controlMode}
                  controlLoading={controlQuery.isLoading}
                  controlError={controlQuery.error}
                  takeoverPending={takeover.isPending}
                  takeoverError={takeover.error}
                  releasePending={release.isPending}
                  releaseError={release.error}
                  onRetryControl={() => controlQuery.refetch()}
                  onTakeover={handleTakeover}
                  onRelease={handleReleaseCandidate}
                  onContinue={() => navigate(`/chat/${candidate.id}`)}
                />
              ) : (
                <DevelopingRelationshipPanel relationship={developingRelationship} />
              )}
            </section>
          )}

          {stats && <ActivityDetails stats={stats} />}
          {stats && <DailyBriefSection />}
        </div>
      </AmbientBackground>

      {handoverTarget && (
        <HandoverCeremony
          visible
          partnerName={handoverTarget.partner.nickname}
          partnerAvatar={handoverTarget.partner.avatar}
          userName={user?.nickname || '你'}
          userAvatar={user?.avatar_url}
          twinName={stats?.name || '你的孪生'}
          intimacy={handoverTarget.intimacy}
          contextSummary={handoverTarget.last_message}
          undoPending={release.isPending}
          undoError={release.isError ? errorMessage(release.error, '撤销失败，这段关系仍由你本人控制。') : undefined}
          onClose={() => setHandoverTarget(null)}
          onContinue={() => navigate(`/chat/${handoverTarget.id}`)}
          onUndo={handleUndoTakeover}
        />
      )}
    </AppShell>
  )
}

function CandidatePanel({
  candidate,
  controlMode,
  controlLoading,
  controlError,
  takeoverPending,
  takeoverError,
  releasePending,
  releaseError,
  onRetryControl,
  onTakeover,
  onRelease,
  onContinue,
}: {
  candidate: Conversation
  controlMode?: string
  controlLoading: boolean
  controlError: unknown
  takeoverPending: boolean
  takeoverError: unknown
  releasePending: boolean
  releaseError: unknown
  onRetryControl: () => void
  onTakeover: () => void
  onRelease: () => void
  onContinue: () => void
}) {
  const humanHasControl = controlMode === 'human_active'
  const protectedState = controlMode === 'blocked'
  const pausedState = controlMode === 'paused'

  return (
    <Card variant="flat" hoverable={false} className="border-accent-gold/20 p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              src={candidate.partner.avatar || undefined}
              alt={candidate.partner.nickname}
              fallback={<UserRound size={19} aria-hidden="true" />}
              size="lg"
              ring={humanHasControl ? 'gold' : 'cyan'}
              status={candidate.partner.is_online ? 'online' : 'offline'}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-medium text-text-primary">{candidate.partner.nickname}</h3>
                <Badge variant={humanHasControl ? 'gold' : 'cyan'} size="sm">
                  {humanHasControl ? '已由本人接管' : stageLabel[candidate.relationshipStage]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                关系深度 {candidate.intimacy}/100
                {candidate.unread > 0 ? ` · ${candidate.unread} 条消息等待你查看` : ' · 暂无未读压力'}
              </p>
            </div>
          </div>

          <div className="mt-5 max-w-2xl border-l border-white/10 pl-4">
            <p className="text-sm font-medium text-text-primary">
              {candidate.relationshipStage === 'intimate'
                ? '这段关系已经进入深度连接阶段。'
                : '这段关系的交流深度已经超过接管阈值。'}
            </p>
            <p className="mt-2 line-clamp-2 [overflow-wrap:anywhere] text-sm leading-relaxed text-text-secondary">
              {candidate.last_message || '暂无可展示的最近消息。进入对话后，你可以查看完整上下文。'}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              提醒依据只有关系阶段与对话深度，不代表系统替你判断感情。
            </p>
          </div>

          {Boolean(controlError) && (
            <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-error">
              <span>无法确认当前由谁回应这段关系。</span>
              <button type="button" onClick={onRetryControl} className="focus-ring min-h-11 rounded-lg px-3 hover:bg-error/10">
                重试
              </button>
            </div>
          )}
          {Boolean(takeoverError) && (
            <p role="alert" className="mt-4 text-sm text-error">
              {errorMessage(takeoverError, '接管失败，这段关系仍由原状态继续。请重试。')}
            </p>
          )}
          {Boolean(releaseError) && humanHasControl && (
            <p role="alert" className="mt-4 text-sm text-error">
              {errorMessage(releaseError, '撤销接管失败，这段关系仍由你本人控制。请重试。')}
            </p>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 lg:w-48">
          {controlLoading ? (
            <Button variant="ghost" disabled className="min-h-11 w-full">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              确认控制权…
            </Button>
          ) : protectedState ? (
            <>
              <div className="rounded-xl border border-warning/25 bg-warning/[0.06] p-3 text-sm text-text-primary">
                <div className="flex items-center gap-2 font-medium text-warning">
                  <ShieldCheck size={16} aria-hidden="true" />
                  系统已保护性停止
                </div>
                <p className="mt-1 text-text-secondary">请进入对话查看原因。</p>
              </div>
              <Button variant="ghost" onClick={onContinue} className="min-h-11 w-full">
                查看受保护的对话
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </>
          ) : pausedState ? (
            <Button variant="ghost" onClick={onContinue} className="min-h-11 w-full">
              查看已暂停的对话
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          ) : humanHasControl ? (
            <>
              <Button variant="gold" onClick={onContinue} className="min-h-11 w-full">
                <MessageCircle size={17} aria-hidden="true" />
                继续本人对话
              </Button>
              <button
                type="button"
                onClick={onRelease}
                disabled={releasePending}
                className="focus-ring min-h-11 rounded-xl px-4 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {releasePending ? '正在交还…' : '撤销接管，交还孪生'}
              </button>
            </>
          ) : (
            <Button variant="gold" onClick={onTakeover} disabled={takeoverPending || Boolean(controlError)} className="min-h-11 w-full">
              {takeoverPending
                ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                : <UserRound size={17} aria-hidden="true" />}
              {takeoverPending ? '正在接管…' : '本人接管'}
            </Button>
          )}
          {!humanHasControl && !protectedState && !pausedState && (
            <Link to={`/chat/${candidate.id}`} className="focus-ring flex min-h-11 items-center justify-center rounded-xl px-4 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary">
              先查看完整对话
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}

function DevelopingRelationshipPanel({ relationship }: { relationship?: Conversation }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-bg-500 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-cyan/[0.08] text-accent-cyan">
          <Bot size={21} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium text-text-primary">还没有需要你接管的关系</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary">
            孪生会继续完成初步了解。只有关系阶段和对话深度达到阈值时，这里才会出现具体的人。
          </p>
          {relationship && (
            <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-sm text-text-secondary">
                当前最深入的是 <span className="font-medium text-text-primary">{relationship.partner.nickname}</span>
                ，关系深度 {relationship.intimacy}/100，仍在{stageLabel[relationship.relationshipStage]}。
              </p>
              <Link to={`/chat/${relationship.id}`} className="focus-ring flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm text-accent-cyan hover:bg-accent-cyan/[0.06]">
                查看对话
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateCloneSection({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="mb-9" aria-labelledby="create-clone-title">
      <Card variant="flat" hoverable={false} className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
              <Plus size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 id="create-clone-title" className="text-lg font-medium text-text-primary">先让孪生学会识别你的选择</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-secondary">
                完成人格蒸馏后，它会替你过滤初识噪声；遇到值得投入的人，再把关系交回给你。
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={onCreate} className="min-h-11 w-full shrink-0 sm:w-auto">
            创建孪生
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </Card>
    </section>
  )
}

function ActivityDetails({ stats }: { stats: NonNullable<ReturnType<typeof useCloneStats>['data']> }) {
  const items = [
    ['今日回复', stats.total_messages_sent || 0],
    ['匹配记录', stats.total_matches || 0],
    ['正在了解', stats.total_conversations || 0],
    ['社区互动', (stats.total_posts || 0) + (stats.total_comments || 0)],
  ]

  return (
    <details className="group mb-9 border-y border-white/[0.06] py-1">
      <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-1 text-sm text-text-secondary transition-colors hover:text-text-primary [&::-webkit-details-marker]:hidden">
        <span>查看今日运行概览</span>
        <ChevronRight size={16} className="transition-transform group-open:rotate-90" aria-hidden="true" />
      </summary>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={String(label)} className="bg-bg-500 p-4">
            <p className="font-mono text-xl font-semibold text-text-primary">{value}</p>
            <p className="mt-1 text-sm text-text-secondary">{label}</p>
          </div>
        ))}
      </div>
    </details>
  )
}

function DailyBriefSection() {
  const briefQuery = useDailyBrief()

  return (
    <section className="mb-5" aria-labelledby="daily-brief-title">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 id="daily-brief-title" className="font-heading text-xl text-text-primary">今天发生了什么</h2>
          <p className="mt-1 text-sm text-text-secondary">只保留可能影响你判断的上下文。</p>
        </div>
        <Link to="/chat" className="focus-ring flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm text-accent-cyan hover:bg-accent-cyan/[0.06]">
          全部关系
        </Link>
      </div>

      {briefQuery.isLoading ? (
        <div className="space-y-3" aria-label="正在加载今日简报">
          <div className="h-4 w-full animate-pulse rounded bg-white/5" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-white/5" />
        </div>
      ) : briefQuery.isError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-error/20 bg-error/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-primary">今日简报暂时无法生成，你的关系和消息没有丢失。</p>
          <button type="button" onClick={() => briefQuery.refetch()} className="focus-ring min-h-11 rounded-lg px-3 text-sm text-error hover:bg-error/10">
            重新生成
          </button>
        </div>
      ) : briefQuery.data?.brief ? (
        <p className="max-w-3xl [overflow-wrap:anywhere] text-base leading-relaxed text-text-secondary">
          {briefQuery.data.brief}
        </p>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-bg-500 p-4">
          <MessageCircle size={19} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-text-primary">今天还没有需要你处理的变化</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {briefQuery.data?.message || '孪生仍在完成初步了解。出现值得关注的人时，这里会告诉你原因。'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function StatusSkeleton() {
  return (
    <div className="mb-8 flex animate-pulse items-center gap-4 border-y border-white/[0.06] py-5" aria-label="正在确认孪生状态">
      <div className="h-11 w-11 rounded-xl bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-white/5" />
        <div className="h-3 w-full max-w-md rounded bg-white/[0.03]" />
      </div>
    </div>
  )
}

function CandidateSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.06] bg-bg-500 p-5 sm:p-6" aria-label="正在检查值得关注的关系">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/5" />
          <div className="h-3 w-52 max-w-full rounded bg-white/[0.03]" />
        </div>
      </div>
      <div className="mt-5 h-16 rounded-xl bg-white/[0.03]" />
    </div>
  )
}
