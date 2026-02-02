import { useMemo } from 'react'
import { Send, MessageSquare, Hash, Cpu, HelpCircle } from 'lucide-react'
import type { CronJob } from '@/lib/api'
import { useCronJobs, useToggleCronJob, useDeleteCronJob, useRunCronJob } from '@/hooks/useCronJobs'
import { getChannelKey, getChannelLabel } from '@/lib/cron-utils'
import CronJobCard from './CronJobCard'

const channelIcons: Record<string, typeof Send> = {
  telegram: Send,
  discord: MessageSquare,
  whatsapp: Hash,
  system: Cpu,
}

export default function CronJobList() {
  const { data: jobs, isLoading, error } = useCronJobs()
  const toggleMut = useToggleCronJob()
  const deleteMut = useDeleteCronJob()
  const runMut = useRunCronJob()

  // Group jobs by channel
  const groups = useMemo(() => {
    if (!jobs?.length) return []
    const map = new Map<string, CronJob[]>()
    for (const job of jobs) {
      const key = getChannelKey(job)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(job)
    }
    // Sort groups: named channels first, then system/other
    return Array.from(map.entries()).sort(([a], [b]) => {
      const order: Record<string, number> = { telegram: 0, discord: 1, whatsapp: 2, system: 8, other: 9 }
      return (order[a] ?? 5) - (order[b] ?? 5)
    })
  }, [jobs])

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorState error={error} />
  if (!jobs?.length) return <EmptyState />

  return (
    <div className="space-y-6">
      {groups.map(([key, groupJobs]) => {
        const Icon = channelIcons[key] ?? HelpCircle
        return (
          <div key={key}>
            <div className="mb-3 flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                {getChannelLabel(key)}
              </h3>
              <span className="text-xs text-muted-foreground/60">
                ({groupJobs.length})
              </span>
            </div>
            <div className="grid gap-2">
              {groupJobs.map((job) => (
                <CronJobCard
                  key={job.id}
                  job={job}
                  onToggle={(id, enabled) => toggleMut.mutate({ id, enabled })}
                  onRun={(id) => runMut.mutate(id)}
                  onDelete={(id) => deleteMut.mutate(id)}
                  isRunning={runMut.isPending && runMut.variables === job.id}
                  isToggling={toggleMut.isPending && toggleMut.variables?.id === job.id}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-secondary/40" />
      ))}
    </div>
  )
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
      Failed to load cron jobs: {error.message}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/20 p-8 text-center">
      <Cpu className="mx-auto size-8 text-muted-foreground/40" />
      <p className="mt-2 text-sm text-muted-foreground">No cron jobs configured</p>
      <p className="mt-1 text-xs text-muted-foreground/60">
        Create jobs via the CLI: <code className="rounded bg-secondary px-1">openclaw cron add</code>
      </p>
    </div>
  )
}
