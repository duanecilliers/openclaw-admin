import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { readConfig } from './config.js'

export interface AgentChannel {
  id: string
  name: string
}

export interface Agent {
  id: string
  name: string
  emoji: string | null
  model: string | null
  workspacePath: string
  avatarUrl: string | null
  channels: AgentChannel[]
}

export interface AgentPrompt {
  prompt: string
}

// --- Discord caches ---
interface DiscordUser {
  id: string
  avatar: string | null
}

interface AvatarCache {
  urls: Map<string, string | null>
  fetchedAt: number
}

interface ChannelNameCache {
  names: Map<string, string>
  fetchedAt: number
}

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
let avatarCache: AvatarCache = { urls: new Map(), fetchedAt: 0 }
let channelNameCache: ChannelNameCache = { names: new Map(), fetchedAt: 0 }

/**
 * Fetch a bot's Discord avatar URL using its token.
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
 * Fetch a Discord channel's name using a bot token.
 */
async function fetchChannelName(token: string, channelId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
      headers: { Authorization: `Bot ${token}` },
    })
    if (!res.ok) return null
    const channel = await res.json() as { name?: string }
    return channel.name ?? null
  } catch {
    return null
  }
}

/**
 * Get avatar URLs for all agents by matching discordAccounts[agentId].
 * Keyed by agentId.
 */
async function getAvatarUrls(
  agents: any[],
  discordAccounts: Record<string, any>
): Promise<Map<string, string | null>> {
  const now = Date.now()
  if (now - avatarCache.fetchedAt < CACHE_TTL_MS && avatarCache.urls.size > 0) {
    return avatarCache.urls
  }

  const urls = new Map<string, string | null>()

  const fetches = agents
    .filter((a) => discordAccounts[a.id]?.token)
    .map(async (agent) => {
      const token = discordAccounts[agent.id].token
      const url = await fetchBotAvatar(token)
      return { agentId: agent.id, url }
    })

  const results = await Promise.allSettled(fetches)
  for (const result of results) {
    if (result.status === 'fulfilled') {
      urls.set(result.value.agentId, result.value.url)
    }
  }

  avatarCache = { urls, fetchedAt: now }
  return urls
}

/**
 * Resolve channel names for all agent Discord channels.
 * Uses a single cache keyed by channelId.
 */
async function getChannelNames(
  agents: any[],
  discordAccounts: Record<string, any>
): Promise<Map<string, string>> {
  const now = Date.now()
  if (now - channelNameCache.fetchedAt < CACHE_TTL_MS && channelNameCache.names.size > 0) {
    return channelNameCache.names
  }

  const names = new Map<string, string>()

  // Collect all unique channelId → token pairs
  const channelTokens = new Map<string, string>()
  for (const agent of agents) {
    const account = discordAccounts[agent.id]
    if (!account?.token) continue
    const guilds = account.guilds ?? {}
    for (const guild of Object.values<any>(guilds)) {
      const channels = guild.channels ?? {}
      for (const channelId of Object.keys(channels)) {
        if (channelId !== '*') {
          channelTokens.set(channelId, account.token)
        }
      }
    }
  }

  const fetches = [...channelTokens.entries()].map(async ([channelId, token]) => {
    const name = await fetchChannelName(token, channelId)
    return { channelId, name }
  })

  const results = await Promise.allSettled(fetches)
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.name) {
      names.set(result.value.channelId, result.value.name)
    }
  }

  channelNameCache = { names, fetchedAt: now }
  return names
}

/**
 * Get all agents from config.agents.list[].
 * Resolves Discord channels and avatars by matching discordAccounts[agentId] directly.
 */
export async function getAgents(): Promise<Agent[]> {
  const config = await readConfig()
  const agentsList: any[] = config.agents?.list ?? []
  const discordAccounts: Record<string, any> = config.channels?.discord?.accounts ?? {}

  const [avatarUrls, channelNames] = await Promise.all([
    getAvatarUrls(agentsList, discordAccounts),
    getChannelNames(agentsList, discordAccounts),
  ])

  return agentsList.map((agent) => {
    // Match Discord account directly by agent ID
    const account = discordAccounts[agent.id]

    // Resolve channels from Discord account guilds
    const channels: AgentChannel[] = []
    if (account) {
      const guilds = account.guilds ?? {}
      for (const guild of Object.values<any>(guilds)) {
        const guildChannels = guild.channels ?? {}
        for (const channelId of Object.keys(guildChannels)) {
          if (channelId === '*') continue // skip wildcard
          const name = channelNames.get(channelId) ?? channelId
          channels.push({ id: channelId, name })
        }
      }
    }

    const workspace = agent.workspace ?? config.agents?.defaults?.workspace ?? ''

    return {
      id: agent.id,
      name: agent.identity?.name ?? agent.id,
      emoji: agent.identity?.emoji ?? null,
      model: agent.model ?? null,
      workspacePath: workspace,
      avatarUrl: avatarUrls.get(agent.id) ?? null,
      channels,
    }
  })
}

/**
 * Find an agent's workspace path by id.
 */
export function getAgentWorkspace(config: any, agentId: string): string | null {
  const agentsList: any[] = config.agents?.list ?? []
  const agent = agentsList.find((a: any) => a.id === agentId)
  if (!agent) return null
  return agent.workspace ?? config.agents?.defaults?.workspace ?? null
}

/**
 * Get the SOUL.md prompt for a specific agent.
 */
export async function getAgentPrompt(agentId: string): Promise<AgentPrompt | null> {
  const config = await readConfig()
  const workspace = getAgentWorkspace(config, agentId)
  if (!workspace) return null

  const soulPath = join(workspace, 'SOUL.md')
  try {
    const content = await readFile(soulPath, 'utf-8')
    return { prompt: content }
  } catch {
    // File doesn't exist yet — return empty prompt
    return { prompt: '' }
  }
}

/**
 * Update the SOUL.md prompt for a specific agent.
 */
export async function updateAgentPrompt(agentId: string, prompt: string): Promise<AgentPrompt | null> {
  const config = await readConfig()
  const workspace = getAgentWorkspace(config, agentId)
  if (!workspace) return null

  const soulPath = join(workspace, 'SOUL.md')
  await writeFile(soulPath, prompt, 'utf-8')

  return { prompt }
}
