import { Bot, Hash, MessageSquare, Asterisk } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DiscordAccountInfo } from '@/lib/api'

interface DiscordAccountListProps {
  accounts: DiscordAccountInfo[]
}

export default function DiscordAccountList({ accounts }: DiscordAccountListProps) {
  if (accounts.length === 0) return null

  // Sort: default first, then alphabetical
  const sorted = [...accounts].sort((a, b) => {
    if (a.isDefault) return -1
    if (b.isDefault) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="rounded-lg border border-border/40 bg-secondary/40 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="size-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">
          Bot Account → Channel Routing
        </h3>
      </div>

      <div className="space-y-2">
        {sorted.map((account) => (
          <AccountRow key={account.id} account={account} />
        ))}
      </div>
    </div>
  )
}

function AccountRow({ account }: { account: DiscordAccountInfo }) {
  const hasWildcard = account.channels.some((c) => c.isWildcard)
  const namedChannels = account.channels.filter((c) => !c.isWildcard)

  return (
    <div className="flex items-center gap-3 rounded-md bg-zinc-800/50 px-3 py-2.5">
      {/* Account name */}
      <div className="flex items-center gap-2 min-w-[120px] shrink-0">
        <div className="flex size-7 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">
          {account.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{account.name}</span>
            {account.isDefault && (
              <Badge className="bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/15 px-1.5 py-0 text-[10px]">
                Primary
              </Badge>
            )}
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/60">{account.id}</p>
        </div>
      </div>

      {/* Arrow */}
      <span className="text-muted-foreground/40 text-xs shrink-0">→</span>

      {/* Channels */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
        {hasWildcard && (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
            <Asterisk className="size-3" />
            all channels
          </span>
        )}
        {namedChannels.map((ch) => (
          <span
            key={ch.id}
            className="inline-flex items-center gap-1 rounded bg-zinc-700/60 px-2 py-0.5 text-xs text-zinc-300"
          >
            {ch.hasPrompt ? (
              <MessageSquare className="size-3 text-green-400" />
            ) : (
              <Hash className="size-3 text-zinc-500" />
            )}
            {ch.name ?? ch.id}
          </span>
        ))}
        {namedChannels.length === 0 && !hasWildcard && (
          <span className="text-xs text-muted-foreground/50 italic">no channels assigned</span>
        )}
      </div>
    </div>
  )
}
