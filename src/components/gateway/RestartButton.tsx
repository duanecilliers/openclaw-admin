import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RestartButtonProps {
  onRestart?: () => void
  isRestarting?: boolean
}

export default function RestartButton({ onRestart, isRestarting }: RestartButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isRestarting}
      onClick={onRestart}
    >
      <RotateCcw className={cn("size-4", isRestarting && "animate-spin")} />
      {isRestarting ? "Restarting..." : "Restart"}
    </Button>
  )
}
