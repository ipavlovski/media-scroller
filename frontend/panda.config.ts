import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./components/**/*.{js,jsx,ts,tsx}', './main.tsx'],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      keyframes: {
        marquee: {
          '0%': {
            transform: 'translateX(0%)'
          },
          '100%': {
            transform: 'translateX(-100%)'
          }
        }
      },
      tokens: {
        fonts: {
          jakarta: { value: 'Plus Jakarta Sans, sans-serif' },
          pacifico: { value: 'Pacifico, cursive;' }
        }
      }
    }
  },

  // hash classnames for devtools readability
  hash: { cssVar: false, className: true },

  // enable codegen components
  jsxFramework: 'react',

  // The output directory for your css system
  outdir: 'styled-system'
})
