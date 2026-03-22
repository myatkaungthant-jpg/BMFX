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

    // Construct the expert mentor prompt
    const now = new Date().toISOString();
    let prompt = `Act as an expert BMFX trading mentor.
    
Current Time: ${now}
The student says: "${studentQuestion}"

Context (Recent Trades - up to 20): ${JSON.stringify(recentTrades)}

RULES:
1. Respond directly to the student's question first.
2. If the user asks to see their trades, logs, or history, ALWAYS present them in a clean, professional Markdown TABLE.
3. Include columns like Date, Symbol, Side, Status, and PnL% in your tables.
4. If a trade is "Open", indicate that clearly.
5. ONLY analyze the 'Recent Trades' data if the student specifically asks about their performance, their journal, or their trading habits.
6. If the question is GENERAL (e.g., "What is liquidity?"), provide a clear and concise educational answer.
7. Speak directly using "you". Do not use the third person.
8. NEVER narrate your own instructions.
9. Format with Markdown (bolding, bullet points, tables) for a premium chat experience.`;
    
    if (imageUrl) {
      prompt += ` \n\nI have also attached an image for your analysis: ${imageUrl}. Please refer to this image when giving your advice.`;
    }

    console.log(`Invoking bmfx-ai-mentor for user: ${studentQuestion.slice(0, 20)}...`);

    // Call Manus AI API
    const response = await fetch('https://api.manus.ai/v1/tasks', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'API_KEY': `${MANUS_API_KEY}`,
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

    const taskData = await response.json()
    let taskId = taskData.id || taskData.task_id
    // Initial creation doesn't always have a status, but is inferred as running
    let status = taskData.status || 'running' 

    console.log(`Task started: ${taskId}. Current status: ${status}`);

    // Step 2: The Polling Loop
    // Wait for the task to complete, error out, or hit a maximum timeout (e.g. 50 seconds to fit Edge Function limits)
    const startTime = Date.now();
    const maxDuration = 50000; // 50 seconds

    while ((status === 'running' || status === 'pending') && (Date.now() - startTime < maxDuration)) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const pollResponse = await fetch(`https://api.manus.ai/v1/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'API_KEY': `${MANUS_API_KEY}`,
        },
      });

      if (!pollResponse.ok) {
        const pollError = await pollResponse.text();
        console.error(`Polling error (${pollResponse.status}):`, pollError);
        throw new Error(`Polling failed: ${pollError}`);
      }

      const pollData = await pollResponse.json();
      status = pollData.status;
      console.log(`Polling task ${taskId}: ${status}`);

      if (status === 'completed') {
        // Step 3: The Final Return - Extract text
        // Based on docs, output is an array. We look for the assistant's text.
        const output = pollData.output || [];
        const assistantMessages = output.filter((m: any) => m.role === 'assistant');
        
        let finalReply = "";
        assistantMessages.forEach((m: any) => {
          if (m.content && Array.isArray(m.content)) {
            m.content.forEach((c: any) => {
              if (c.text) finalReply += c.text + "\n";
            });
          }
        });

        if (!finalReply.trim()) {
           finalReply = "The agent finished the task but provided no text output.";
        }

        // Log pollData for one test run to verify the credit field
        console.log(`Task ${taskId} completed. Info:`, JSON.stringify({
          status: pollData.status,
          credit_usage: pollData.credit_usage,
          usage: pollData.usage,
        }));

        // Manus cost is usually 9-13 credits for reasoning tasks
        // Based on docs, the field might be credit_usage
        const cost = pollData.credit_usage || pollData.credits || pollData.usage?.total_credits || 15;

        return new Response(JSON.stringify({ 
          text: finalReply.trim(),
          cost: cost 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      if (status === 'error' || status === 'failed') {
        throw new Error(`Manus Task failed: ${pollData.error || 'Unknown error'}`);
      }
    }

    // If we timeout or stay in a loop without completing
    if (status === 'running' || status === 'pending') {
      return new Response(JSON.stringify({ 
        text: "The agent is still working, but the response is taking a bit longer. You can track it here:",
        task_url: `https://manus.im/app/${taskId}`,
        cost: 0 // No cost for timeout since it's still running
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error(`Unexpected final status: ${status}`);

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
