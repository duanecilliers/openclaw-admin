import { Hono } from 'hono'
import { readJobs, writeJobs, runJob } from '../lib/cron.js'

const cron = new Hono()

// GET /api/cron — list all jobs
cron.get('/', async (c) => {
  try {
    const data = await readJobs()
    return c.json(data.jobs)
  } catch (err: any) {
    if (err.code === 'ENOENT') return c.json([])
    return c.json({ error: err.message }, 500)
  }
})

// PUT /api/cron/:id — update a job (merge partial)
cron.put('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    const patch = await c.req.json()
    const data = await readJobs()
    const idx = data.jobs.findIndex((j) => j.id === id)
    if (idx === -1) return c.json({ error: 'Job not found' }, 404)

    // Merge top-level fields (don't deep-merge schedule/payload/state to keep it safe)
    data.jobs[idx] = { ...data.jobs[idx], ...patch, id } // id can't change
    data.jobs[idx].updatedAtMs = Date.now()
    await writeJobs(data)
    return c.json(data.jobs[idx])
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// DELETE /api/cron/:id — remove a job
cron.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    const data = await readJobs()
    const idx = data.jobs.findIndex((j) => j.id === id)
    if (idx === -1) return c.json({ error: 'Job not found' }, 404)

    data.jobs.splice(idx, 1)
    await writeJobs(data)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/cron/:id/run — trigger immediate execution
cron.post('/:id/run', async (c) => {
  try {
    const { id } = c.req.param()
    const result = await runJob(id)
    return c.json(result, result.success ? 200 : 500)
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /api/cron — create a new job
cron.post('/', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.schedule || !body.payload) {
      return c.json({ error: 'Missing "schedule" and/or "payload"' }, 400)
    }
    const data = await readJobs()
    const id = crypto.randomUUID()
    const job: any = {
      id,
      name: body.name ?? null,
      enabled: body.enabled ?? true,
      sessionTarget: body.sessionTarget ?? 'isolated',
      schedule: body.schedule,
      payload: body.payload,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    }
    data.jobs.push(job)
    await writeJobs(data)
    return c.json(job, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default cron
