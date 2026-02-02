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

export const agentsApi = {
  list: () => fetchJSON<Agent[]>('/agents'),
  getPrompt: (id: string) => fetchJSON<AgentPrompt>(`/agents/${id}/prompt`),
  updatePrompt: (id: string, prompt: string) =>
    fetchJSON<AgentPrompt>(`/agents/${id}/prompt`, {
      method: 'PUT',
      body: JSON.stringify({ prompt }),
    }),
}
