import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import GatewayStatus from "@/components/gateway/GatewayStatus"
import GatewayStats from "@/components/gateway/GatewayStats"
import RestartButton from "@/components/gateway/RestartButton"

export default function Header() {
  return (
    <header className="flex h-14 w-full items-center justify-between bg-card px-4">
      {/* Left */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🦞</span>
        <span className="text-sm font-bold text-white">OpenClaw Admin</span>
      </div>

      {/* Center */}
      <div className="flex items-center gap-4">
        <GatewayStatus running={true} isLoading={false} />
        <GatewayStats port={18789} mode="local" agentCount={11} />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm">
          <RefreshCw className="size-4" />
        </Button>
        <RestartButton />
      </div>
    </header>
  )
}
