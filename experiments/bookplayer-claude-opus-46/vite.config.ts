import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { createReadStream, statSync } from 'node:fs'
import { join } from 'node:path'

const audiobooksRoot = process.env.AUDIOBOOKS_ROOT || '/tmp/no-audiobooks'
const vttDir = process.env.VTT_DIR || '/tmp/no-vtt'

// Nitro publicAssets doesn't support HTTP Range requests, which browsers
// need for seeking in audio/video. This plugin serves files from a directory
// with full Range support (Accept-Ranges + 206 Partial Content).
function serveWithRange(baseURL: string, dir: string): Plugin {
  return {
    name: `serve-range:${baseURL}`,
    configureServer(server) {
      server.middlewares.use(baseURL, (req, res, next) => {
        const url = decodeURIComponent(req.url || '')
        const filePath = join(dir, url)
        let stat
        try {
          stat = statSync(filePath)
          if (!stat.isFile()) return next()
        } catch {
          return next()
        }
        const total = stat.size
        const ext = filePath.split('.').pop()?.toLowerCase() || ''
        const mimeTypes: Record<string, string> = {
          m4b: 'audio/mp4',
          m4a: 'audio/mp4',
          mp3: 'audio/mpeg',
          mp4: 'video/mp4',
          epub: 'application/epub+zip',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          vtt: 'text/vtt',
        }
        const contentType = mimeTypes[ext] || 'application/octet-stream'
        const range = req.headers.range
        if (range) {
          const m = range.match(/bytes=(\d+)-(\d*)/)
          if (m) {
            const start = parseInt(m[1], 10)
            const end = m[2] ? parseInt(m[2], 10) : total - 1
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${total}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': end - start + 1,
              'Content-Type': contentType,
            })
            createReadStream(filePath, { start, end }).pipe(res)
            return
          }
        }
        res.writeHead(200, {
          'Accept-Ranges': 'bytes',
          'Content-Length': total,
          'Content-Type': contentType,
        })
        createReadStream(filePath).pipe(res)
      })
    },
  }
}

const config = defineConfig({
  plugins: [
    serveWithRange('/audiobooks', audiobooksRoot),
    nitro({
      publicAssets: [
        {
          dir: audiobooksRoot,
          baseURL: '/audiobooks',
          maxAge: 86400,
        },
        {
          dir: vttDir,
          baseURL: '/vtt',
          maxAge: 86400,
        },
      ],
      devServer: {
        publicAssets: [
          {
            dir: audiobooksRoot,
            baseURL: '/audiobooks',
            maxAge: 86400,
          },
          {
            dir: vttDir,
            baseURL: '/vtt',
            maxAge: 86400,
          },
        ],
      },
    }),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
