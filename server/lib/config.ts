import { readFile, writeFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'

const CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json')

export async function readConfig(): Promise<any> {
  const raw = await readFile(CONFIG_PATH, 'utf-8')
  return JSON.parse(raw)
}

export async function writeConfig(config: any): Promise<void> {
  const json = JSON.stringify(config, null, 2) + '\n'
  await writeFile(CONFIG_PATH, json, 'utf-8')
}

export function getConfigPath(): string {
  return CONFIG_PATH
}
