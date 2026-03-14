// scripts/build-frontend.mjs — Build static frontend, temporarily hiding API routes
import { cpSync, rmSync, mkdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const apiDir = resolve(root, 'app/api')
const apiTmp = resolve(root, '.api_backup')

try {
  // Copy API routes to temp location, then remove originals
  if (existsSync(apiDir)) {
    if (existsSync(apiTmp)) rmSync(apiTmp, { recursive: true, force: true })
    cpSync(apiDir, apiTmp, { recursive: true })
    rmSync(apiDir, { recursive: true, force: true })
    console.log('[build-frontend] Temporarily removed app/api')
  }

  execSync('npx next build', {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, BUILD_TARGET: 'frontend' },
  })
} finally {
  // Restore API routes from backup
  if (existsSync(apiTmp)) {
    if (!existsSync(apiDir)) mkdirSync(apiDir, { recursive: true })
    cpSync(apiTmp, apiDir, { recursive: true })
    rmSync(apiTmp, { recursive: true, force: true })
    console.log('[build-frontend] Restored app/api')
  }
}
