import type { CronJob } from './api'

type Schedule = CronJob['schedule']
type State = CronJob['state']

// ── Human-readable schedule ──

export function formatSchedule(s: Schedule): string {
  if (s.kind === 'cron' && s.expr) return formatCronExpr(s.expr, s.tz)
  if (s.kind === 'at' && s.atMs) return `Once at ${new Date(s.atMs).toLocaleString()}`
  if (s.kind === 'every' && s.everyMs) return `Every ${formatMs(s.everyMs)}`
  return s.kind
}

function formatCronExpr(expr: string, tz?: string): string {
  const parts = expr.split(/\s+/)
  if (parts.length < 5) return expr

  const [min, hour, dom, mon, dow] = parts
  const tzLabel = tz ? ` (${tz.split('/').pop()?.replace(/_/g, ' ')})` : ''

  // Daily at HH:MM
  if (dom === '*' && mon === '*' && dow === '*' && isNum(hour) && isNum(min)) {
    return `Daily at ${fmtTime(+hour, +min)}${tzLabel}`
  }

  // Weekdays at HH:MM
  if (dom === '*' && mon === '*' && dow === '1-5' && isNum(hour) && isNum(min)) {
    return `Weekdays at ${fmtTime(+hour, +min)}${tzLabel}`
  }

  // Weekly on day at HH:MM
  if (dom === '*' && mon === '*' && isNum(dow) && isNum(hour) && isNum(min)) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][+dow] ?? `day ${dow}`
    return `${dayName}s at ${fmtTime(+hour, +min)}${tzLabel}`
  }

  // Multiple times per day on specific days (e.g., "0 10,14,17 * * 1-5")
  if (dom === '*' && mon === '*' && hour.includes(',') && isNum(min)) {
    const hours = hour.split(',').map((h) => fmtTime(+h, +min)).join(', ')
    const dayPart = dow === '*' ? 'Daily' : dow === '1-5' ? 'Weekdays' : `Days ${dow}`
    return `${dayPart} at ${hours}${tzLabel}`
  }

  // Hourly
  if (hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return isNum(min) ? `Hourly at :${min.padStart(2, '0')}` : `Every hour`
  }

  // Fallback
  return `Cron: ${expr}${tzLabel}`
}

function isNum(v: string): boolean {
  return /^\d+$/.test(v)
}

function fmtTime(h: number, m: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatMs(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} minutes`
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)} hours`
  return `${Math.round(ms / 86_400_000)} days`
}

// ── Frequency color (tailwind classes) ──

export function getFrequencyBadge(s: Schedule): { label: string; className: string } {
  if (s.kind === 'at') return { label: 'One-shot', className: 'bg-blue-500/15 text-blue-400' }

  if (s.kind === 'every' && s.everyMs) {
    if (s.everyMs < 600_000) return { label: 'High freq', className: 'bg-orange-500/15 text-orange-400' }
    if (s.everyMs < 3_600_000) return { label: 'Minutes', className: 'bg-orange-500/15 text-orange-400' }
    if (s.everyMs < 86_400_000) return { label: 'Hourly', className: 'bg-yellow-500/15 text-yellow-400' }
    return { label: 'Daily', className: 'bg-green-500/15 text-green-400' }
  }

  if (s.kind === 'cron' && s.expr) {
    const parts = s.expr.split(/\s+/)
    if (parts.length >= 5) {
      const [, hour, , , dow] = parts
      if (hour === '*') return { label: 'Hourly', className: 'bg-yellow-500/15 text-yellow-400' }
      if (hour.includes(',')) return { label: 'Multi-daily', className: 'bg-yellow-500/15 text-yellow-400' }
      if (dow !== '*') return { label: 'Weekly', className: 'bg-green-500/15 text-green-400' }
      return { label: 'Daily', className: 'bg-green-500/15 text-green-400' }
    }
  }

  return { label: 'Custom', className: 'bg-zinc-500/15 text-zinc-400' }
}

// ── Last run time ──

export function formatLastRun(state?: State): string {
  if (!state?.lastRunAtMs) return 'Never'
  return timeAgo(state.lastRunAtMs)
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

// ── Group key ──

export function getChannelKey(job: CronJob): string {
  if (job.payload.channel) return job.payload.channel
  if (job.payload.kind === 'systemEvent') return 'system'
  return 'other'
}

export function getChannelLabel(key: string): string {
  const labels: Record<string, string> = {
    telegram: 'Telegram',
    discord: 'Discord',
    whatsapp: 'WhatsApp',
    system: 'System Events',
    other: 'Other',
  }
  return labels[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}
