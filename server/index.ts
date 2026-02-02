import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import gateway from './routes/gateway.js'

const app = new Hono()
app.use('/*', cors())

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.route('/api/gateway', gateway)

const port = 5181
console.log(`Hono server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
