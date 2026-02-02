import { Hono } from 'hono'
import { readConfig } from '../lib/config.js'

const channels = new Hono()

interface AccountChannelInfo {
  id: string
  name: string
  avatarUrl: string | null
  isDefault: boolean
  channels: {
    id: string
    name: string | null
    hasPrompt: boolean
    isWildcard: boolean
  }[]
}

// Cache guild channel names (shared with agents module pattern)
let guildNameCache: { names: Map<string, string>; fetchedAt: number } | null = null
const CACHE_TTL = 30 * 60 * 1000

async function getGuildChannelNames(guildId: string, botToken: string): Promise<Map<string, string>> {
  if (guildNameCache && Date.now() - guildNameCache.fetchedAt < CACHE_TTL) {
    return guildNameCache.names
  }
  const names = new Map<string, string>()
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${botToken}` },
    })
    if (res.ok) {
      const chs: Array<{ id: string; name: string }> = await res.json()
      for (const ch of chs) names.set(ch.id, ch.name)
    }
  } catch { /* non-fatal */ }
  guildNameCache = { names, fetchedAt: Date.now() }
  return names
}

function extractChannels(guilds: any): Array<{ channelId: string; guildId: string; hasPrompt: boolean; isWildcard: boolean }> {
  const result: Array<{ channelId: string; guildId: string; hasPrompt: boolean; isWildcard: boolean }> = []
  for (const [guildId, guild] of Object.entries<any>(guilds ?? {})) {
    for (const [channelId, ch] of Object.entries<any>(guild.channels ?? {})) {
      result.push({
        channelId,
        guildId,
        hasPrompt: !!(ch.systemPrompt && ch.systemPrompt.length > 0),
        isWildcard: channelId === '*',
      })
    }
  }
  return result
}

// GET /api/channels — per-account channel architecture
channels.get('/', async (c) => {
  try {
    const config = await readConfig()
    const ch = config?.channels ?? {}

    const result: Record<string, unknown> = {}

    // Telegram
    if (ch.telegram) {
      result.telegram = {
        enabled: !!ch.telegram.enabled,
        groupPolicy: ch.telegram.groupPolicy ?? 'none',
      }
    }

    // Discord
    if (ch.discord) {
      const d = ch.discord
      const accounts = d.accounts ?? {}
      const firstToken = Object.values<any>(accounts).find((a: any) => a.token)?.token

      // Resolve channel names from first available guild
      let channelNames = new Map<string, string>()
      const allGuildIds = new Set<string>()

      // Collect guild IDs from global + all accounts
      for (const guildId of Object.keys(d.guilds ?? {})) allGuildIds.add(guildId)
      for (const acct of Object.values<any>(accounts)) {
        for (const guildId of Object.keys(acct.guilds ?? {})) allGuildIds.add(guildId)
      }

      if (firstToken && allGuildIds.size > 0) {
        const firstGuild = [...allGuildIds][0]
        channelNames = await getGuildChannelNames(firstGuild, firstToken)
      }

      // Build per-account channel info
      const accountList: AccountChannelInfo[] = Object.entries<any>(accounts).map(([id, acct]) => {
        const isDefault = id === 'default'
        const guilds = isDefault ? (d.guilds ?? {}) : (acct.guilds ?? {})
        const rawChannels = extractChannels(guilds)

        return {
          id,
          name: acct.name ?? id,
          avatarUrl: null, // Avatars handled by agents API
          isDefault,
          channels: rawChannels.map((rc) => ({
            id: rc.channelId,
            name: rc.isWildcard ? null : (channelNames.get(rc.channelId) ?? null),
            hasPrompt: rc.hasPrompt,
            isWildcard: rc.isWildcard,
          })),
        }
      })

      // Summary stats
      const totalPersonaChannels = accountList
        .filter((a) => !a.isDefault)
        .reduce((sum, a) => sum + a.channels.filter((c) => !c.isWildcard).length, 0)

      result.discord = {
        enabled: !!d.enabled,
        groupPolicy: d.groupPolicy ?? 'none',
        accountCount: accountList.length,
        personaChannels: totalPersonaChannels,
        guildIds: [...allGuildIds],
        accounts: accountList,
      }
    }

    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default channels
