// This runs on Supabase Edge Functions (Deno)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { home, away, league } = await req.json()

    // 1. Fetch from Anthropic (Claude)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user', 
          content: `Analyze this football match: ${home} vs ${away} in ${league}. 
          Provide a prediction, suggested odds, confidence percentage (0-100), 
          and a brief 1-sentence reasoning based on current form. 
          Format as JSON: {"prediction": "...", "odds": "...", "confidence": 0, "reasoning": "..."}`
        }],
      }),
    })

    const data = await response.json()
    const aiText = data.content[0].text
    
    // 2. Parse the AI response and send back to your app
    return new Response(aiText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
