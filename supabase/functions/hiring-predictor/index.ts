const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { candidate, job, quizScores, atsScore } = await req.json();

    if (!candidate || !job) {
      return new Response(JSON.stringify({ error: "Missing candidate or job parameters" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Mock Fallback
      return new Response(JSON.stringify({
        probability: 88,
        reasoning: "The candidate demonstrates exceptional matching skills (90% ATS match) and has proven expertise through verified skill tests.",
        trainingRequired: ["Advanced Docker Deployment patterns", "AWS CloudFormation structures"],
        recommendedRole: "Frontend Developer (React Expert) with Backend Transition Track",
        _mock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const prompt = `Estimate the candidate's hiring success rate and training needs for the job:
    Job: ${JSON.stringify(job)}
    Candidate Info: ${JSON.stringify(candidate)}
    Skill Quiz Scores: ${JSON.stringify(quizScores || [])}
    ATS Score: ${atsScore || 70}
    
    Return a JSON object with:
    {
      "probability": number (0-100 of predicted performance success),
      "reasoning": string (explainable reasoning based on data),
      "trainingRequired": array of strings (suggested training topics upon hiring),
      "recommendedRole": string (e.g. Senior Frontend, Mid Backend, etc.)
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
