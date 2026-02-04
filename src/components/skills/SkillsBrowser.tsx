import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useSkills, useSkillInstall, useSkillRemove } from '@/hooks/useSkills'
import SkillsGrid from './SkillsGrid'

interface SkillsBrowserProps {
  agentId?: string
}

export default function SkillsBrowser({ agentId }: SkillsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: skills, isLoading, isError, error } = useSkills(agentId)
  const installMutation = agentId ? useSkillInstall(agentId) : null
  const removeMutation = agentId ? useSkillRemove(agentId) : null

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 flex-1 animate-pulse rounded-md bg-secondary/50" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-20 animate-pulse rounded bg-secondary/50" />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="h-16 animate-pulse rounded-lg bg-secondary/50" />
              <div className="h-16 animate-pulse rounded-lg bg-secondary/50" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load skills: {error?.message ?? 'Unknown error'}
        </p>
      </div>
    )
  }

  const skillList = skills ?? []
  const workspaceCount = skillList.filter((s) => s.source === 'workspace').length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skills…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground">
        {skillList.length} skill{skillList.length !== 1 ? 's' : ''} available
        {agentId && (
          <span>
            {' '}· <span className="text-green-400">{workspaceCount} installed</span> to agent
          </span>
        )}
        {searchQuery && (
          <span>
            {' '}· filtering by "<span className="text-white">{searchQuery}</span>"
          </span>
        )}
      </p>

      {/* Grid */}
      <SkillsGrid
        skills={skillList}
        searchQuery={searchQuery}
        agentId={agentId}
        onInstall={installMutation ? (name) => installMutation.mutate(name) : undefined}
        onRemove={removeMutation ? (name) => removeMutation.mutate(name) : undefined}
        isInstalling={installMutation?.isPending}
        isRemoving={removeMutation?.isPending}
      />
    </div>
  )
}
