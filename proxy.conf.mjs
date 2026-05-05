import { config } from '@dotenvx/dotenvx'

config({ quiet: true })

export default {
  '/api/': {
    target: process.env.SEED_HOST ?? 'http://127.0.0.1:8000',
    changeOrigin: true,
    logLevel: 'debug',
    secure: false,
    onProxyReq: (proxyReq) => {
      const target = process.env.SEED_HOST ?? 'http://127.0.0.1:8000'
      proxyReq.setHeader('origin', target)
      proxyReq.setHeader('referer', `${target}/`)
    },
  },
  '/media/': {
    target: process.env.SEED_HOST ?? 'http://127.0.0.1:8000',
    changeOrigin: true,
    logLevel: 'debug',
    secure: false,
  },
}
