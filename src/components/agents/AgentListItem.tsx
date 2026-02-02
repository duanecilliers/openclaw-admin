import { cn } from '@/lib/utils'
import type { Agent } from '@/lib/api'
import AgentAvatar from './AgentAvatar'

interface AgentListItemProps {
  agent: Agent
  selected: boolean
  onClick: () => void
}

export default function AgentListItem({ agent, selected, onClick }: AgentListItemProps) {
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
      <AgentAvatar name={agent.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-white truncate">{agent.name}</div>
        <div className="text-sm text-muted-foreground">
          {agent.skillCount} skill{agent.skillCount !== 1 ? 's' : ''}
        </div>
      </div>
    </button>
  )
}
