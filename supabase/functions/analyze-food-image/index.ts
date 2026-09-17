// Runs on Deno (Supabase Edge Functions), not Node - npm: specifiers are resolved by Deno at
// deploy/run time. Do NOT `npm install` these into the main project's package.json; nothing here
// needs node_modules.
//
// Requires the ANTHROPIC_API_KEY secret: `supabase secrets set ANTHROPIC_API_KEY=...`.
// Never expose that key to the frontend - this function is the only thing that reads it.
//
// verify_jwt is disabled for this function in supabase/config.toml because the platform's
// automatic JWT check runs before CORS preflight (OPTIONS) requests reach here, and a browser's
// preflight never carries an Authorization header - the browser then misreports the rejection as
// a CORS failure. Auth is verified manually below instead, after OPTIONS is handled.
import Anthropic from 'npm:@anthropic-ai/sdk@0.125.0'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const CATEGORIES = ['蔬果', '肉類', '乳製品', '飲品', '其他']

// Hand-rolled instead of zodOutputFormat()/zod: zodOutputFormat calls the Anthropic SDK's own
// bundled zod/v4 on a schema built from our separately-imported zod package - if Deno resolves
// those as two different module instances, zod's internal type checks throw before any network
// call is even made, on every single request. Three fields don't need a schema library.
const recognitionJsonSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: CATEGORIES },
          // Anthropic's structured-outputs schema validator rejects minimum/maximum on
          // 'number' - the range (0-1) is enforced afterwards in parseRecognitionOutput instead.
          confidence: { type: 'number' },
        },
        required: ['name', 'category', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
}

function parseRecognitionOutput(content) {
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse structured output as JSON: ${error}`)
  }

  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error('Structured output is missing an items array')
  }

  const items = parsed.items.map((item, index) => {
    if (typeof item?.name !== 'string') {
      throw new Error(`items[${index}].name is not a string`)
    }
    if (!CATEGORIES.includes(item.category)) {
      throw new Error(`items[${index}].category is not one of ${CATEGORIES.join(', ')}`)
    }
    if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
      throw new Error(`items[${index}].confidence is not a number between 0 and 1`)
    }
    return { name: item.name, category: item.category, confidence: item.confidence }
  })

  return { items }
}

// Matches the shape messages.parse() checks for ('parse' in outputFormat) to populate
// response.parsed_output - the same contract zodOutputFormat()'s return value satisfies.
const recognitionOutputFormat = {
  type: 'json_schema',
  schema: recognitionJsonSchema,
  parse: parseRecognitionOutput,
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: '未授權' }, 401)
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser()
  if (authError || !user) {
    return jsonResponse({ error: '未授權' }, 401)
  }

  let image, mediaType
  try {
    ;({ image, mediaType } = await req.json())
  } catch {
    return jsonResponse({ error: '請求格式錯誤' }, 400)
  }

  if (!image || typeof image !== 'string') {
    return jsonResponse({ error: '缺少圖片資料' }, 400)
  }

  try {
    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image },
            },
            {
              type: 'text',
              text: '辨識這張圖片中所有看得到的食材，列出每一項的名稱、分類與信心值。只列出畫面中實際看得到的食材，不要臆測畫面外的東西。',
            },
          ],
        },
      ],
      output_config: { format: recognitionOutputFormat },
    })

    if (!response.parsed_output) {
      return jsonResponse({ error: 'AI 辨識結果格式錯誤' }, 502)
    }

    return jsonResponse(response.parsed_output)
  } catch (error) {
    console.error('analyze-food-image failed', error)
    return jsonResponse({ error: '辨識失敗，請稍後再試' }, 500)
  }
})
