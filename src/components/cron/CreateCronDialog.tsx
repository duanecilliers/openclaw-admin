import { useState, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateCronJob } from '@/hooks/useCronJobs'

type ScheduleKind = 'cron' | 'every'
type PayloadKind = 'systemEvent' | 'agentTurn'

export default function CreateCronDialog() {
  const [open, setOpen] = useState(false)
  const createMut = useCreateCronJob()

  // Form state
  const [name, setName] = useState('')
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>('cron')
  const [cronExpr, setCronExpr] = useState('')
  const [cronTz, setCronTz] = useState('Africa/Johannesburg')
  const [everyMs, setEveryMs] = useState('')
  const [payloadKind, setPayloadKind] = useState<PayloadKind>('systemEvent')
  const [payloadText, setPayloadText] = useState('')

  const resetForm = useCallback(() => {
    setName('')
    setScheduleKind('cron')
    setCronExpr('')
    setCronTz('Africa/Johannesburg')
    setEveryMs('')
    setPayloadKind('systemEvent')
    setPayloadText('')
    createMut.reset()
  }, [createMut])

  const canSubmit =
    payloadText.trim().length > 0 &&
    (scheduleKind === 'cron' ? cronExpr.trim().length > 0 : Number(everyMs) > 0)

  const handleCreate = useCallback(() => {
    if (!canSubmit) return

    const schedule =
      scheduleKind === 'cron'
        ? { kind: 'cron' as const, expr: cronExpr.trim(), tz: cronTz || undefined }
        : { kind: 'every' as const, everyMs: Number(everyMs) }

    const sessionTarget = payloadKind === 'systemEvent' ? 'main' : 'isolated'
    const payload =
      payloadKind === 'systemEvent'
        ? { kind: 'systemEvent' as const, text: payloadText.trim() }
        : { kind: 'agentTurn' as const, message: payloadText.trim() }

    createMut.mutate(
      { name: name.trim() || undefined, schedule, payload, sessionTarget, enabled: true },
      {
        onSuccess: () => {
          resetForm()
          setOpen(false)
        },
      }
    )
  }, [canSubmit, scheduleKind, cronExpr, cronTz, everyMs, payloadKind, payloadText, name, createMut, resetForm])

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Create Cron Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name (optional)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My scheduled task"
              className="mt-1 bg-secondary/50"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Schedule</label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setScheduleKind('cron')}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  scheduleKind === 'cron'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                Cron Expression
              </button>
              <button
                onClick={() => setScheduleKind('every')}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  scheduleKind === 'every'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                Interval
              </button>
            </div>

            {scheduleKind === 'cron' ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <Input
                    value={cronExpr}
                    onChange={(e) => setCronExpr(e.target.value)}
                    placeholder="0 9 * * *"
                    className="bg-secondary/50 font-mono text-sm"
                  />
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">min hour day month weekday</p>
                </div>
                <Input
                  value={cronTz}
                  onChange={(e) => setCronTz(e.target.value)}
                  placeholder="Timezone"
                  className="bg-secondary/50 text-sm"
                />
              </div>
            ) : (
              <div className="mt-2">
                <Input
                  type="number"
                  value={everyMs}
                  onChange={(e) => setEveryMs(e.target.value)}
                  placeholder="Interval in milliseconds"
                  className="bg-secondary/50 text-sm"
                />
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  {Number(everyMs) > 0 ? `≈ ${Math.round(Number(everyMs) / 60000)} min` : 'e.g. 1800000 = 30 min'}
                </p>
              </div>
            )}
          </div>

          {/* Payload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payload Type</label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setPayloadKind('systemEvent')}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  payloadKind === 'systemEvent'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                System Event (main)
              </button>
              <button
                onClick={() => setPayloadKind('agentTurn')}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  payloadKind === 'agentTurn'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                Agent Turn (isolated)
              </button>
            </div>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              placeholder={payloadKind === 'systemEvent' ? 'System event text…' : 'Agent prompt message…'}
              className="mt-2 w-full min-h-[80px] resize-y rounded-lg border border-border/50 bg-secondary/50 p-3 text-sm font-mono text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              spellCheck={false}
            />
          </div>

          {/* Error */}
          {createMut.isError && (
            <p className="text-xs text-destructive">
              Failed: {createMut.error?.message ?? 'Unknown error'}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!canSubmit || createMut.isPending}
              className="gap-1.5"
            >
              {createMut.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Create Job
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
