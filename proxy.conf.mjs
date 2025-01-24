import { config } from '@dotenvx/dotenvx'

config({ quiet: true })

export default [{
  context: ['/api/v3/', '/api/token/', '/api/version/'],
  target: process.env.SEED_HOST ?? 'http://127.0.0.1:8000',
  changeOrigin: true,
  logLevel: 'debug',
  secure: false,
}]
