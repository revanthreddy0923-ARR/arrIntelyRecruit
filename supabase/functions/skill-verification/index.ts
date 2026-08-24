const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { skillName } = await req.json();

    if (!skillName) {
      return new Response(JSON.stringify({ error: "Missing skillName" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Mock Fallback
      return new Response(JSON.stringify({
        questions: [
          { question: `What is the primarily designed use-case of ${skillName}?`, options: ["Performance scaling", "Data storage modeling", "Stateless component execution", "State synchronization"], correctIndex: 2 },
          { question: `Which of the following is considered a major performance anti-pattern in ${skillName}?`, options: ["Declaring prop-types", "Triggering state changes inside render logic", "Splitting code into custom hooks", "Using absolute layouts"], correctIndex: 1 },
          { question: `How can you optimize runtime latency in a highly intensive ${skillName} procedure?`, options: ["Memoizing costly computation returns", "Increasing CSS rules count", "Removing TypeScript typings", "Replacing local variables with global scope"], correctIndex: 0 }
        ],
        _mock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const prompt = `Generate a rigorous 4-question multiple-choice technical assessment/quiz for the skill: "${skillName}".
    Each question must have exactly 4 plausible technical options and 1 clear correct answer.
    
    Return a JSON object with:
    {
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": number (0 to 3)
        }
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
