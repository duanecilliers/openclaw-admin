import { Hono } from 'hono'
import { getAgents, getAgentPrompt, updateAgentPrompt } from '../lib/agents.js'

const agents = new Hono()

// GET /api/agents — list all agents
agents.get('/', async (c) => {
  try {
    const list = await getAgents()
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// GET /api/agents/:id/prompt — get system prompt for agent
agents.get('/:id/prompt', async (c) => {
  try {
    const id = c.req.param('id')
    const result = await getAgentPrompt(id)
    if (!result) {
      return c.json({ error: 'Agent not found or has no system prompt' }, 404)
    }
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// PUT /api/agents/:id/prompt — update system prompt for agent
agents.put('/:id/prompt', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<{ prompt: string }>()
    if (!body.prompt && body.prompt !== '') {
      return c.json({ error: 'Missing "prompt" in request body' }, 400)
    }
    const result = await updateAgentPrompt(id, body.prompt)
    if (!result) {
      return c.json({ error: 'Agent not found or has no channel binding' }, 404)
    }
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default agents
