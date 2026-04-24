import { withRequestLogger } from './middleware/logger.js'
import { withErrorHandler } from './middleware/errors.js'
import apiService from './service/api.js'
import demoService from './service/demo.js'
import config from './config.js'

export const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
  'access-control-max-age': '86400'
}

export function addCorsHeaders(response) {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

async function router(request, ctx) {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (request.method === 'GET' && pathname === `${config.http.prefix}/api`) {
    return apiService(request, ctx)
  }

  if (request.method === 'GET' && pathname === `${config.http.prefix}/demo`) {
    return demoService(request)
  }

  return new Response('Not Found', { status: 404 })
}

export const handler = withRequestLogger(withErrorHandler(router))

export async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const response = await handler(request)
  return addCorsHeaders(response)
}
