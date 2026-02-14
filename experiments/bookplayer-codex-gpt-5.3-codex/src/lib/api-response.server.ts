import { RouteDataError } from '@/lib/route-data.server'

interface ErrorPayload {
  ok: false
  error: {
    code: string
    message: string
  }
}

function asJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

export function okJson<T>(data: T, status = 200): Response {
  return asJson({ ok: true, data }, status)
}

export function errorJson(
  code: string,
  message: string,
  status = 400,
): Response {
  const payload: ErrorPayload = { ok: false, error: { code, message } }
  return asJson(payload, status)
}

export function asErrorResponse(error: unknown): Response {
  if (error instanceof RouteDataError) {
    return errorJson(error.code, error.message, error.status)
  }

  const message =
    error instanceof Error ? error.message : 'Unexpected server error'
  return errorJson('UNEXPECTED_ERROR', message, 500)
}
