const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, chatHistory, candidates, jobs } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Mock Fallback
      return new Response(JSON.stringify({
        response: "Hello! I am your AI Recruiter Co-pilot. Based on your current roster, I notice we have some high-potential matches. If we look at candidates like Rahul or Priya, they possess strong React and database design skills. Please ask me to compare specific applicants or search by technical keywords!",
        recommendedCandidateIds: candidates && candidates.length > 0 ? [candidates[0].id] : [],
        _mock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const prompt = `You are an elite Recruiter Copilot Assistant. Help the recruiter search candidates, compare them, explain rankings, and suggest best hires.
    
    Available Job Posts:
    ${JSON.stringify(jobs || [], null, 2)}
    
    Available Candidate Applications/Profiles:
    ${JSON.stringify(candidates || [], null, 2)}
    
    Conversation History:
    ${JSON.stringify(chatHistory || [], null, 2)}
    
    Current Message:
    "${message}"
    
    Return a JSON object containing:
    {
      "response": "Your markdown formatted reply providing details, tables, or explanation.",
      "recommendedCandidateIds": ["candidate_id_1", "candidate_id_2"] (optional array of matches relevant to the recruiter's query)
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        },
        systemInstruction: {
          parts: [{ text: "You are a professional recruiting assistant. Keep all responses highly concise, fast, and strictly formatted as requested JSON. Do not write extra commentary." }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const resJson = await response.json();
    const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const data = JSON.parse(text);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
