import { Key } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import type { Skill } from '@/lib/api'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

interface SkillCardProps {
  skill: Skill
}

export default function SkillCard({ skill }: SkillCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60">
      {/* Text content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{skill.name}</span>
          {skill.hasConfig && (
            <span className="inline-flex items-center gap-0.5 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
              <Key className="size-2.5" />
              API
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {truncate(skill.description, 80) || 'No description'}
        </p>
      </div>

      {/* Toggle — non-functional placeholder for v2 */}
      <Switch size="sm" disabled className="mt-0.5 shrink-0 opacity-40" />
    </div>
  )
}
