import { Hono } from 'hono'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { readConfig } from '../lib/config.js'
import { getAgentWorkspace } from '../lib/agents.js'

const skills = new Hono()

type SkillSource = 'bundled' | 'shared' | 'workspace'

interface SkillInfo {
  name: string
  description: string
  group: string
  hasConfig: boolean
  source: SkillSource
}

/**
 * Parse YAML-ish frontmatter between --- markers.
 * Handles simple `key: value` and multi-line `key: |` blocks.
 */
export function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const result: Record<string, string> = {}
  const lines = match[1].split(/\r?\n/)
  let currentKey: string | null = null
  let currentValue: string[] = []

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (kvMatch) {
      if (currentKey) {
        result[currentKey] = currentValue.join('\n').trim()
      }
      currentKey = kvMatch[1]
      const val = kvMatch[2]
      if (val === '|' || val === '>') {
        currentValue = []
      } else {
        currentValue = [val.replace(/^["']|["']$/g, '')]
      }
    } else if (currentKey && (line.startsWith('  ') || line === '')) {
      currentValue.push(line.replace(/^ {2}/, ''))
    }
  }
  if (currentKey) {
    result[currentKey] = currentValue.join('\n').trim()
  }

  return result
}

/**
 * Scan a directory for skills (folders containing SKILL.md).
 */
async function scanSkillsDir(
  dir: string,
  source: SkillSource,
  skillEntries: Record<string, unknown>
): Promise<SkillInfo[]> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return []
  }

  const results: SkillInfo[] = []

  for (const entry of entries) {
    const skillMdPath = join(dir, entry, 'SKILL.md')
    let raw: string
    try {
      raw = await readFile(skillMdPath, 'utf-8')
    } catch {
      continue
    }

    const fm = parseFrontmatter(raw)
    const name = fm.name || entry
    const description = fm.description || ''
    const group = fm.group || fm.category || 'general'
    const hasConfig = entry in skillEntries || name in skillEntries

    results.push({ name, description, group, hasConfig, source })
  }

  return results
}

/**
 * Resolve the three skill directories.
 */
function getSkillDirs(config: any, agentWorkspace: string | null) {
  const home = homedir()

  // Bundled skills — shipped with OpenClaw install
  // Check common locations
  const bundledDir = join(home, 'openclaw', 'skills')

  // Shared/managed skills
  const sharedDir = join(home, '.openclaw', 'skills')

  // Agent workspace skills
  const workspaceDir = agentWorkspace ? join(agentWorkspace, 'skills') : null

  return { bundledDir, sharedDir, workspaceDir }
}

// GET /api/skills — list all skills, optionally scoped to an agent
skills.get('/', async (c) => {
  try {
    const config = await readConfig()
    const agentId = c.req.query('agentId')
    const skillEntries: Record<string, unknown> = config?.skills?.entries ?? {}

    // Resolve agent workspace if agentId provided
    let agentWorkspace: string | null = null
    if (agentId) {
      agentWorkspace = getAgentWorkspace(config, agentId)
    }

    const { bundledDir, sharedDir, workspaceDir } = getSkillDirs(config, agentWorkspace)

    // Scan all three layers
    const [bundledSkills, sharedSkills, workspaceSkills] = await Promise.all([
      scanSkillsDir(bundledDir, 'bundled', skillEntries),
      scanSkillsDir(sharedDir, 'shared', skillEntries),
      workspaceDir ? scanSkillsDir(workspaceDir, 'workspace', skillEntries) : Promise.resolve([]),
    ])

    // Merge with precedence: workspace > shared > bundled
    const merged = new Map<string, SkillInfo>()

    for (const skill of bundledSkills) {
      merged.set(skill.name, skill)
    }
    for (const skill of sharedSkills) {
      merged.set(skill.name, skill)
    }
    for (const skill of workspaceSkills) {
      merged.set(skill.name, skill)
    }

    const results = [...merged.values()]

    // Sort by group, then by name
    results.sort((a, b) => {
      const g = a.group.localeCompare(b.group)
      return g !== 0 ? g : a.name.localeCompare(b.name)
    })

    return c.json(results)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default skills
