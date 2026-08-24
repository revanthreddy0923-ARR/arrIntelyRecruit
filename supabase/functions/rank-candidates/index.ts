const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { candidates, jobDescription } = await req.json();

    if (!candidates || !jobDescription) {
      return new Response(JSON.stringify({ error: "Missing candidates or jobDescription" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Mock Fallback
      const rankings = candidates.map((c: any, index: number) => ({
        candidateId: c.id,
        rankScore: 90 - index * 10,
        matchReason: `Matches ${c.skills?.length || 0} key skills with strong academic education background.`
      }));
      return new Response(JSON.stringify({ rankings, _mock: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const prompt = `Rank these applicants for the job. Job description:
    ${jobDescription}
    
    Applicants list:
    ${JSON.stringify(candidates, null, 2)}
    
    Return a JSON object containing a "rankings" array with items having "candidateId", "rankScore" (0-100), and "matchReason" (string explaining their placement):
    {
      "rankings": [
        { "candidateId": "...", "rankScore": 85, "matchReason": "..." }
      ]
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
