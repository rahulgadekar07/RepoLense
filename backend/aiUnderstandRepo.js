const axios = require("axios");
const OLLAMA_URL = "http://localhost:11434/api/generate";

/**
 * AI Repo Understanding with Timeout Fixes
 * - Compact prompt <4KB
 * - Faster llama3 model
 * - Retry logic
 * - Fallback summary
 */
async function aiUnderstandRepo(repoData) {
  // Compact data summaries
  const topFiles = repoData.files.slice(0,80).join("\n");
  const folderSummary = flattenFolderTree(repoData.folderTree);
const deps =
  repoData.dependencies?.dependencies
  ? Object.keys(repoData.dependencies.dependencies)
  : [];

const depsSummary = deps.slice(0, 20).join(", ") || "none";const readmeSummary = repoData.readme
  ? repoData.readme.slice(0, 1200)
  : "No README provided";
  const prompt = `
You are a senior software architect.

Analyze this repository and return STRICT JSON only.

{
  "project_summary": "2-3 specific sentences describing the real purpose",
  "tech_stack": ["languages", "frameworks", "major libraries"],
  "architecture": "short description of backend/frontend structure"
}

IMPORTANT:
Be specific. Use repo evidence. Avoid generic guesses.

REPO SIGNALS:

TOP FILES:
${topFiles}

LANGUAGES:
${repoData.languages.join(", ")}

KEY DEPENDENCIES:
${depsSummary}

FOLDER STRUCTURE:
${folderSummary}

README EXCERPT:
${readmeSummary}
`;
  // Try 3x with faster settings
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.post(OLLAMA_URL, {
        model: "llama3:8b",  // Faster than gemma2b
        prompt,
        stream: false,
        options: { 
          num_predict: 300,    // Short responses
          temperature: 0.1,    // Focused
          top_p: 0.9
        },
      }, { 
        timeout: 60000  // 60s max
      });

      return res.data.response;
    } catch (err) {
      console.log(`AI understand attempt ${attempt} failed:`, err.code || err.message);
      if (attempt === 3) {
        // FALLBACK: Static analysis
       return JSON.stringify({
  project_summary: "Automatic fallback: AI could not complete analysis.",
  tech_stack: repoData.languages,
  architecture: "unknown"
});
      }
      // Backoff retry
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

function flattenFolderTree(tree, prefix = "") {
  let summary = [];
  for (const [key, value] of Object.entries(tree || {})) {
    if (value === "file") {
      summary.push(key);
    } else if (typeof value === "object" && Object.keys(value).length > 0) {
      summary.push(`${key}/... (${Object.keys(value).length} items)`);
    }
  }
  return summary.slice(0, 50).join(" | ");
}

module.exports = aiUnderstandRepo;

