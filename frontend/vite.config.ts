import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
// import tsconfigPaths from 'vite-tsconfig-paths'

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  return defineConfig({
    plugins: [react()], //  tsconfigPaths()

    server: {
      port: parseInt(process.env.VITE_PORT!),
      host: true,
    },

    // resolve: {
    //   alias: [
    //     {
    //       find: 'components',
    //       replacement: `${__dirname}/components`,
    //     },
    //     {
    //       find: 'frontend',
    //       replacement: `${__dirname}`,
    //     },
    //   ],
    // },

    resolve: {
      alias: [
        {
          find: 'src',
          replacement: `${__dirname}/src`,
        },
        {
          find: 'styled-system',
          replacement: `${__dirname}/styled-system`,
        },
      ],
    },

    build: {
      outDir: '../dist',
    },
  })
}
