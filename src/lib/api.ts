const API_BASE = '/api'

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export interface GatewayStatus {
  running: boolean
  port: number
  mode: string
  bind: string
  agentCount: number
  checkedAt: string
  error?: string
}

export interface GatewayRestartResult {
  success: boolean
  message: string
}

export const gatewayApi = {
  getStatus: () => fetchJSON<GatewayStatus>('/gateway/status'),
  restart: () => fetchJSON<GatewayRestartResult>('/gateway/restart', { method: 'POST' }),
}

// === Agent Types ===

export interface AgentChannel {
  id: string
  name: string
}

export interface Agent {
  id: string
  name: string
  description: string
  avatarUrl: string | null
  channels: AgentChannel[]
  channelId: string | null
  guildId: string | null
  skillCount: number
}

export interface AgentPrompt {
  prompt: string
  channelId: string
  guildId: string
}

export const agentsApi = {
  list: () => fetchJSON<Agent[]>('/agents'),
  getPrompt: (id: string) => fetchJSON<AgentPrompt>(`/agents/${id}/prompt`),
  updatePrompt: (id: string, prompt: string) =>
    fetchJSON<AgentPrompt>(`/agents/${id}/prompt`, {
      method: 'PUT',
      body: JSON.stringify({ prompt }),
    }),
}

// === Workspace Types ===

export interface WorkspaceFileInfo {
  name: string
  exists: boolean
}

export interface WorkspaceFile {
  name: string
  content: string
}

// === Skill Types ===

export interface Skill {
  name: string
  description: string
  group: string
  hasConfig: boolean
}

export const skillsApi = {
  list: () => fetchJSON<Skill[]>('/skills'),
}

// === Workspace Types ===

// === Cron Types ===

export interface CronJob {
  id: string
  name?: string
  enabled: boolean
  schedule: { kind: string; expr?: string; tz?: string; atMs?: number; everyMs?: number }
  payload: { kind: string; message?: string; channel?: string; to?: string; text?: string; deliver?: boolean }
  state?: { lastRunAtMs?: number; lastStatus?: string; nextRunAtMs?: number; lastDurationMs?: number }
}

export interface CreateCronJob {
  name?: string
  enabled?: boolean
  sessionTarget?: string
  schedule: CronJob['schedule']
  payload: CronJob['payload']
}

export const cronApi = {
  list: () => fetchJSON<CronJob[]>('/cron'),
  create: (data: CreateCronJob) =>
    fetchJSON<CronJob>('/cron', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CronJob>) =>
    fetchJSON<CronJob>(`/cron/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => fetchJSON<void>(`/cron/${id}`, { method: 'DELETE' }),
  run: (id: string) =>
    fetchJSON<{ success: boolean; message: string }>(`/cron/${id}/run`, { method: 'POST' }),
}

// === Channel Types ===

export interface DiscordAccountChannel {
  id: string
  name: string | null
  hasPrompt: boolean
  isWildcard: boolean
}

export interface DiscordAccountInfo {
  id: string
  name: string
  isDefault: boolean
  channels: DiscordAccountChannel[]
}

export interface ChannelOverview {
  telegram?: { enabled: boolean; groupPolicy: string }
  discord?: {
    enabled: boolean
    groupPolicy: string
    accountCount: number
    personaChannels: number
    guildIds: string[]
    accounts: DiscordAccountInfo[]
  }
}

export const channelsApi = {
  list: () => fetchJSON<ChannelOverview>('/channels'),
}

// === Config Types ===

export const configApi = {
  get: () => fetchJSON<{ config: any; updatedAt: string }>('/config'),
}

// === Workspace Types ===

export const workspaceApi = {
  listFiles: () => fetchJSON<WorkspaceFileInfo[]>('/workspace/files'),
  getFile: (name: string) => fetchJSON<WorkspaceFile>(`/workspace/file/${name}`),
  saveFile: (name: string, content: string) =>
    fetchJSON<{ name: string; saved: boolean }>(`/workspace/file/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
}
