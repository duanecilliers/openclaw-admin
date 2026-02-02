import { Hono } from 'hono'
import { stat } from 'fs/promises'
import { readConfig, getConfigPath } from '../lib/config.js'

const configRoute = new Hono()

const MASK = '••••••'

/**
 * Deep-clone an object, masking sensitive fields.
 */
function maskSensitive(obj: unknown, parentKey = ''): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map((item, i) => maskSensitive(item, parentKey))
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Mask token fields (bot tokens, auth tokens)
    if (key === 'token' && typeof value === 'string' && value.length > 0) {
      result[key] = MASK
      continue
    }

    // Mask apiKey fields
    if (key === 'apiKey' && typeof value === 'string' && value.length > 0) {
      result[key] = MASK
      continue
    }

    // Mask botToken fields (telegram)
    if (key === 'botToken' && typeof value === 'string' && value.length > 0) {
      result[key] = MASK
      continue
    }

    // Mask specific env vars
    if (
      parentKey === 'vars' &&
      (key === 'AUTH_TOKEN' || key === 'CT0') &&
      typeof value === 'string' &&
      value.length > 0
    ) {
      result[key] = MASK
      continue
    }

    // Recurse into nested objects
    result[key] = maskSensitive(value, key)
  }

  return result
}

// GET /api/config — full config with sensitive fields masked
configRoute.get('/', async (c) => {
  try {
    const config = await readConfig()
    const masked = maskSensitive(config)
    const configPath = getConfigPath()
    const fileStat = await stat(configPath)

    return c.json({
      config: masked,
      updatedAt: fileStat.mtime.toISOString(),
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default configRoute
