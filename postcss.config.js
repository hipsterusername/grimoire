import { resolve } from 'path'

export default {
  plugins: {
    '@tailwindcss/postcss': {
      base: resolve(import.meta.dirname),
      content: [
        './src/renderer/index.html',
        './src/renderer/src/**/*.{js,ts,jsx,tsx}'
      ]
    }
  }
}
