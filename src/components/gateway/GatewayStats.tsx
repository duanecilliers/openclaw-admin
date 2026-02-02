import { Badge } from "@/components/ui/badge"

interface GatewayStatsProps {
  port?: number
  mode?: string
  agentCount?: number
}

export default function GatewayStats({ port, mode, agentCount }: GatewayStatsProps) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {port != null && <span>Port {port}</span>}
      {mode && (
        <Badge variant="outline" className="text-xs">
          {mode}
        </Badge>
      )}
      {agentCount != null && <span>{agentCount} agents</span>}
    </div>
  )
}
