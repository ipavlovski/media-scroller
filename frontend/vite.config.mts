import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, '..') }

  return defineConfig({
    plugins: [react()], //  tsconfigPaths()

    server: {
      port: parseInt(process.env.VITE_PORT!),
      host: true,
    },

    resolve: {
      alias: [
        {
          find: 'components',
          replacement: `${__dirname}/frontend/components`,
        },
        {
          find: 'styled-system',
          replacement: `${__dirname}/frontend/styled-system`,
        },
      ],
    },

    build: {
      outDir: '../dist',
    },
  })
}
