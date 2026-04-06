const axios = require("axios");
const OLLAMA_URL = "http://localhost:11434/api/generate";

/**
 * Generates Class + ER diagrams in ONE Ollama call.
 * Shorter prompt = faster response = fewer timeouts.
 */
async function aiGenerateDiagrams(understanding) {

  // Parse understanding to extract useful signals
  let projectInfo = "";
  try {
    const parsed = JSON.parse(understanding);
    projectInfo = `App: ${parsed.project_summary || ""}
Stack: ${(parsed.tech_stack || []).join(", ")}`;
  } catch {
    projectInfo = understanding.slice(0, 300);
  }

  const prompt = `You are a software architect. Generate diagrams for this project.

PROJECT:
${projectInfo}

Return ONLY this JSON (use \\n for line breaks inside mermaid strings):
{"diagrams":[{"type":"ClassDiagram","name":"Data Models","mermaid":"classDiagram\\nclass User {\\n  +id\\n  +name\\n  +email\\n}\\nclass Post {\\n  +id\\n  +title\\n}\\nUser --> Post : creates"},{"type":"ERDiagram","name":"Database Schema","mermaid":"erDiagram\\nUSER {\\n  int id\\n  string name\\n  string email\\n}\\nPOST {\\n  int id\\n  string title\\n  int userId\\n}\\nUSER ||--o{ POST : creates"}]}

Replace User/Post with REAL entities from this project. Max 3 entities each. Return ONLY JSON.`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`📊 Generating diagrams (attempt ${attempt})...`);

      const res = await axios.post(OLLAMA_URL, {
        model: "llama3:8b",
        prompt,
        stream: false,
        options: {
          num_predict: 500,
          temperature: 0.1,
          top_k: 10,
          top_p: 0.9,
        },
      }, {
        timeout: 120000
      });

      const raw = res.data.response;
      console.log("📝 Raw diagrams:", raw.slice(0, 200));

      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No JSON found");

      let jsonStr = raw.substring(start, end + 1);
      jsonStr = fixNewlines(jsonStr);

      const parsed = JSON.parse(jsonStr);

      // Validate we got diagrams array
      if (!parsed.diagrams || !Array.isArray(parsed.diagrams) || parsed.diagrams.length === 0) {
        throw new Error("Empty diagrams array");
      }

      // Validate each diagram has mermaid content
      for (const d of parsed.diagrams) {
        if (!d.mermaid || d.mermaid.trim().length < 5) {
          throw new Error(`Empty mermaid in ${d.type}`);
        }
      }

      console.log(`✅ Got ${parsed.diagrams.length} diagrams`);
      return JSON.stringify(parsed);

    } catch (err) {
      console.log(`❌ Diagram attempt ${attempt} failed:`, err.message);
      if (attempt === 2) {
        console.log("⚠️ Using fallback diagrams");
        return JSON.stringify(getFallbackDiagrams());
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
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

function getFallbackDiagrams() {
  return {
    diagrams: [
      {
        type: "ClassDiagram",
        name: "Data Models",
        mermaid: "classDiagram\nclass User {\n  +id\n  +name\n  +email\n}\nclass Post {\n  +id\n  +title\n  +content\n}\nUser --> Post : creates"
      },
      {
        type: "ERDiagram",
        name: "Database Schema",
        mermaid: "erDiagram\nUSER {\n  int id\n  string name\n  string email\n}\nPOST {\n  int id\n  string title\n  string content\n  int userId\n}\nUSER ||--o{ POST : creates"
      }
    ]
  };
}

module.exports = aiGenerateDiagrams;