import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const audiobooksRoot = process.env.AUDIOBOOKS_ROOT || '/tmp/no-audiobooks'

const config = defineConfig({
  plugins: [
    nitro({
      publicAssets: [
        {
          dir: audiobooksRoot,
          baseURL: '/audiobooks',
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
