import { Bot } from 'lucide-react'

interface DiscordAccount {
  id: string
  name: string
}

interface DiscordAccountListProps {
  accounts: DiscordAccount[]
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500/20 text-red-400',
    'bg-orange-500/20 text-orange-400',
    'bg-amber-500/20 text-amber-400',
    'bg-yellow-500/20 text-yellow-400',
    'bg-lime-500/20 text-lime-400',
    'bg-green-500/20 text-green-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-teal-500/20 text-teal-400',
    'bg-cyan-500/20 text-cyan-400',
    'bg-sky-500/20 text-sky-400',
    'bg-blue-500/20 text-blue-400',
    'bg-indigo-500/20 text-indigo-400',
    'bg-violet-500/20 text-violet-400',
    'bg-purple-500/20 text-purple-400',
    'bg-fuchsia-500/20 text-fuchsia-400',
    'bg-pink-500/20 text-pink-400',
    'bg-rose-500/20 text-rose-400',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function DiscordAccountList({ accounts }: DiscordAccountListProps) {
  if (accounts.length === 0) return null

  return (
    <div className="rounded-lg border border-border/40 bg-secondary/40 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="size-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">
          Bot Accounts
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {accounts.length} registered
          </span>
        </h3>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const colorClass = getAvatarColor(account.name)
          const isDefault = account.id === 'default'
          return (
            <div
              key={account.id}
              className="flex items-center gap-3 rounded-md bg-zinc-800/50 px-3 py-2.5 transition-colors hover:bg-zinc-800/70"
            >
              {/* Avatar circle */}
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${colorClass}`}
              >
                {account.name.charAt(0)}
              </div>

              {/* Name + ID */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white truncate">
                    {account.name}
                  </span>
                  {isDefault && (
                    <span className="shrink-0 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-muted-foreground truncate">
                  {account.id}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
