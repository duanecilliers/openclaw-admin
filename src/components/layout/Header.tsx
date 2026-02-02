import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import GatewayStatus from "@/components/gateway/GatewayStatus"
import GatewayStats from "@/components/gateway/GatewayStats"
import RestartButton from "@/components/gateway/RestartButton"
import RestartDialog from "@/components/gateway/RestartDialog"
import { useGatewayStatus, useGatewayRestart } from "@/hooks/useGatewayStatus"

export default function Header() {
  const [restartOpen, setRestartOpen] = useState(false)
  const { data, isLoading, refetch } = useGatewayStatus()
  const restart = useGatewayRestart()

  const handleRestart = () => {
    restart.mutate(undefined, {
      onSettled: () => setRestartOpen(false),
    })
  }

  return (
    <>
      <header className="flex h-14 w-full items-center justify-between bg-card px-4">
        {/* Left */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🦞</span>
          <span className="text-sm font-bold text-white">OpenClaw Admin</span>
        </div>

        {/* Center */}
        <div className="flex items-center gap-4">
          <GatewayStatus running={data?.running ?? false} isLoading={isLoading} />
          <GatewayStats
            port={data?.port}
            mode={data?.mode}
            agentCount={data?.agentCount}
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <RestartButton
            onRestart={() => setRestartOpen(true)}
            isRestarting={restart.isPending}
          />
        </div>
      </header>

      <RestartDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        onConfirm={handleRestart}
        isPending={restart.isPending}
      />
    </>
  )
}
