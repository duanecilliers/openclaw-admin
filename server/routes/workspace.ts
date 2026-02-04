import { Hono } from 'hono'
import { readFile, writeFile, access } from 'fs/promises'
import { join } from 'path'
import { readConfig } from '../lib/config.js'

const workspace = new Hono()

export const ALLOWED_FILES = ['SOUL.md', 'USER.md', 'AGENTS.md', 'MEMORY.md', 'TOOLS.md'] as const

async function getDefaultWorkspacePath(): Promise<string> {
  const config = await readConfig()
  const ws = config?.agents?.defaults?.workspace
  if (!ws) throw new Error('No workspace path configured in agents.defaults.workspace')
  return ws
}

export async function getAgentWorkspacePath(agentId: string): Promise<string> {
  const config = await readConfig()
  const agentsList: any[] = config.agents?.list ?? []
  const agent = agentsList.find((a: any) => a.id === agentId)
  if (!agent) throw new Error(`Agent not found: ${agentId}`)
  const ws = agent.workspace ?? config.agents?.defaults?.workspace
  if (!ws) throw new Error(`No workspace configured for agent: ${agentId}`)
  return ws
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

// --- Default workspace routes (backward compat) ---

// GET /api/workspace/files — list workspace files with existence status
workspace.get('/files', async (c) => {
  try {
    const wsPath = await getDefaultWorkspacePath()
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

// GET /api/workspace/file/:name — read file content
workspace.get('/file/:name', async (c) => {
  try {
    const name = c.req.param('name')
    if (!ALLOWED_FILES.includes(name as any)) {
      return c.json({ error: `File not allowed: ${name}` }, 400)
    }
    const wsPath = await getDefaultWorkspacePath()
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

// PUT /api/workspace/file/:name — save file content
workspace.put('/file/:name', async (c) => {
  try {
    const name = c.req.param('name')
    if (!ALLOWED_FILES.includes(name as any)) {
      return c.json({ error: `File not allowed: ${name}` }, 400)
    }

    const body = await c.req.json<{ content: string }>()
    if (body.content == null) {
      return c.json({ error: 'Missing "content" in request body' }, 400)
    }

    const wsPath = await getDefaultWorkspacePath()
    const filePath = join(wsPath, name)
    await writeFile(filePath, body.content, 'utf-8')
    return c.json({ name, saved: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default workspace
