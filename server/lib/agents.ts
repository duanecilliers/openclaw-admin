import { readdir } from 'fs/promises'
import { join } from 'path'
import { readConfig, writeConfig } from './config.js'

export interface Agent {
  id: string
  name: string
  description: string
  avatarUrl: string | null
  channelId: string | null
  guildId: string | null
  skillCount: number
}

export interface AgentPrompt {
  prompt: string
  channelId: string
  guildId: string
}

interface ChannelBinding {
  channelId: string
  guildId: string
  systemPrompt: string
}

// --- Discord avatar cache ---
interface DiscordUser {
  id: string
  avatar: string | null
}

interface AvatarCache {
  urls: Map<string, string | null>
  fetchedAt: number
}

const AVATAR_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
let avatarCache: AvatarCache = { urls: new Map(), fetchedAt: 0 }

/**
 * Fetch a bot's Discord avatar URL using its token.
 * Returns CDN URL or null if no custom avatar is set.
 */
async function fetchBotAvatar(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${token}` },
    })
    if (!res.ok) return null
    const user: DiscordUser = await res.json()
    if (!user.avatar) return null
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png'
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`
  } catch {
    return null
  }
}

/**
 * Get avatar URLs for all accounts. Uses a time-based cache to avoid
 * hammering Discord on every page load.
 */
async function getAvatarUrls(accounts: Record<string, any>): Promise<Map<string, string | null>> {
  const now = Date.now()
  if (now - avatarCache.fetchedAt < AVATAR_CACHE_TTL_MS && avatarCache.urls.size > 0) {
    return avatarCache.urls
  }

  const urls = new Map<string, string | null>()
  const entries = Object.entries<any>(accounts)

  // Fetch all in parallel
  const results = await Promise.allSettled(
    entries.map(async ([id, account]) => {
      const url = account.token ? await fetchBotAvatar(account.token) : null
      return { id, url }
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      urls.set(result.value.id, result.value.url)
    }
  }

  avatarCache = { urls, fetchedAt: now }
  return urls
}

/**
 * OpenClaw multi-account architecture:
 * - Default account (Spark): channels.discord.guilds
 * - Persona accounts: channels.discord.accounts[id].guilds
 *
 * Each persona account has its own guilds config with the channels it responds in.
 * The system prompt lives on the channel config within that account's guilds.
 */

/**
 * Find the channel binding for an account.
 * Looks in the account's own guilds config for channels with a systemPrompt.
 * For default account, looks in the top-level discord guilds config.
 */
function getAccountBinding(config: any, accountId: string): ChannelBinding | null {
  let guilds: any

  if (accountId === 'default') {
    guilds = config.channels?.discord?.guilds ?? {}
  } else {
    guilds = config.channels?.discord?.accounts?.[accountId]?.guilds ?? {}
  }

  for (const [guildId, guild] of Object.entries<any>(guilds)) {
    const channels = guild.channels ?? {}
    for (const [channelId, channel] of Object.entries<any>(channels)) {
      if (channel.systemPrompt) {
        return { channelId, guildId, systemPrompt: channel.systemPrompt }
      }
    }
  }

  return null
}

/**
 * Count skill directories in the workspace skills/ folder.
 */
async function countSkills(config: any): Promise<number> {
  const workspace = config.agents?.defaults?.workspace
  if (!workspace) return 0
  try {
    const entries = await readdir(join(workspace, 'skills'), { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).length
  } catch {
    return 0
  }
}

/**
 * Get all agents (accounts) with their channel bindings and descriptions.
 */
export async function getAgents(): Promise<Agent[]> {
  const config = await readConfig()
  const accounts = config.channels?.discord?.accounts ?? {}
  const [skillCount, avatarUrls] = await Promise.all([
    countSkills(config),
    getAvatarUrls(accounts),
  ])

  return Object.entries<any>(accounts).map(([id, account]) => {
    const binding = getAccountBinding(config, id)
    const description = binding
      ? binding.systemPrompt.slice(0, 100).replace(/\n/g, ' ').trim()
      : account.name
    return {
      id,
      name: account.name,
      description: description + (binding && binding.systemPrompt.length > 100 ? '…' : ''),
      avatarUrl: avatarUrls.get(id) ?? null,
      channelId: binding?.channelId ?? null,
      guildId: binding?.guildId ?? null,
      skillCount,
    }
  })
}

/**
 * Get the system prompt for a specific agent.
 */
export async function getAgentPrompt(agentId: string): Promise<AgentPrompt | null> {
  const config = await readConfig()

  // Verify account exists
  if (agentId !== 'default') {
    const accounts = config.channels?.discord?.accounts ?? {}
    if (!accounts[agentId]) return null
  }

  const binding = getAccountBinding(config, agentId)
  if (!binding) return null

  return {
    prompt: binding.systemPrompt,
    channelId: binding.channelId,
    guildId: binding.guildId,
  }
}

/**
 * Update the system prompt for a specific agent.
 * Writes to the account's own guilds config.
 */
export async function updateAgentPrompt(agentId: string, prompt: string): Promise<AgentPrompt | null> {
  const config = await readConfig()

  // Verify account exists
  if (agentId !== 'default') {
    const accounts = config.channels?.discord?.accounts ?? {}
    if (!accounts[agentId]) return null
  }

  const binding = getAccountBinding(config, agentId)
  if (!binding) return null

  // Write to the correct location based on account type
  if (agentId === 'default') {
    config.channels.discord.guilds[binding.guildId].channels[binding.channelId].systemPrompt = prompt
  } else {
    config.channels.discord.accounts[agentId].guilds[binding.guildId].channels[binding.channelId].systemPrompt = prompt
  }

  await writeConfig(config)

  return {
    prompt,
    channelId: binding.channelId,
    guildId: binding.guildId,
  }
}
