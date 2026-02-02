import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChannels } from '@/hooks/useChannels'
import { TelegramCard, DiscordCard } from '@/components/channels/ChannelCard'
import DiscordAccountList from '@/components/channels/DiscordAccountList'

export default function ChannelsPage() {
  const { data, isLoading, error, refetch, isFetching } = useChannels()

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Channels</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Messaging platform configuration and bot accounts
          </p>
        </div>
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

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>Failed to load channels: {(error as Error).message}</span>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Platform cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {data.telegram && <TelegramCard config={data.telegram} />}
            {data.discord && <DiscordCard config={data.discord} />}
          </div>

          {/* Discord account list */}
          {data.discord && data.discord.accounts.length > 0 && (
            <DiscordAccountList accounts={data.discord.accounts} />
          )}

          {/* Empty state */}
          {!data.telegram && !data.discord && (
            <div className="rounded-lg border border-border/40 bg-secondary/40 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No channel configuration found in openclaw.json
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
