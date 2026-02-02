import type { Agent } from '@/lib/api'
import AgentAvatar from './AgentAvatar'
import AgentDetailTabs from './AgentDetailTabs'

interface AgentDetailProps {
  agent: Agent
}

export default function AgentDetail({ agent }: AgentDetailProps) {
  return (
    <div className="flex-1 overflow-y-auto rounded-xl bg-card p-6">
      {/* Agent Header */}
      <div className="flex items-start gap-4">
        <AgentAvatar name={agent.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {agent.description}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <AgentDetailTabs />
    </div>
  )
}
