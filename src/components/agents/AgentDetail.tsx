import type { Agent } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import AgentAvatar from './AgentAvatar'
import AgentDetailTabs from './AgentDetailTabs'

interface AgentDetailProps {
  agent: Agent
}

function getModelLabel(model: string | null): string | null {
  if (!model) return null
  if (model.includes('opus')) return 'opus'
  if (model.includes('sonnet')) return 'sonnet'
  if (model.includes('haiku')) return 'haiku'
  const parts = model.split('/')
  return parts[parts.length - 1] ?? null
}

export default function AgentDetail({ agent }: AgentDetailProps) {
  const modelLabel = getModelLabel(agent.model)

  return (
    <div className="flex-1 overflow-y-auto rounded-xl bg-card p-6">
      {/* Agent Header */}
      <div className="flex items-start gap-4">
        <AgentAvatar name={agent.name} avatarUrl={agent.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-white">
            {agent.emoji && <span className="mr-2">{agent.emoji}</span>}
            {agent.name}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            {modelLabel && (
              <Badge variant="secondary" className="text-xs">
                {modelLabel}
              </Badge>
            )}
          </div>
          {agent.workspacePath && (
            <p className="mt-1 text-xs text-muted-foreground/60 font-mono truncate">
              {agent.workspacePath}
            </p>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <AgentDetailTabs agentId={agent.id} />
    </div>
  )
}
