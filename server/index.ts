import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import gateway from './routes/gateway.js'
import agents from './routes/agents.js'
import workspace from './routes/workspace.js'
import skills from './routes/skills.js'

const app = new Hono()
app.use('/*', cors())

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.route('/api/gateway', gateway)
app.route('/api/agents', agents)
app.route('/api/workspace', workspace)
app.route('/api/skills', skills)

const port = 5181
console.log(`Hono server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
