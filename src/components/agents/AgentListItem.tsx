import { Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Agent } from '@/lib/api'
import AgentAvatar from './AgentAvatar'

interface AgentListItemProps {
  agent: Agent
  selected: boolean
  onClick: () => void
}

export default function AgentListItem({ agent, selected, onClick }: AgentListItemProps) {
  const channelLabel = agent.channels.length > 0
    ? agent.channels.map((c) => c.name).join(', ')
    : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-l-2 border-blue-400 bg-secondary/80'
          : 'border-l-2 border-transparent hover:bg-secondary/50'
      )}
    >
      <AgentAvatar name={agent.name} avatarUrl={agent.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-white truncate">{agent.name}</div>
        <div className="text-xs text-muted-foreground">
          {agent.skillCount} skill{agent.skillCount !== 1 ? 's' : ''}
        </div>
        {channelLabel && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground/70 truncate">
            <Hash className="size-3 shrink-0" />
            <span className="truncate">{channelLabel}</span>
          </div>
        )}
      </div>
    </button>
  )
}
