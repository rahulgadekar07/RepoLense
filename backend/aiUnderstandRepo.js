const axios = require("axios");
const OLLAMA_URL = "http://localhost:11434/api/generate";

async function aiUnderstandRepo(repoData) {
  const topFiles = repoData.files.slice(0, 25).join("\n");
  const folderSummary = flattenFolderTree(repoData.folderTree);

  const deps = repoData.dependencies?.dependencies
    ? Object.keys(repoData.dependencies.dependencies).slice(0, 15).join(", ")
    : "none";

  const readmeSummary = repoData.readme
    ? repoData.readme.slice(0, 500)
    : "No README provided";

  // ✅ Use real techStack (React, MongoDB etc.) not raw extensions (js, json)
  const techStackStr = repoData.techStack && repoData.techStack.length > 0
    ? repoData.techStack.join(", ")
    : repoData.languages.join(", ");

  const prompt = `You are a software architect. Analyze this repository and return ONLY a JSON object.

Example of what to return:
{"project_summary":"This is a full-stack e-commerce app built with React and Node.js for buying and selling products online.","tech_stack":["React","Node.js","Express.js","MongoDB"],"architecture":"React frontend, Express.js REST API backend, MongoDB for data storage."}

Now analyze this repo and return the same JSON structure filled with real values:

FILES:
${topFiles}

DETECTED TECH STACK: ${techStackStr}
DEPENDENCIES: ${deps}
FOLDERS: ${folderSummary}
README: ${readmeSummary}

Return ONLY the JSON object. No explanation. No markdown. Use the detected tech stack values.`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`🧠 Understanding attempt ${attempt}...`);

      const res = await axios.post(OLLAMA_URL, {
        model: "llama3:8b",
        prompt,
        stream: false,
        options: {
          num_predict: 250,
          temperature: 0.1,
          top_k: 10,
          top_p: 0.9,
        },
      }, { timeout: 120000 });

      console.log("✅ Understanding done");
      return res.data.response;

    } catch (err) {
      console.log(`❌ AI understand attempt ${attempt} failed:`, err.code || err.message);
      if (attempt === 2) {
        return JSON.stringify({
          project_summary: `A project using ${techStackStr} with ${repoData.files.length} files.`,
          tech_stack: repoData.techStack || repoData.languages,
          architecture: "Could not determine - AI timed out"
        });
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

function flattenFolderTree(tree) {
  let summary = [];
  for (const [key, value] of Object.entries(tree || {})) {
    if (value === "file") summary.push(key);
    else if (typeof value === "object")
      summary.push(`${key}/... (${Object.keys(value).length} items)`);
  }
  return summary.slice(0, 20).join(" | ");
}

module.exports = aiUnderstandRepo;