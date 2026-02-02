import { readFile, writeFile } from 'fs/promises'
import { execFile } from 'child_process'
import { homedir } from 'os'
import { join } from 'path'

const JOBS_PATH = join(homedir(), '.openclaw', 'cron', 'jobs.json')

export interface CronJobFile {
  version: number
  jobs: CronJob[]
}

export interface CronJob {
  id: string
  name?: string
  enabled: boolean
  schedule: { kind: string; expr?: string; tz?: string; atMs?: number; everyMs?: number }
  payload: { kind: string; message?: string; channel?: string; to?: string; text?: string; deliver?: boolean }
  state?: { lastRunAtMs?: number; lastStatus?: string; nextRunAtMs?: number; lastDurationMs?: number }
  [key: string]: unknown
}

export async function readJobs(): Promise<CronJobFile> {
  const raw = await readFile(JOBS_PATH, 'utf-8')
  return JSON.parse(raw)
}

export async function writeJobs(data: CronJobFile): Promise<void> {
  const json = JSON.stringify(data, null, 2) + '\n'
  await writeFile(JOBS_PATH, json, 'utf-8')
}

export function runJob(id: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    execFile('openclaw', ['cron', 'run', id], { timeout: 30_000 }, (err, stdout, stderr) => {
      if (err) {
        resolve({ success: false, message: stderr || err.message })
      } else {
        resolve({ success: true, message: stdout.trim() || 'Job triggered' })
      }
    })
  })
}
