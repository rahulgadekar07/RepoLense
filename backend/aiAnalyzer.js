const axios = require("axios");
const OLLAMA_URL = "http://localhost:11434/api/generate";

function extractJSON(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return text.substring(start, end + 1);
    }
    return text;
  } catch {
    return text;
  }
}

async function analyzeWithAI(repoData) {
  try {
    console.log("🚀 AI request started");

    const prompt = `
You are a senior software architect.

Return ONLY valid JSON. No explanation. No markdown.

JSON format:
{
  "project_summary": "",
  "tech_stack": [],
  "architecture": "",
  "possible_diagrams": [
    {
      "type": "",
      "name": "",
      "elements": []
    }
  ]
}

REPO DATA:

FILES:
${repoData.files.slice(0,200).join("\n")}

LANGUAGES:
${repoData.languages.join(", ")}

DEPENDENCIES:
${JSON.stringify(repoData.dependencies)}

FOLDER TREE:
${JSON.stringify(repoData.folderTree)}

README:
${repoData.readme?.slice(0,1500)}
`;

    const response = await axios.post(
      OLLAMA_URL,
      {
        model: "llama3:8b",
        prompt,
        stream: false,
        options: {
          num_predict: 1500,
          temperature: 0.2
        }
      },
      {
        timeout: 180000 // 3 min safety
      }
    );

    console.log("✅ Raw AI output received");

    const cleaned = extractJSON(response.data.response);
    return cleaned;

  } catch (err) {
    console.log("❌ AI ERROR:", err.message);
    return "AI analysis failed";
  }
}

module.exports = analyzeWithAI;