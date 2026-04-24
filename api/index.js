import { handleRequest } from '../src/handler.js'

function getProtocol(req) {
  const forwardedProto = req.headers['x-forwarded-proto']
  if (typeof forwardedProto === 'string' && forwardedProto.length) {
    return forwardedProto.split(',')[0].trim()
  }
  return 'https'
}

function getHost(req) {
  return req.headers.host || 'localhost'
}

function toRequest(req) {
  const protocol = getProtocol(req)
  const host = getHost(req)
  const url = `${protocol}://${host}${req.url || '/'}`
  const headers = new Headers()

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else if (value !== undefined) {
      headers.set(key, String(value))
    }
  }

  return new Request(url, {
    method: req.method,
    headers
  })
}

async function sendResponse(nodeRes, response) {
  nodeRes.statusCode = response.status

  for (const [key, value] of response.headers.entries()) {
    nodeRes.setHeader(key, value)
  }

  if (!response.body) {
    nodeRes.end()
    return
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  nodeRes.end(buffer)
}

export default async function vercelHandler(req, res) {
  try {
    const request = toRequest(req)
    const response = await handleRequest(request)
    await sendResponse(res, response)
  } catch (error) {
    res.statusCode = 500
    res.setHeader('content-type', 'text/plain; charset=utf-8')
    res.end(error?.message || 'Internal Server Error')
  }
}
