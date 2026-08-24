const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resumeData } = await req.json();

    if (!resumeData) {
      return new Response(JSON.stringify({ error: "Missing resumeData" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Mock Fallback
      return new Response(JSON.stringify({
        atsScore: 82,
        grammarIssues: ["No major issues, but recommendation to use active action verbs (e.g., 'Directed' instead of 'Responsible for')."],
        formattingSuggestions: ["Include clear headers for Projects and Education.", "Set consistent font sizes for subheadings."],
        missingKeywords: ["CI/CD", "Docker", "Unit Testing", "REST API Integration"],
        readability: "Easy",
        completenessScore: 90,
        improvementSuggestions: ["Expand on your primary project metrics - add percentages (e.g. 'Improved efficiency by 25%').", "Add LinkedIn or Github link in professional headers."],
        _mock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const prompt = `Analyze this resume structure and content for ATS compatibility, grammar, readability, and keyword rich content:
    Resume JSON:
    ${JSON.stringify(resumeData, null, 2)}
    
    Return a JSON object with:
    {
      "atsScore": number (0-100),
      "grammarIssues": array of strings,
      "formattingSuggestions": array of strings,
      "missingKeywords": array of strings,
      "readability": "Easy" | "Medium" | "Difficult",
      "completenessScore": number (0-100),
      "improvementSuggestions": array of strings
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
