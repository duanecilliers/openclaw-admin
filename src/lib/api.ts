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
