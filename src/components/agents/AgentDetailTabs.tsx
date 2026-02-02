import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const SUB_TABS = [
  { value: 'soul', label: 'Soul', phase: 3 },
  { value: 'user', label: 'User', phase: 3 },
  { value: 'agents', label: 'Agents', phase: 3 },
  { value: 'memory', label: 'Memory', phase: 3 },
  { value: 'tools', label: 'Tools', phase: 3 },
  { value: 'skills', label: 'Skills', phase: 4 },
] as const

export default function AgentDetailTabs() {
  return (
    <Tabs defaultValue="soul" className="mt-6">
      <TabsList className="gap-1 bg-secondary/50">
        {SUB_TABS.map(({ value, label }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="data-[state=active]:bg-secondary data-[state=active]:text-blue-400 data-[state=active]:shadow-none"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {SUB_TABS.map(({ value, label, phase }) => (
        <TabsContent key={value} value={value}>
          <div className="mt-4 rounded-lg border border-border/50 bg-secondary/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-white">{label}</span> — coming in Phase {phase}
            </p>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
