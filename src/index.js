import { readFileSync } from 'node:fs'
import { logger } from './middleware/logger.js'
import config from './config.js'
import { handleRequest } from './handler.js'

// HTTP 服务器
Bun.serve({
  port: config.http.port,
  async fetch (request) {
    return handleRequest(request)
  }
})

logger.info({ port: config.http.port }, 'HTTP server started')

// HTTPS 服务器
if (config.https.enabled) {
  if (!config.https.keyPath || !config.https.certPath) {
    logger.error('HTTPS_ENABLED is true but SSL_KEY_PATH or SSL_CERT_PATH is not configured')
    process.exit(1)
  }

  let key
  let cert

  try {
    key = readFileSync(config.https.keyPath)
    cert = readFileSync(config.https.certPath)
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to read SSL certificate files')
    process.exit(1)
  }

  Bun.serve({
    port: config.https.port,
    tls: { key, cert },
    async fetch (request) {
      return handleRequest(request)
    }
  })

  logger.info({ port: config.https.port }, 'HTTPS server started')
} else {
  logger.info('HTTPS server is disabled')
}
