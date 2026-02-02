import { readFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'

const CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json')

export async function readConfig(): Promise<any> {
  const raw = await readFile(CONFIG_PATH, 'utf-8')
  return JSON.parse(raw)
}

export function getConfigPath(): string {
  return CONFIG_PATH
}
