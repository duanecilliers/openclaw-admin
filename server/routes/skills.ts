import { Hono } from 'hono'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { readConfig } from '../lib/config.js'

const skills = new Hono()

interface SkillInfo {
  name: string
  description: string
  group: string
  hasConfig: boolean
}

/**
 * Parse YAML-ish frontmatter between --- markers.
 * Handles simple `key: value` and multi-line `key: |` blocks.
 * No dependency on a YAML parser.
 */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const result: Record<string, string> = {}
  const lines = match[1].split(/\r?\n/)
  let currentKey: string | null = null
  let currentValue: string[] = []

  for (const line of lines) {
    // New key: value pair (not indented)
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (kvMatch) {
      // Flush previous key
      if (currentKey) {
        result[currentKey] = currentValue.join('\n').trim()
      }
      currentKey = kvMatch[1]
      const val = kvMatch[2]
      // Multi-line indicator (| or >)
      if (val === '|' || val === '>') {
        currentValue = []
      } else {
        // Strip surrounding quotes
        currentValue = [val.replace(/^["']|["']$/g, '')]
      }
    } else if (currentKey && (line.startsWith('  ') || line === '')) {
      // Continuation of multi-line value
      currentValue.push(line.replace(/^ {2}/, ''))
    }
  }
  // Flush last key
  if (currentKey) {
    result[currentKey] = currentValue.join('\n').trim()
  }

  return result
}

// GET /api/skills — list all skills from workspace
skills.get('/', async (c) => {
  try {
    const config = await readConfig()
    const workspace = config?.agents?.defaults?.workspace
    if (!workspace) {
      return c.json({ error: 'No workspace configured (agents.defaults.workspace)' }, 500)
    }

    const skillsDir = join(workspace, 'skills')
    let entries: string[]
    try {
      entries = await readdir(skillsDir)
    } catch {
      // skills/ directory doesn't exist — return empty
      return c.json([])
    }

    // Get skill config entries for hasConfig detection
    const skillEntries: Record<string, unknown> = config?.skills?.entries ?? {}

    const results: SkillInfo[] = []

    for (const entry of entries) {
      const skillMdPath = join(skillsDir, entry, 'SKILL.md')
      let raw: string
      try {
        raw = await readFile(skillMdPath, 'utf-8')
      } catch {
        // No SKILL.md — skip
        continue
      }

      const fm = parseFrontmatter(raw)
      const name = fm.name || entry
      const description = fm.description || ''
      // Use "group" field from frontmatter; fall back to "category"; default "general"
      const group = fm.group || fm.category || 'general'
      const hasConfig = entry in skillEntries || name in skillEntries

      results.push({ name, description, group, hasConfig })
    }

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
