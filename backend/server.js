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
  detectTechStack,
  getReadme,
  getPackageJsonDependencies,
  buildFolderTree
} = require("./repoUtils");
const { filterImportantFiles } = require("./repoFilter");
const aiUnderstandRepo = require("./aiUnderstandRepo");
const aiGenerateDiagrams = require("./aiGenerateDiagrams");

function getRepoId(repoUrl) {
  return crypto.createHash("md5").update(repoUrl).digest("hex");
}

const app = express();
app.use(cors());
app.use(express.json());

const REPO_DIR = path.join(__dirname, "repos");
const CACHE_DIR = path.join(__dirname, "cache");

if (!fs.existsSync(REPO_DIR)) fs.mkdirSync(REPO_DIR);
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

app.get("/", (req, res) => {
  res.send("RepoLens Node backend running 🚀");
});

// ─── Helper to send SSE events ────────────────────────────────────────────────
function sendProgress(res, progress, message, data = null) {
  const payload = JSON.stringify({ progress, message, data });
  res.write(`data: ${payload}\n\n`);
}

// ─── STREAMING ENDPOINT (SSE) ─────────────────────────────────────────────────
// GET /analyze-repo-stream?url=...&refresh=true
app.get("/analyze-repo-stream", async (req, res) => {
  const { url: repoUrl, refresh } = req.query;
  const forceRefresh = refresh === "true";

  if (!repoUrl) {
    res.status(400).send("Missing url param");
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Keep-alive ping every 15s so the connection doesn't time out
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 15000);

  const finish = (data) => {
    clearInterval(keepAlive);
    const payload = JSON.stringify({ progress: 100, message: "ANALYSIS COMPLETE", result: data });
    res.write(`data: ${payload}\n\n`);
    res.end();
  };

  const fail = (msg) => {
    clearInterval(keepAlive);
    const payload = JSON.stringify({ progress: -1, message: msg });
    res.write(`data: ${payload}\n\n`);
    res.end();
  };

  try {
    console.log("Incoming repo:", repoUrl, forceRefresh ? "🔄 FORCE REFRESH" : "");

    const repoId = getRepoId(repoUrl);
    const cachePath = path.join(CACHE_DIR, repoId + ".json");

    // ── STEP 0 — CACHE HIT ──────────────────────────────────────────────────
    if (fs.existsSync(cachePath) && !forceRefresh) {
      console.log("⚡ Cache hit — returning saved result");
      sendProgress(res, 20,  "CACHE FOUND · LOADING RESULT...");
      await delay(400);
      sendProgress(res, 60,  "RESTORING FROM CACHE...");
      await delay(400);
      sendProgress(res, 90,  "PREPARING RESPONSE...");
      await delay(300);
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      finish({ ...cached, cached: true });
      return;
    }

    if (forceRefresh && fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
      console.log("🗑️ Cache cleared for refresh");
    }

    // ── STEP 1 — CLONE / PULL (0 → 25%) ────────────────────────────────────
    sendProgress(res, 5, "INITIALIZING...");

    const repoName = repoUrl.split("/").pop().replace(".git", "");
    const repoPath = path.join(REPO_DIR, repoName);

    if (!fs.existsSync(repoPath)) {
      sendProgress(res, 10, "CLONING REPOSITORY...");
      console.log("📥 Cloning fresh repo...");
      await simpleGit().clone(repoUrl, repoPath);
    } else {
      sendProgress(res, 10, "PULLING LATEST CHANGES...");
      console.log("🔄 Repo exists. Pulling latest changes...");
      await simpleGit(repoPath).pull();
    }

    sendProgress(res, 20, "SCANNING FILE TREE...");
    console.log("📂 Scanning repository...");
    let files = scanDirectory(repoPath);
    if (!files || !Array.isArray(files)) files = [];
    console.log(`📂 Total files scanned: ${files.length}`);

    const languages = detectLanguages(files);
    const readme = getReadme(repoPath);
    const dependencies = getPackageJsonDependencies(repoPath, files);
    const folderTree = buildFolderTree(repoPath, 2);
    const techStack = detectTechStack(repoPath, files);
    console.log("🔍 Detected tech stack:", techStack);

    const importantFiles = filterImportantFiles(files);

    sendProgress(res, 25, `REPO CLONED · ${files.length} FILES · ${techStack.length} TECHNOLOGIES DETECTED`);

    // ── STEP 2 — AI UNDERSTAND (25 → 50%) ──────────────────────────────────
    sendProgress(res, 30, "INITIALIZING AI ANALYSIS...");
    await delay(200);
    sendProgress(res, 40, "UNDERSTANDING PROJECT STRUCTURE...");

    const repoData = { files: importantFiles, languages, techStack, dependencies, folderTree, readme };

    console.log("🧠 AI Step 1: Understanding repository...");
    let understanding;
    try {
      sendProgress(res, 45, "AI IS READING YOUR CODE...");
      const understandingRaw = await aiUnderstandRepo(repoData);
      console.log("📝 Raw understanding:", understandingRaw.slice(0, 200));
      understanding = JSON.parse(cleanJSON(understandingRaw));
    } catch (err) {
      console.log("⚠️ AI understanding failed:", err.message);
      understanding = {
        project_summary: `A ${languages.join("/")} project with ${files.length} files.`,
        tech_stack: techStack.length > 0 ? techStack : languages,
        architecture: "Could not determine"
      };
    }

    sendProgress(res, 50, "PROJECT UNDERSTOOD · GENERATING DIAGRAMS...");

    // ── STEP 3 — AI DIAGRAMS (50 → 75%) ────────────────────────────────────
    sendProgress(res, 55, "BUILDING DIAGRAM PROMPTS...");
    await delay(200);
    sendProgress(res, 65, "AI IS GENERATING MERMAID DIAGRAMS...");

    console.log("📊 AI Step 2: Generating diagrams...");
    let diagrams;
    try {
      const diagramsRaw = await aiGenerateDiagrams(JSON.stringify(understanding));
      console.log("📝 Raw diagrams:", diagramsRaw.slice(0, 200));
      diagrams = JSON.parse(cleanJSON(diagramsRaw));
    } catch (err) {
      console.log("⚠️ AI diagrams failed:", err.message);
      diagrams = { diagrams: [] };
    }

    sendProgress(res, 75, `DIAGRAMS READY · ${diagrams?.diagrams?.length || 0} GENERATED`);

    // ── STEP 4 — FINALIZE (75 → 100%) ──────────────────────────────────────
    sendProgress(res, 85, "ASSEMBLING FINAL REPORT...");
    await delay(300);

    const aiResult = {
      project_understanding: understanding,
      diagrams: diagrams,
    };

    const finalResponse = {
      message: "Repository analyzed successfully 🚀",
      totalFiles: files.length,
      languages,
      techStack,
      cached: false,
      aiAnalysis: aiResult
    };

    // Save cache
    fs.writeFileSync(cachePath, JSON.stringify(finalResponse, null, 2));
    console.log("💾 Cache saved");

    sendProgress(res, 95, "SAVING TO CACHE...");
    await delay(200);

    finish(finalResponse);

  } catch (err) {
    console.error("💥 Fatal error:", err.message);
    fail(`FATAL ERROR: ${err.message}`);
  }
});

// ─── ORIGINAL JSON ENDPOINT (kept for compatibility) ──────────────────────────
app.post("/analyze-repo", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    const forceRefresh = req.query.refresh === "true";

    console.log("Incoming repo:", repoUrl, forceRefresh ? "🔄 FORCE REFRESH" : "");

    const repoId = getRepoId(repoUrl);
    const cachePath = path.join(CACHE_DIR, repoId + ".json");

    if (fs.existsSync(cachePath) && !forceRefresh) {
      console.log("⚡ Cache hit — returning saved result");
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      return res.json({ ...cached, cached: true });
    }

    if (forceRefresh && fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
      console.log("🗑️ Cache cleared for refresh");
    }

    const repoName = repoUrl.split("/").pop().replace(".git", "");
    const repoPath = path.join(REPO_DIR, repoName);

    if (!fs.existsSync(repoPath)) {
      console.log("📥 Cloning fresh repo...");
      await simpleGit().clone(repoUrl, repoPath);
    } else {
      console.log("🔄 Repo exists. Pulling latest changes...");
      await simpleGit(repoPath).pull();
    }

    console.log("📂 Scanning repository...");
    let files = scanDirectory(repoPath);
    if (!files || !Array.isArray(files)) files = [];
    console.log(`📂 Total files scanned: ${files.length}`);

    const languages = detectLanguages(files);
    const readme = getReadme(repoPath);
    const dependencies = getPackageJsonDependencies(repoPath, files);
    const folderTree = buildFolderTree(repoPath, 2);
    const techStack = detectTechStack(repoPath, files);
    const importantFiles = filterImportantFiles(files);

    const repoData = { files: importantFiles, languages, techStack, dependencies, folderTree, readme };

    console.log("🧠 AI Step 1: Understanding repository...");
    let understanding;
    try {
      const understandingRaw = await aiUnderstandRepo(repoData);
      understanding = JSON.parse(cleanJSON(understandingRaw));
    } catch (err) {
      understanding = {
        project_summary: `A ${languages.join("/")} project with ${files.length} files.`,
        tech_stack: techStack.length > 0 ? techStack : languages,
        architecture: "Could not determine"
      };
    }

    console.log("📊 AI Step 2: Generating diagrams...");
    let diagrams;
    try {
      const diagramsRaw = await aiGenerateDiagrams(JSON.stringify(understanding));
      diagrams = JSON.parse(cleanJSON(diagramsRaw));
    } catch (err) {
      diagrams = { diagrams: [] };
    }

    const aiResult = { project_understanding: understanding, diagrams };
    const finalResponse = {
      message: "Repository analyzed successfully 🚀",
      totalFiles: files.length,
      languages,
      techStack,
      cached: false,
      aiAnalysis: aiResult
    };

    fs.writeFileSync(cachePath, JSON.stringify(finalResponse, null, 2));
    res.json(finalResponse);

  } catch (err) {
    console.error("💥 Fatal error:", err.message);
    res.status(500).send("Failed to analyze repo");
  }
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});