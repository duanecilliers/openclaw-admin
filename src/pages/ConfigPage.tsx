import { Loader2, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfig } from '@/hooks/useConfig'
import ConfigViewer from '@/components/config/ConfigViewer'

export default function ConfigPage() {
  const { data, isLoading, error, refetch, isFetching } = useConfig()

  const formattedJson = data?.config
    ? JSON.stringify(data.config, null, 2)
    : ''

  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleString()
    : null

  return (
    <div className="py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Configuration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only view of openclaw.json (sensitive fields masked)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              Modified: {updatedAt}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>Failed to load config: {(error as Error).message}</span>
        </div>
      )}

      {data && <ConfigViewer value={formattedJson} />}
    </div>
  )
}
