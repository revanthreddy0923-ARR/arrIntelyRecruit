const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { candidateSkills, jobSkills } = await req.json();

    if (!candidateSkills || !jobSkills) {
      return new Response(JSON.stringify({ error: "Missing candidateSkills or jobSkills" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Mock Fallback
      return new Response(JSON.stringify({
        missingSkills: ["Docker", "Kubernetes", "AWS CloudFormation"],
        suggestedCertifications: ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator (CKA)"],
        recommendedCourses: ["Docker & Kubernetes Course on Udemy", "AWS Developer Path on Coursera"],
        learningResources: [
          { title: "Official Kubernetes Tutorials", platform: "Kubernetes.io", link: "https://kubernetes.io/docs/tutorials/" },
          { title: "AWS Technical Essentials", platform: "Amazon AWS", link: "https://aws.amazon.com/training/essentials/" }
        ],
        improvementPercentage: 45,
        _mock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const prompt = `Compare these candidate skills: ${JSON.stringify(candidateSkills)} 
    with the job requirements: ${JSON.stringify(jobSkills)}.
    
    Return a JSON object with:
    {
      "missingSkills": array of strings,
      "suggestedCertifications": array of strings,
      "recommendedCourses": array of strings,
      "learningResources": array of objects with { "title": "...", "platform": "...", "link": "..." },
      "improvementPercentage": number (0-100 of how much completing this list improves match)
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
