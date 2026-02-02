import { Users, Wrench, MessageSquare, Clock, Settings } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import AgentsPage from "@/pages/AgentsPage"
import SkillsPage from "@/pages/SkillsPage"
import ChannelsPage from "@/pages/ChannelsPage"
import CronPage from "@/pages/CronPage"
import ConfigPage from "@/pages/ConfigPage"

const tabs = [
  { value: "agents", label: "Agents", icon: Users },
  { value: "skills", label: "Skills", icon: Wrench },
  { value: "channels", label: "Channels", icon: MessageSquare },
  { value: "cron", label: "Cron", icon: Clock },
  { value: "config", label: "Config", icon: Settings },
] as const

export default function TabNav() {
  return (
    <Tabs defaultValue="agents">
      <TabsList className="gap-1 bg-secondary/50">
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="data-[state=active]:bg-secondary data-[state=active]:text-blue-400 data-[state=active]:shadow-none"
          >
            <Icon className="size-4" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="agents"><AgentsPage /></TabsContent>
      <TabsContent value="skills"><SkillsPage /></TabsContent>
      <TabsContent value="channels"><ChannelsPage /></TabsContent>
      <TabsContent value="cron"><CronPage /></TabsContent>
      <TabsContent value="config"><ConfigPage /></TabsContent>
    </Tabs>
  )
}
