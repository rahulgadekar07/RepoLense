const axios = require("axios");
const OLLAMA_URL = "http://localhost:11434/api/generate";

/**
 * Generate diagrams ONE AT A TIME to avoid JSON truncation.
 * Ollama cuts off long responses — asking for 1 diagram per call fixes this.
 */
async function aiGenerateDiagrams(understanding) {

  const diagramTypes = [
    {
      type: "Component",
      name: "System Overview",
      instruction: "Generate a component diagram showing the main parts of this system.",
      keyword: "graph TD"
    },
    {
      type: "Flowchart",
      name: "Request Flow",
      instruction: "Generate a flowchart showing how a user request flows through the system.",
      keyword: "flowchart TD"
    },
    {
      type: "Sequence",
      name: "API Sequence",
      instruction: "Generate a sequence diagram showing interactions between components.",
      keyword: "sequenceDiagram"
    }
  ];

  const results = [];

  for (const diagramType of diagramTypes) {
    const prompt = `You are a software architect.

${diagramType.instruction}

Return ONLY a single JSON object exactly like this example:
{"type":"${diagramType.type}","name":"${diagramType.name}","mermaid":"${diagramType.keyword}\\nA --> B\\nB --> C"}

Rules:
- The mermaid value must use \\n between nodes (not real line breaks)
- Keep it simple, max 6 nodes
- Return ONLY the JSON object, nothing else, no explanation

PROJECT: ${understanding.slice(0, 400)}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`📊 Generating ${diagramType.type} diagram (attempt ${attempt})...`);

        const res = await axios.post(OLLAMA_URL, {
          model: "llama3:8b",
          prompt,
          stream: false,
          options: {
            num_predict: 200,  // small — only 1 diagram per call
            temperature: 0.1,
            top_k: 10,
            top_p: 0.9,
          },
        }, {
          timeout: 120000
        });

        const raw = res.data.response;
        console.log(`📝 Raw ${diagramType.type}:`, raw.slice(0, 150));

        // Extract JSON block
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start === -1 || end === -1) throw new Error("No JSON found in response");

        let jsonStr = raw.substring(start, end + 1);

        // Fix raw newlines inside string values
        jsonStr = fixNewlines(jsonStr);

        const parsed = JSON.parse(jsonStr);

        if (!parsed.mermaid || parsed.mermaid.trim().length < 5) {
          throw new Error("Empty mermaid content");
        }

        results.push(parsed);
        console.log(`✅ ${diagramType.type} done`);
        break;

      } catch (err) {
        console.log(`❌ ${diagramType.type} attempt ${attempt} failed:`, err.message);
        if (attempt === 2) {
          results.push(getFallback(diagramType.type));
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  console.log(`✅ Total diagrams generated: ${results.length}`);
  return JSON.stringify({ diagrams: results });
}

function fixNewlines(jsonText) {
  let result = "";
  let insideString = false;
  let i = 0;

  while (i < jsonText.length) {
    const char = jsonText[i];
    const prev = jsonText[i - 1];

    if (char === '"' && prev !== "\\") {
      insideString = !insideString;
      result += char;
      i++;
      continue;
    }

    if (insideString) {
      if (char === "\n") { result += "\\n"; i++; continue; }
      if (char === "\r") { result += "\\r"; i++; continue; }
      if (char === "\t") { result += "\\t"; i++; continue; }
    }

    result += char;
    i++;
  }

  return result;
}

function getFallback(type) {
  const fallbacks = {
    Component: {
      type: "Component",
      name: "High Level Architecture",
      mermaid: "graph TD\nUser --> Frontend\nFrontend --> Backend\nBackend --> Database"
    },
    Flowchart: {
      type: "Flowchart",
      name: "User Request Flow",
      mermaid: "flowchart TD\nA[User] --> B[Frontend]\nB --> C[API]\nC --> D[Database]\nD --> C\nC --> B"
    },
    Sequence: {
      type: "Sequence",
      name: "API Call Sequence",
      mermaid: "sequenceDiagram\nUser->>Frontend: Action\nFrontend->>Backend: API Call\nBackend->>DB: Query\nDB-->>Backend: Result\nBackend-->>Frontend: Response"
    }
  };
  return fallbacks[type] || fallbacks.Component;
}

module.exports = aiGenerateDiagrams;