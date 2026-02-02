import { useState } from 'react'
import { Play, Trash2, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { CronJob } from '@/lib/api'
import { formatSchedule, getFrequencyBadge, formatLastRun } from '@/lib/cron-utils'

interface CronJobCardProps {
  job: CronJob
  onToggle: (id: string, enabled: boolean) => void
  onRun: (id: string) => void
  onDelete: (id: string) => void
  isRunning?: boolean
  isToggling?: boolean
}

export default function CronJobCard({ job, onToggle, onRun, onDelete, isRunning, isToggling }: CronJobCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const freq = getFrequencyBadge(job.schedule)
  const lastRun = formatLastRun(job.state)
  const statusOk = job.state?.lastStatus === 'ok'
  const hasRun = !!job.state?.lastRunAtMs

  return (
    <div className={`flex flex-col gap-3 rounded-lg border border-border/40 bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60 ${!job.enabled ? 'opacity-60' : ''}`}>
      {/* Top row: name + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">
              {job.name || job.id.slice(0, 8)}
            </span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${freq.className}`}>
              {freq.label}
            </span>
            {!job.enabled && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                Paused
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatSchedule(job.schedule)}
          </p>
        </div>

        {/* Toggle switch */}
        <Switch
          size="sm"
          checked={job.enabled}
          disabled={isToggling}
          onCheckedChange={(checked) => onToggle(job.id, checked)}
          className="mt-0.5 shrink-0"
        />
      </div>

      {/* Bottom row: status + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {hasRun ? (
            <>
              <span className={`inline-block size-1.5 rounded-full ${statusOk ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>{statusOk ? 'OK' : 'Error'}</span>
              <span className="text-border">·</span>
              <span>{lastRun}</span>
            </>
          ) : (
            <span>Never run</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Run now */}
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={isRunning}
            onClick={() => onRun(job.id)}
            title="Run now"
          >
            {isRunning ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="size-3" />
            )}
          </Button>

          {/* Delete with confirmation */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-xs" title="Delete job">
                <Trash2 className="size-3 text-red-400" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete cron job?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove <strong>{job.name || job.id.slice(0, 8)}</strong> from
                  your scheduled jobs. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    onDelete(job.id)
                    setDeleteOpen(false)
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
