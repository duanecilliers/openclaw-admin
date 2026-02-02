import type { Agent } from '@/lib/api'
import AgentListItem from './AgentListItem'

interface AgentSidebarProps {
  agents: Agent[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function AgentSidebar({ agents, selectedId, onSelect }: AgentSidebarProps) {
  return (
    <aside className="w-[280px] shrink-0 overflow-y-auto rounded-xl bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Agents
      </h3>
      <div className="space-y-1">
        {agents.map((agent) => (
          <AgentListItem
            key={agent.id}
            agent={agent}
            selected={agent.id === selectedId}
            onClick={() => onSelect(agent.id)}
          />
        ))}
      </div>
    </aside>
  )
}
