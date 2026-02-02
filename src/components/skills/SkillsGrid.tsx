import { Badge } from '@/components/ui/badge'
import SkillCard from './SkillCard'
import type { Skill } from '@/lib/api'

const GROUP_COLORS: string[] = [
  'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'bg-red-500/15 text-red-400 border-red-500/30',
  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'bg-green-500/15 text-green-400 border-green-500/30',
  'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
]

interface SkillsGridProps {
  skills: Skill[]
  searchQuery: string
}

export default function SkillsGrid({ skills, searchQuery }: SkillsGridProps) {
  // Filter skills by search query
  const query = searchQuery.toLowerCase()
  const filtered = query
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      )
    : skills

  // Group by category
  const groups = new Map<string, Skill[]>()
  for (const skill of filtered) {
    const list = groups.get(skill.group) ?? []
    list.push(skill)
    groups.set(skill.group, list)
  }

  // Sort group names
  const sortedGroups = [...groups.keys()].sort()

  if (sortedGroups.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-secondary/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {searchQuery ? 'No skills matching your search.' : 'No skills found.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map((group, i) => {
        const groupSkills = groups.get(group)!
        const colorClass = GROUP_COLORS[i % GROUP_COLORS.length]

        return (
          <div key={group}>
            {/* Group header */}
            <div className="mb-3 flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[11px] capitalize ${colorClass}`}
              >
                {group}
              </Badge>
              <span className="text-xs text-muted-foreground">
                0/{groupSkills.length} enabled
              </span>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {groupSkills.map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
