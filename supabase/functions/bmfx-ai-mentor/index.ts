import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Get request body
    const { studentQuestion, recentTrades, imageUrl } = await req.json()
    
    // Get API Key from environment variables
    const MANUS_API_KEY = Deno.env.get('MANUS_API_KEY')
    if (!MANUS_API_KEY) {
      throw new Error('MANUS_API_KEY is not set in environment variables.')
    }

    // Construct the hidden prompt
    let prompt = `You are a BMFX trading mentor. The student asks: ${studentQuestion}. Here is their recent anonymous trade data: ${JSON.stringify(recentTrades)}.`
    
    if (imageUrl) {
      prompt += ` \n\nI have also attached an image for your analysis: ${imageUrl}. Please refer to this image when giving your advice.`
    }

    prompt += ` \n\nGive a short, 3-sentence actionable advice.`

    console.log(`Invoking bmfx-ai-mentor for user: ${studentQuestion.slice(0, 20)}...`);

    // Call Manus AI API
    const response = await fetch('https://api.manus.ai/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MANUS_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Manus AI API returned ${response.status}:`, errorText);
      
      // Explicitly handle 401 from Manus AI
      if (response.status === 401) {
        throw new Error("Manus AI API Error: 401 Unauthorized. Please check your MANUS_API_KEY in Supabase secrets.");
      }
      
      throw new Error(`Manus API Error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    console.log('Manus AI API Success');
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Catch-all Error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check your MANUS_API_KEY and Ensure the Edge Function is deployed."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Returning 400 so the client sees the custom error message
    });
  }
});
