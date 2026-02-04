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
 * Get avatar URLs for all agents that have Discord bindings.
 * Keyed by agentId.
 */
async function getAvatarUrls(
  bindings: Array<{ agentId: string; match: { channel: string; accountId: string } }>,
  discordAccounts: Record<string, any>
): Promise<Map<string, string | null>> {
  const now = Date.now()
  if (now - avatarCache.fetchedAt < AVATAR_CACHE_TTL_MS && avatarCache.urls.size > 0) {
    return avatarCache.urls
  }

  const urls = new Map<string, string | null>()

  const fetches = bindings
    .filter((b) => b.match.channel === 'discord')
    .map(async (binding) => {
      const account = discordAccounts[binding.match.accountId]
      const token = account?.token
      const url = token ? await fetchBotAvatar(token) : null
      return { agentId: binding.agentId, url }
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
 * Get all agents from config.agents.list[].
 */
export async function getAgents(): Promise<Agent[]> {
  const config = await readConfig()
  const agentsList: any[] = config.agents?.list ?? []
  const bindings: any[] = config.agents?.bindings ?? []
  const discordAccounts: Record<string, any> = config.channels?.discord?.accounts ?? {}

  const avatarUrls = await getAvatarUrls(bindings, discordAccounts)

  return agentsList.map((agent) => {
    // Find Discord binding for this agent
    const binding = bindings.find(
      (b: any) => b.agentId === agent.id && b.match?.channel === 'discord'
    )

    // Resolve channels from Discord account guilds if available
    const channels: AgentChannel[] = []
    if (binding) {
      const account = discordAccounts[binding.match.accountId]
      const guilds = account?.guilds ?? {}
      for (const [, guild] of Object.entries<any>(guilds)) {
        const guildChannels = guild.channels ?? {}
        for (const [channelId] of Object.entries(guildChannels)) {
          channels.push({ id: channelId, name: channelId })
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
function getAgentWorkspace(config: any, agentId: string): string | null {
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
