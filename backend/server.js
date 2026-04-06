const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");
const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");
const cleanJSON = require("./utils/cleanJSON");
const {
  scanDirectory,
  detectLanguages,
  getReadme,
  getPackageJsonDependencies,
  buildFolderTree
} = require("./repoUtils");
const { filterImportantFiles } = require("./repoFilter");
const aiUnderstandRepo = require("./aiUnderstandRepo");
const aiGenerateDiagrams = require("./aiGenerateDiagrams");

// const analyzeWithAI = require("./aiAnalyzer");

function getRepoId(repoUrl) {
  return crypto.createHash("md5").update(repoUrl).digest("hex");
}

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434/api/generate";

// Ensure folders exist at startup
const REPO_DIR = path.join(__dirname, "repos");
const CACHE_DIR = path.join(__dirname, "cache");

if (!fs.existsSync(REPO_DIR)) fs.mkdirSync(REPO_DIR);
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

app.get("/", (req, res) => {
  res.send("RepoLens Node backend running 🚀");
});

// TEST LOCAL AI CONNECTION
app.get("/ai-test", async (req, res) => {
  try {
   const response = await axios.post(OLLAMA_URL, {
  model: "llama3:8b",
  prompt: prompt,
  stream: false,
  options: {
    num_predict: 500,     // 🔥 LIMIT RESPONSE SIZE (MOST IMPORTANT)
    temperature: 0.3,     // faster + focused
    top_p: 0.9,
  }
}, {
  timeout: 120000   // ⏱️ 2 minute timeout safety
});
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error talking to Ollama");
  }
});

// MAIN API
app.post("/analyze-repo", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    console.log("Incoming repo:", repoUrl);

    const repoId = getRepoId(repoUrl);
    const cachePath = path.join(CACHE_DIR, repoId + ".json");

    // 🚀 STEP 1 — RETURN CACHE IF EXISTS
    if (fs.existsSync(cachePath)) {
      console.log("⚡ Cache hit — returning saved result");
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      return res.json(cached);
    }

    // Prepare repo path
    const repoName = repoUrl.split("/").pop().replace(".git", "");
    const repoPath = path.join(REPO_DIR, repoName);

    // 🚀 STEP 2 — CLONE OR PULL
    if (!fs.existsSync(repoPath)) {
      console.log("📥 Cloning fresh repo...");
      await simpleGit().clone(repoUrl, repoPath);
    } else {
      console.log("🔄 Repo exists. Pulling latest changes...");
      await simpleGit(repoPath).pull();
    }

    console.log("📂 Scanning repository...");
    const files = scanDirectory(repoPath);
    const languages = detectLanguages(files);

    const readme = getReadme(repoPath);
    const dependencies = getPackageJsonDependencies(repoPath);
    const folderTree = buildFolderTree(repoPath, 2);

// 🔥 STEP 1 — FILTER IMPORTANT FILES (token control)
const importantFiles = filterImportantFiles(files);

const repoData = {
  files: importantFiles,
  languages,
  dependencies,
  folderTree,
};

// 🔥 STEP 2 — AI UNDERSTANDS PROJECT (with error handling)
console.log("🧠 AI Step 1: Understanding repository...");
let understanding;
try {
  const understandingRaw = await aiUnderstandRepo(repoData);
  understanding = JSON.parse(cleanJSON(understandingRaw));
} catch (err) {
  console.log("⚠️ AI understanding failed:", err.message);
  understanding = {
    project_summary: "Analysis unavailable - timeout/network error",
    tech_stack: repoData.languages,
    architecture: "unknown"
  };
}

// 🔥 STEP 3 — AI GENERATES DIAGRAMS (safe)
console.log("📊 AI Step 2: Generating diagrams...");
let diagrams;
try {
  const diagramsRaw = await aiGenerateDiagrams(JSON.stringify(understanding), repoData);
  diagrams = JSON.parse(cleanJSON(diagramsRaw));
} catch (err) {
  console.log("⚠️ AI diagrams failed:", err.message);
  diagrams = { ideas: [] };
}

const aiResult = {
  project_understanding: understanding,
  diagrams: diagrams,
};
    const finalResponse = {
      message: "Repository analyzed successfully 🚀",
      totalFiles: files.length,
      languages,
      aiAnalysis: aiResult
    };

    // 🚀 STEP 3 — SAVE CACHE
    fs.writeFileSync(cachePath, JSON.stringify(finalResponse, null, 2));
    console.log("💾 Cache saved");

    res.json(finalResponse);

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to analyze repo");
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});