import { readdir } from 'fs/promises'
import { join } from 'path'
import { readConfig, writeConfig } from './config.js'

export interface Agent {
  id: string
  name: string
  description: string
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
  account: string | null
  systemPrompt: string
}

/**
 * Scan all guild channels and return those with a systemPrompt.
 * Also captures the `account` field if present on channel config.
 */
function getChannelBindings(config: any): ChannelBinding[] {
  const guilds = config.channels?.discord?.guilds ?? {}
  const bindings: ChannelBinding[] = []
  for (const [guildId, guild] of Object.entries<any>(guilds)) {
    const channels = guild.channels ?? {}
    for (const [channelId, channel] of Object.entries<any>(channels)) {
      if (channelId !== '*' && channel.systemPrompt) {
        bindings.push({
          channelId,
          guildId,
          account: channel.account ?? null,
          systemPrompt: channel.systemPrompt,
        })
      }
    }
  }
  return bindings
}

/**
 * Match an account to a channel binding using a multi-strategy approach:
 * 1. Check channel's explicit `account` field (most reliable)
 * 2. Check if account name appears in the system prompt text (fallback heuristic)
 *
 * Strategy 1 handles configs where channels declare their account.
 * Strategy 2 handles legacy configs where the persona name is in the prompt.
 */
function matchAccountToChannel(
  accountId: string,
  accountName: string,
  bindings: ChannelBinding[]
): ChannelBinding | undefined {
  // Strategy 1: explicit account field on channel config
  const explicit = bindings.find(
    (b) => b.account === accountId || b.account === accountName
  )
  if (explicit) return explicit

  // Strategy 2: account name appears in system prompt text
  const nameLower = accountName.toLowerCase()
  return bindings.find((b) =>
    b.systemPrompt.toLowerCase().includes(nameLower)
  )
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
  const bindings = getChannelBindings(config)
  const skillCount = await countSkills(config)

  return Object.entries<any>(accounts).map(([id, account]) => {
    const binding = matchAccountToChannel(id, account.name, bindings)
    const description = binding
      ? binding.systemPrompt.slice(0, 100).replace(/\n/g, ' ').trim()
      : account.name
    return {
      id,
      name: account.name,
      description: description + (binding && binding.systemPrompt.length > 100 ? '…' : ''),
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
  const accounts = config.channels?.discord?.accounts ?? {}
  const account = accounts[agentId]
  if (!account) return null

  const bindings = getChannelBindings(config)
  const binding = matchAccountToChannel(agentId, account.name, bindings)
  if (!binding) return null

  return {
    prompt: binding.systemPrompt,
    channelId: binding.channelId,
    guildId: binding.guildId,
  }
}

/**
 * Update the system prompt for a specific agent.
 * Finds the matching channel and writes the updated config to disk.
 */
export async function updateAgentPrompt(agentId: string, prompt: string): Promise<AgentPrompt | null> {
  const config = await readConfig()
  const accounts = config.channels?.discord?.accounts ?? {}
  const account = accounts[agentId]
  if (!account) return null

  const bindings = getChannelBindings(config)
  const binding = matchAccountToChannel(agentId, account.name, bindings)
  if (!binding) return null

  // Update the system prompt in-place
  config.channels.discord.guilds[binding.guildId].channels[binding.channelId].systemPrompt = prompt
  await writeConfig(config)

  return {
    prompt,
    channelId: binding.channelId,
    guildId: binding.guildId,
  }
}
