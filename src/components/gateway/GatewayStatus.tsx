import { cn } from "@/lib/utils"

interface GatewayStatusProps {
  running: boolean
  isLoading: boolean
}

export default function GatewayStatus({ running, isLoading }: GatewayStatusProps) {
  const isChecking = isLoading && !running

  const dotColor = isChecking
    ? "bg-yellow-400"
    : running
      ? "bg-green-400"
      : "bg-red-400"

  const label = isChecking ? "Checking..." : running ? "Connected" : "Disconnected"

  const pillBg = isChecking
    ? "bg-yellow-400/10 text-yellow-400"
    : running
      ? "bg-green-400/10 text-green-400"
      : "bg-red-400/10 text-red-400"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        pillBg,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          dotColor,
          running && !isChecking && "animate-pulse-dot",
        )}
      />
      {label}
    </span>
  )
}
