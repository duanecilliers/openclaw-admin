import { useState, useEffect } from 'react'
import { useAgents } from '@/hooks/useAgents'
import AgentSidebar from '@/components/agents/AgentSidebar'
import AgentDetail from '@/components/agents/AgentDetail'

export default function AgentsPage() {
  const { data: agents, isLoading, error } = useAgents()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Auto-select first agent on load
  useEffect(() => {
    if (agents?.length && !selectedId) {
      setSelectedId(agents[0].id)
    }
  }, [agents, selectedId])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading agents…</p>
      </div>
    )
  }

  if (error || !agents) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-destructive">
          Failed to load agents{error ? `: ${error.message}` : ''}
        </p>
      </div>
    )
  }

  const selectedAgent = agents.find((a) => a.id === selectedId)

  return (
    <div className="flex gap-4 py-4" style={{ height: 'calc(100vh - 120px)' }}>
      <AgentSidebar
        agents={agents}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      {selectedAgent ? (
        <AgentDetail agent={selectedAgent} />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">Select an agent</p>
        </div>
      )}
    </div>
  )
}
