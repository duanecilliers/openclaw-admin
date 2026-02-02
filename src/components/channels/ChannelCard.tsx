import { MessageSquare, Hash, Users, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ChannelOverview } from '@/lib/api'

interface TelegramCardProps {
  config: NonNullable<ChannelOverview['telegram']>
}

export function TelegramCard({ config }: TelegramCardProps) {
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/15">
            <MessageSquare className="size-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Telegram</h3>
            <p className="text-xs text-muted-foreground">Messaging platform</p>
          </div>
        </div>
        <Badge
          variant={config.enabled ? 'default' : 'secondary'}
          className={
            config.enabled
              ? 'bg-green-400/15 text-green-400 hover:bg-green-400/15'
              : 'bg-zinc-700/50 text-zinc-400'
          }
        >
          {config.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="size-3" />
          <span>Policy: {config.groupPolicy}</span>
        </div>
      </div>
    </div>
  )
}

interface DiscordCardProps {
  config: NonNullable<ChannelOverview['discord']>
}

export function DiscordCard({ config }: DiscordCardProps) {
  const totalChannels = config.guilds.reduce((sum, g) => sum + g.channelCount, 0)
  const promptChannels = config.guilds.reduce(
    (sum, g) => sum + g.channels.filter((ch) => ch.hasPrompt && ch.id !== '*').length,
    0,
  )

  return (
    <div className="rounded-lg border border-border/40 bg-secondary/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/15">
            <svg className="size-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Discord</h3>
            <p className="text-xs text-muted-foreground">Bot platform</p>
          </div>
        </div>
        <Badge
          variant={config.enabled ? 'default' : 'secondary'}
          className={
            config.enabled
              ? 'bg-green-400/15 text-green-400 hover:bg-green-400/15'
              : 'bg-zinc-700/50 text-zinc-400'
          }
        >
          {config.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3" />
          <span>{config.accounts.length} accounts</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hash className="size-3" />
          <span>{totalChannels} channels</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="size-3" />
          <span>{promptChannels} with persona prompts</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="size-3" />
          <span>Policy: {config.groupPolicy}</span>
        </div>
      </div>

      {/* Guild details */}
      {config.guilds.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Guilds</h4>
          {config.guilds.map((guild) => (
            <div
              key={guild.id}
              className="flex items-center justify-between rounded-md bg-zinc-800/50 px-3 py-2"
            >
              <span className="text-xs font-mono text-muted-foreground">{guild.id}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{guild.channelCount} channels</span>
                <span>
                  {guild.channels.filter((ch) => ch.hasPrompt && ch.id !== '*').length} with prompts
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
