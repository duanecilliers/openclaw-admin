import { Hono } from 'hono'
import { readConfig } from '../lib/config.js'

const channels = new Hono()

// GET /api/channels — structured channel overview (tokens masked)
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

      // Extract accounts (name + id only — NO tokens)
      const accounts: { id: string; name: string }[] = []
      if (d.accounts && typeof d.accounts === 'object') {
        for (const [id, acct] of Object.entries(d.accounts)) {
          const a = acct as Record<string, unknown>
          accounts.push({ id, name: (a.name as string) ?? id })
        }
      }

      // Extract guilds with channel info
      const guilds: {
        id: string
        channelCount: number
        channels: { id: string; hasPrompt: boolean }[]
      }[] = []

      if (d.guilds && typeof d.guilds === 'object') {
        for (const [guildId, guild] of Object.entries(d.guilds)) {
          const g = guild as Record<string, unknown>
          const guildChannels: { id: string; hasPrompt: boolean }[] = []

          if (g.channels && typeof g.channels === 'object') {
            for (const [chanId, chanCfg] of Object.entries(
              g.channels as Record<string, unknown>,
            )) {
              const cfg = chanCfg as Record<string, unknown>
              guildChannels.push({
                id: chanId,
                hasPrompt: !!(cfg.systemPrompt && typeof cfg.systemPrompt === 'string' && cfg.systemPrompt.length > 0),
              })
            }
          }

          guilds.push({
            id: guildId,
            channelCount: guildChannels.filter((ch) => ch.id !== '*').length,
            channels: guildChannels,
          })
        }
      }

      result.discord = {
        enabled: !!d.enabled,
        groupPolicy: d.groupPolicy ?? 'none',
        accounts,
        guilds,
      }
    }

    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default channels
