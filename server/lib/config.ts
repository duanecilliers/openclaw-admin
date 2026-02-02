import { readFile, writeFile, rename, copyFile, mkdir } from 'fs/promises'
import { homedir } from 'os'
import { join, dirname } from 'path'

const CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json')
const BACKUP_DIR = join(homedir(), '.openclaw', 'backups')
const MAX_BACKUPS = 10

export async function readConfig(): Promise<any> {
  const raw = await readFile(CONFIG_PATH, 'utf-8')
  return JSON.parse(raw)
}

/**
 * Write config atomically: write to temp → backup current → rename temp over original.
 * Keeps up to MAX_BACKUPS timestamped backups in ~/.openclaw/backups/.
 */
export async function writeConfig(config: any): Promise<void> {
  const json = JSON.stringify(config, null, 2) + '\n'

  // Validate JSON roundtrips cleanly before touching disk
  JSON.parse(json)

  const tmpPath = CONFIG_PATH + '.tmp'
  const dir = dirname(CONFIG_PATH)

  // 1. Write to temp file
  await writeFile(tmpPath, json, 'utf-8')

  // 2. Backup current config
  try {
    await mkdir(BACKUP_DIR, { recursive: true })
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    await copyFile(CONFIG_PATH, join(BACKUP_DIR, `openclaw-${ts}.json`))
    await pruneBackups()
  } catch {
    // Backup failure is non-fatal — don't block the write
  }

  // 3. Atomic rename (same filesystem = atomic on POSIX)
  await rename(tmpPath, CONFIG_PATH)
}

/**
 * Keep only the most recent MAX_BACKUPS files.
 */
async function pruneBackups(): Promise<void> {
  try {
    const { readdir, unlink } = await import('fs/promises')
    const files = (await readdir(BACKUP_DIR))
      .filter((f) => f.startsWith('openclaw-') && f.endsWith('.json'))
      .sort()

    while (files.length > MAX_BACKUPS) {
      const oldest = files.shift()!
      await unlink(join(BACKUP_DIR, oldest)).catch(() => {})
    }
  } catch {
    // Non-fatal
  }
}

export function getConfigPath(): string {
  return CONFIG_PATH
}
