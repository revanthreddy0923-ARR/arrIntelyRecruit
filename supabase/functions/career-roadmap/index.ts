const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { targetRole, currentSkills } = await req.json();

    if (!targetRole) {
      return new Response(JSON.stringify({ error: "Missing targetRole" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Mock Fallback
      const roleLower = targetRole.toLowerCase();
      let estimatedMonths = 6;
      let roadmapSteps = [];

      if (roleLower.includes("frontend") || roleLower.includes("react") || roleLower.includes("ui") || roleLower.includes("ux") || roleLower.includes("design")) {
        estimatedMonths = 5;
        roadmapSteps = [
          { title: "Master HTML5, CSS3, & Modern UI Layouts", desc: "Deep dive into Flexbox, Grid, CSS custom properties, responsive structures, and Tailwind CSS configuration.", resources: ["Tailwind CSS Docs", "MDN CSS Layouts"], duration: "1 month" },
          { title: "Advanced JavaScript & TypeScript Core", desc: "Learn asynchronous flows, DOM scripting, type assertions, interface configurations, and ESNext methods.", resources: ["TypeScript Deep Dive", "Eloquent JavaScript"], duration: "1.5 months" },
          { title: "Component Systems & State Architectures", desc: "Build modular web components using React, handling Context APIs, custom hooks, memoization, and React 19 rules.", resources: ["React.dev guides", "Epic React tutorials"], duration: "2.5 months" }
        ];
      } else if (roleLower.includes("data") || roleLower.includes("machine") || roleLower.includes("learning") || roleLower.includes("ml") || roleLower.includes("ai") || roleLower.includes("nlp") || roleLower.includes("science")) {
        estimatedMonths = 8;
        roadmapSteps = [
          { title: "Probability, Statistics, & Python Core", desc: "Build solid foundation in NumPy, Pandas, linear algebra, hypothesis testing, and descriptive statistics.", resources: ["Python for Data Analysis book", "StatQuest Youtube Series"], duration: "2 months" },
          { title: "Classical Machine Learning Models", desc: "Train and tune Scikit-Learn classifiers, regressions, decision trees, random forests, and gradient boosters.", resources: ["Hands-On ML with Scikit-Learn", "Kaggle Micro-courses"], duration: "3 months" },
          { title: "Deep Learning & Generative Architectures", desc: "Configure Neural Networks with PyTorch, explore CNNs for vision, RNNs/Transformers for text, and query Gemini APIs.", resources: ["Fast.ai Deep Learning course", "HuggingFace NLP course"], duration: "3 months" }
        ];
      } else if (roleLower.includes("devops") || roleLower.includes("cloud") || roleLower.includes("aws") || roleLower.includes("infrastructure") || roleLower.includes("kubernetes") || roleLower.includes("sre")) {
        estimatedMonths = 6;
        roadmapSteps = [
          { title: "Linux Systems & Scripting Core", desc: "Master Bash automation, systemd process management, user permissions, and network configurations.", resources: ["Linux Journey tutorial", "Bash scripting guide"], duration: "1.5 months" },
          { title: "Containerization & Orchestration", desc: "Build optimized Docker files, run container clusters with Docker Compose, and orchestrate with Kubernetes.", resources: ["Kubernetes Up & Running", "Docker Mastery course"], duration: "2 months" },
          { title: "Infrastructure as Code & CI/CD Pipelines", desc: "Automate provisions with Terraform, and configure deployment loops using GitHub Actions or GitLab pipelines.", resources: ["Terraform Up & Running", "GitHub Actions docs"], duration: "2.5 months" }
        ];
      } else if (roleLower.includes("security") || roleLower.includes("cyber") || roleLower.includes("pentest") || roleLower.includes("ethical")) {
        estimatedMonths = 7;
        roadmapSteps = [
          { title: "Networking Protocols & Operating Systems Security", desc: "Master TCP/IP, DNS, SSL/TLS, firewalls, and securing Linux and Windows server nodes.", resources: ["CompTIA Security+ guide", "Professor Messer lectures"], duration: "2 months" },
          { title: "OWASP Top 10 & Web Vulnerabilities", desc: "Audit web portals for SQLi, XSS, CSRF, insecure object references, and execute penetration audits.", resources: ["PortSwigger Web Security Academy", "OWASP testing guide"], duration: "2.5 months" },
          { title: "Incident Response & Defensive Ops", desc: "Configure SIEM tools, analyze network packet logs using Wireshark, and set up IDS rule sets.", resources: ["Wireshark Network Analysis", "Splunk tutorials"], duration: "2.5 months" }
        ];
      } else {
        estimatedMonths = 6;
        roadmapSteps = [
          { title: "Master Modern Backend Systems", desc: "Gain deep proficiency in Express, Node.js and database structuring with Firebase Firestore or MongoDB.", resources: ["Traversy Media Express crash course", "Official Node docs"], duration: "1.5 months" },
          { title: "Understand Containerization & DevOps", desc: "Learn Docker, GitHub Actions CI/CD to containerize the applications and deploy pipelines.", resources: ["Docker Mastery by Bret Fisher", "DevOps Roadmap on roadmap.sh"], duration: "2 months" },
          { title: "Build Scalable System Architecture", desc: "Design microservices, handle rate-limiters, cache with Redis and test integrations.", resources: ["ByteByteGo System Design", "Pragmatic Programmer book"], duration: "2.5 months" }
        ];
      }

      return new Response(JSON.stringify({
        estimatedMonths,
        roadmapSteps,
        _mock: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const prompt = `Create an elegant step-by-step career development roadmap to transition to the role of "${targetRole}" starting with current skills: ${JSON.stringify(currentSkills || [])}.
    
    Return a JSON object with:
    {
      "estimatedMonths": number,
      "roadmapSteps": [
        {
          "title": "step title",
          "desc": "detailed step description",
          "resources": ["resource 1", "resource 2"],
          "duration": "e.g. 1 month"
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
