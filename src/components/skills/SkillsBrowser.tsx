import { useState } from 'react'
import { Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSkills } from '@/hooks/useSkills'
import SkillsGrid from './SkillsGrid'

export default function SkillsBrowser() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: skills, isLoading, isError, error } = useSkills()

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 flex-1 animate-pulse rounded-md bg-secondary/50" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-secondary/50" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-secondary/50" />
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

  return (
    <div className="space-y-4">
      {/* Toolbar: search + action buttons */}
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
        <Button
          variant="outline"
          size="sm"
          disabled
          className="gap-1.5 border-green-500/30 text-green-400 opacity-50"
        >
          <ToggleRight className="size-3.5" />
          Enable All
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="gap-1.5 border-red-500/30 text-red-400 opacity-50"
        >
          <ToggleLeft className="size-3.5" />
          Disable All
        </Button>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground">
        {skillList.length} skill{skillList.length !== 1 ? 's' : ''} installed
        {searchQuery && (
          <span>
            {' '}· filtering by "<span className="text-white">{searchQuery}</span>"
          </span>
        )}
      </p>

      {/* Grid */}
      <SkillsGrid skills={skillList} searchQuery={searchQuery} />
    </div>
  )
}
