import { Key, Download, Trash2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Skill } from '@/lib/api'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

const SOURCE_STYLES = {
  bundled: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  shared: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  workspace: 'bg-green-500/15 text-green-400 border-green-500/30',
}

const SOURCE_LABELS = {
  bundled: 'Bundled',
  shared: 'Shared',
  workspace: 'Agent',
}

interface SkillCardProps {
  skill: Skill
  agentId?: string
  onInstall?: (skillName: string) => void
  onRemove?: (skillName: string) => void
  isInstalling?: boolean
  isRemoving?: boolean
}

export default function SkillCard({
  skill,
  agentId,
  onInstall,
  onRemove,
  isInstalling,
  isRemoving,
}: SkillCardProps) {
  const canInstall = agentId && skill.source !== 'workspace' && onInstall
  const canRemove = agentId && skill.source === 'workspace' && onRemove

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
          <Badge
            variant="outline"
            className={`px-1.5 py-0 text-[10px] leading-4 ${SOURCE_STYLES[skill.source]}`}
          >
            {SOURCE_LABELS[skill.source]}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {truncate(skill.description, 80) || 'No description'}
        </p>
      </div>

      {/* Action button */}
      {canInstall && (
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0 size-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          onClick={() => onInstall(skill.name)}
          disabled={isInstalling}
          title="Install to agent workspace"
        >
          {isInstalling ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
        </Button>
      )}
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0 size-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => onRemove(skill.name)}
          disabled={isRemoving}
          title="Remove from agent workspace"
        >
          {isRemoving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      )}
    </div>
  )
}
