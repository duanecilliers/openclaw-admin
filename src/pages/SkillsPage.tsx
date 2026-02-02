import SkillsBrowser from '@/components/skills/SkillsBrowser'

export default function SkillsPage() {
  return (
    <div className="py-8">
      <h2 className="text-lg font-semibold text-white">Skills</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Browse and manage installed skills across your workspace.
      </p>
      <SkillsBrowser />
    </div>
  )
}
