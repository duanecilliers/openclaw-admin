import { Hono } from 'hono'
import { readConfig } from '../lib/config.js'
import { probeGateway, restartGateway } from '../lib/gateway.js'

const gateway = new Hono()

gateway.get('/status', async (c) => {
  try {
    const config = await readConfig()
    const port = config.gateway?.port ?? 18789
    const running = await probeGateway(port)
    const agentCount = Object.keys(config.channels?.discord?.accounts ?? {}).length

    return c.json({
      running,
      port,
      mode: config.gateway?.mode ?? 'unknown',
      bind: config.gateway?.bind ?? 'unknown',
      agentCount,
      checkedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    return c.json({
      running: false,
      port: 0,
      mode: 'error',
      bind: 'unknown',
      agentCount: 0,
      checkedAt: new Date().toISOString(),
      error: err.message,
    }, 500)
  }
})

gateway.post('/restart', async (c) => {
  try {
    const result = await restartGateway()
    return c.json(result, result.success ? 200 : 500)
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default gateway
