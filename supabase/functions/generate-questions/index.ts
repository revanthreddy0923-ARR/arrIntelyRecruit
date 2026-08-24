const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return new Response(JSON.stringify({ error: "Missing resumeText or jobDescription" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Mock Fallback
      return new Response(JSON.stringify({
        technical: [
          { question: "Explain the virtual DOM lifecycle in React and why you used it in your project.", answerOutline: "Should reference component mounting, reconciliation, diffing algorithm, and state updates." },
          { question: "How do you handle async state operations in Redux or React Context?", answerOutline: "References to thunks, async/await, fetching state management, and avoiding infinite loops." }
        ],
        hr: [
          { question: "Tell me about a time you handled a tight deadline.", answerOutline: "STAR method: Situation, Task, Action, Result. Highlight communication and delegation." }
        ],
        scenario: [
          { question: "If the production site crashes due to a slow DB query, what are the exact diagnostic steps you would take?", answerOutline: "Check server logs, examine DB CPU/index performance, look at recent git commits, setup a quick read replica or index." }
        ],
        _mock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const prompt = `Generate technical, HR, and scenario-based interview questions with high-level answer outlines based on the candidate's resume and target job description:
    Resume:
    ${resumeText}
    
    Job Description:
    ${jobDescription}
    
    Return a JSON object with:
    {
      "technical": [ { "question": "...", "answerOutline": "..." } ],
      "hr": [ { "question": "...", "answerOutline": "..." } ],
      "scenario": [ { "question": "...", "answerOutline": "..." } ]
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
