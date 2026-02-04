import { Hono } from 'hono'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { getAgents, getAgentPrompt, updateAgentPrompt } from '../lib/agents.js'
import { ALLOWED_FILES, getAgentWorkspacePath, fileExists } from './workspace.js'

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

// GET /api/agents/:id/prompt — get SOUL.md prompt for agent
agents.get('/:id/prompt', async (c) => {
  try {
    const id = c.req.param('id')
    const result = await getAgentPrompt(id)
    if (!result) {
      return c.json({ error: 'Agent not found' }, 404)
    }
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// PUT /api/agents/:id/prompt — update SOUL.md prompt for agent
agents.put('/:id/prompt', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<{ prompt: string }>()
    if (body.prompt == null) {
      return c.json({ error: 'Missing "prompt" in request body' }, 400)
    }
    const result = await updateAgentPrompt(id, body.prompt)
    if (!result) {
      return c.json({ error: 'Agent not found' }, 404)
    }
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// --- Per-agent workspace routes ---

// GET /api/agents/:agentId/workspace/files
agents.get('/:agentId/workspace/files', async (c) => {
  try {
    const agentId = c.req.param('agentId')
    const wsPath = await getAgentWorkspacePath(agentId)
    const results = await Promise.all(
      ALLOWED_FILES.map(async (name) => ({
        name,
        exists: await fileExists(join(wsPath, name)),
      }))
    )
    return c.json(results)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// GET /api/agents/:agentId/workspace/file/:name
agents.get('/:agentId/workspace/file/:name', async (c) => {
  try {
    const agentId = c.req.param('agentId')
    const name = c.req.param('name')
    if (!ALLOWED_FILES.includes(name as any)) {
      return c.json({ error: `File not allowed: ${name}` }, 400)
    }
    const wsPath = await getAgentWorkspacePath(agentId)
    const filePath = join(wsPath, name)

    if (!(await fileExists(filePath))) {
      return c.json({ error: `File not found: ${name}` }, 404)
    }

    const content = await readFile(filePath, 'utf-8')
    return c.json({ name, content })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// PUT /api/agents/:agentId/workspace/file/:name
agents.put('/:agentId/workspace/file/:name', async (c) => {
  try {
    const agentId = c.req.param('agentId')
    const name = c.req.param('name')
    if (!ALLOWED_FILES.includes(name as any)) {
      return c.json({ error: `File not allowed: ${name}` }, 400)
    }

    const body = await c.req.json<{ content: string }>()
    if (body.content == null) {
      return c.json({ error: 'Missing "content" in request body' }, 400)
    }

    const wsPath = await getAgentWorkspacePath(agentId)
    const filePath = join(wsPath, name)
    await writeFile(filePath, body.content, 'utf-8')
    return c.json({ name, saved: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default agents
