// CivicFix M5: Optional AI-assisted category suggestion Edge Function.
// Security:
// - GEMINI_API_KEY is read strictly from server-side Deno.env (never VITE_).
// - Requires an authenticated Supabase user JWT.
// - Accepts ONLY title and description; ignores any other fields.
// - Validates Gemini output strictly against CivicFix's allowed categories.
// - Never logs report text, user identifiers, or secrets.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_CATEGORIES = new Set([
  'pothole',
  'garbage',
  'water_leak',
  'streetlight',
  'drainage',
  'other',
])

const MIN_TITLE_LENGTH = 5
const MAX_TITLE_LENGTH = 120
const MIN_DESCRIPTION_LENGTH = 20
const MAX_DESCRIPTION_LENGTH = 2000
const GEMINI_TIMEOUT_MS = 8000
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { status: 'unavailable', reason: 'error', message: 'Method not allowed.' },
      405,
    )
  }

  // Enforce authenticated caller at the Edge Function boundary.
  const authHeader = req.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!authHeader || !supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(
      {
        status: 'unavailable',
        reason: 'error',
        message: 'Authentication required.',
      },
      401,
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return jsonResponse(
      {
        status: 'unavailable',
        reason: 'error',
        message: 'Authentication required.',
      },
      401,
    )
  }

  // Check provider credential strictly on server-side boundary.
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')?.trim()
  if (!geminiApiKey) {
    return jsonResponse({
      status: 'unavailable',
      reason: 'not_configured',
    })
  }

  let parsedBody: unknown
  try {
    parsedBody = await req.json()
  } catch {
    return jsonResponse(
      {
        status: 'unavailable',
        reason: 'invalid_input',
        message: 'Invalid JSON request body.',
      },
      400,
    )
  }

  if (!parsedBody || typeof parsedBody !== 'object') {
    return jsonResponse(
      {
        status: 'unavailable',
        reason: 'invalid_input',
        message: 'Request body must be a JSON object.',
      },
      400,
    )
  }

  const rawBody = parsedBody as Record<string, unknown>
  const title =
    typeof rawBody.title === 'string' ? rawBody.title.trim() : ''
  const description =
    typeof rawBody.description === 'string' ? rawBody.description.trim() : ''

  if (
    title.length < MIN_TITLE_LENGTH ||
    title.length > MAX_TITLE_LENGTH ||
    description.length < MIN_DESCRIPTION_LENGTH ||
    description.length > MAX_DESCRIPTION_LENGTH
  ) {
    return jsonResponse(
      {
        status: 'unavailable',
        reason: 'invalid_input',
        message: 'Title or description length is out of bounds.',
      },
      400,
    )
  }

  const model = Deno.env.get('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`

  const prompt = [
    'Classify this civic issue report into exactly one category from this list:',
    'pothole, garbage, water_leak, streetlight, drainage, other.',
    'Return ONLY JSON matching {"category": "<value>"}.',
    `Title: ${title}`,
    `Description: ${description}`,
  ].join('\n')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  try {
    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 32,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    })

    if (geminiResponse.status === 429) {
      return jsonResponse({
        status: 'unavailable',
        reason: 'rate_limited',
      })
    }

    if (!geminiResponse.ok) {
      return jsonResponse({
        status: 'unavailable',
        reason: 'error',
      })
    }

    const geminiJson = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
      }>
    }

    const rawText =
      geminiJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
    if (!rawText) {
      return jsonResponse({
        status: 'unavailable',
        reason: 'invalid_response',
      })
    }

    let parsedOutput: { category?: unknown }

    try {
      parsedOutput = JSON.parse(rawText)
    } catch {
      return jsonResponse({
        status: 'unavailable',
        reason: 'invalid_response',
      })
    }

    if (
      !parsedOutput ||
      typeof parsedOutput !== 'object' ||
      typeof parsedOutput.category !== 'string' ||
      !ALLOWED_CATEGORIES.has(parsedOutput.category)
    ) {
      return jsonResponse({
        status: 'unavailable',
        reason: 'invalid_response',
      })
    }

    return jsonResponse({
      status: 'suggested',
      category: parsedOutput.category,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return jsonResponse({
        status: 'unavailable',
        reason: 'timeout',
      })
    }

    return jsonResponse({
      status: 'unavailable',
      reason: 'error',
    })
  } finally {
    clearTimeout(timer)
  }
})
