import { Hono } from 'hono'
import { readFile, writeFile, mkdir, cp, rm } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { getAgents, getAgentPrompt, updateAgentPrompt, getAgentWorkspace } from '../lib/agents.js'
import { readConfig } from '../lib/config.js'
import { ALLOWED_FILES, getAgentWorkspacePath, fileExists } from './workspace.js'
import { parseFrontmatter } from './skills.js'

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

// --- Per-agent skill management ---

// POST /api/agents/:id/skills/:skillName/install — copy skill to agent workspace
agents.post('/:id/skills/:skillName/install', async (c) => {
  try {
    const agentId = c.req.param('id')
    const skillName = c.req.param('skillName')
    const config = await readConfig()
    const agentWorkspacePath = getAgentWorkspace(config, agentId)

    if (!agentWorkspacePath) {
      return c.json({ error: `Agent "${agentId}" not found or has no workspace` }, 404)
    }

    const home = homedir()
    const bundledDir = join(home, 'openclaw', 'skills')
    const sharedDir = join(home, '.openclaw', 'skills')
    const destDir = join(agentWorkspacePath, 'skills', skillName)

    // Find source: prefer shared over bundled
    let sourceDir: string | null = null
    for (const dir of [sharedDir, bundledDir]) {
      const candidate = join(dir, skillName)
      try {
        await readFile(join(candidate, 'SKILL.md'), 'utf-8')
        sourceDir = candidate
        break
      } catch {
        continue
      }
    }

    if (!sourceDir) {
      return c.json({ error: `Skill "${skillName}" not found in bundled or shared locations` }, 404)
    }

    // Ensure target skills/ directory exists
    await mkdir(join(agentWorkspacePath, 'skills'), { recursive: true })

    // Copy skill directory
    await cp(sourceDir, destDir, { recursive: true })

    // Read the installed skill info
    const raw = await readFile(join(destDir, 'SKILL.md'), 'utf-8')
    const fm = parseFrontmatter(raw)
    const skillEntries: Record<string, unknown> = config?.skills?.entries ?? {}

    return c.json({
      name: fm.name || skillName,
      description: fm.description || '',
      group: fm.group || fm.category || 'general',
      hasConfig: skillName in skillEntries || (fm.name || skillName) in skillEntries,
      source: 'workspace' as const,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// DELETE /api/agents/:id/skills/:skillName — remove skill from agent workspace
agents.delete('/:id/skills/:skillName', async (c) => {
  try {
    const agentId = c.req.param('id')
    const skillName = c.req.param('skillName')
    const config = await readConfig()
    const agentWorkspacePath = getAgentWorkspace(config, agentId)

    if (!agentWorkspacePath) {
      return c.json({ error: `Agent "${agentId}" not found or has no workspace` }, 404)
    }

    const skillDir = join(agentWorkspacePath, 'skills', skillName)

    // Verify it exists
    try {
      await readFile(join(skillDir, 'SKILL.md'), 'utf-8')
    } catch {
      return c.json({ error: `Skill "${skillName}" not found in agent workspace` }, 404)
    }

    await rm(skillDir, { recursive: true, force: true })

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default agents
