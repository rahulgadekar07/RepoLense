const axios = require("axios");
const OLLAMA_URL = "http://localhost:11434/api/generate";

/**
 * Generate REAL Mermaid diagrams
 */
async function aiGenerateDiagrams(understanding) {

  const prompt = `
You are a senior software architect.

Generate Mermaid diagrams for this project.

Return STRICT JSON ONLY:
{
 "diagrams":[
   {
     "type":"Component",
     "name":"",
     "mermaid":""
   },
   {
     "type":"Flowchart",
     "name":"",
     "mermaid":""
   },
   {
     "type":"Sequence",
     "name":"",
     "mermaid":""
   }
 ]
}

Rules:
- Output ONLY valid JSON
- Mermaid must start with correct keywords:
  - flowchart TD
  - sequenceDiagram
  - graph TD
- Keep diagrams SIMPLE and GENERIC
- Do NOT explain anything

PROJECT:
${understanding.slice(0,1000)}
`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.post(
        OLLAMA_URL,
        {
          model: "llama3:8b",
          prompt,
          stream: false,
          options: {
            num_predict: 600,
            temperature: 0.2
          }
        },
        { timeout: 60000 }
      );

      return res.data.response;

    } catch (err) {
      console.log(`Mermaid AI attempt ${attempt} failed`, err.message);

      if (attempt === 3) {
        // Fallback diagrams (ALWAYS succeed)
        return JSON.stringify({
          diagrams: [
            {
              type: "Component",
              name: "High Level Architecture",
              mermaid:
`graph TD
User --> Frontend
Frontend --> Backend
Backend --> Database`
            },
            {
              type: "Flowchart",
              name: "User Request Flow",
              mermaid:
`flowchart TD
A[User] --> B[Frontend]
B --> C[API]
C --> D[Database]
D --> C --> B --> A`
            },
            {
              type: "Sequence",
              name: "API Call Sequence",
              mermaid:
`sequenceDiagram
User->>Frontend: Action
Frontend->>Backend: API Call
Backend->>DB: Query
DB-->>Backend: Result
Backend-->>Frontend: Response`
            }
          ]
        });
      }

      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

module.exports = aiGenerateDiagrams;