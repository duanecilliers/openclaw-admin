export async function probeGateway(port: number): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`http://127.0.0.1:${port}/`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

export async function restartGateway(): Promise<{ success: boolean; message: string }> {
  const { exec } = await import('child_process')
  return new Promise((resolve) => {
    exec('openclaw gateway restart', { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, message: stderr || error.message })
      } else {
        resolve({ success: true, message: stdout.trim() || 'Gateway restart initiated' })
      }
    })
  })
}
