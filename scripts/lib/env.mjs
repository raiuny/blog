// Minimal .env loader (project has no dotenv dependency).
import { readFileSync, existsSync } from 'node:fs'

export function loadEnv(paths = ['.env', '.env.local']) {
  for (const p of paths) {
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf-8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  }
}
