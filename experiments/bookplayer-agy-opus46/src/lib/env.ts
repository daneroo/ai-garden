/**
 * Environment variable validation — fail fast on startup.
 */
import { accessSync, constants, statSync } from 'node:fs'

export interface EnvConfig {
  audiobooksRoot: string
  vttDir: string
}

function validateDir(envKey: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`${envKey} is not set. Check .env or .env.example.`)
  }
  const dir = value.trim()
  try {
    accessSync(dir, constants.R_OK)
  } catch {
    throw new Error(`${envKey}="${dir}" is not readable or does not exist.`)
  }
  const stat = statSync(dir)
  if (!stat.isDirectory()) {
    throw new Error(`${envKey}="${dir}" is not a directory.`)
  }
  return dir
}

let _config: EnvConfig | null = null

export function getEnvConfig(): EnvConfig {
  if (_config) return _config
  _config = {
    audiobooksRoot: validateDir('AUDIOBOOKS_ROOT', process.env.AUDIOBOOKS_ROOT),
    vttDir: validateDir('VTT_DIR', process.env.VTT_DIR),
  }
  console.log(
    `[env] AUDIOBOOKS_ROOT=${_config.audiobooksRoot} VTT_DIR=${_config.vttDir}`,
  )
  return _config
}
