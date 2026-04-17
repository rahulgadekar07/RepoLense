const fs = require("fs");
const path = require("path");

async function analyzeCodeQuality(repoPath, files) {
  const metrics = {
    totalFiles: files.length,
    fileMetrics: [],
    averageComplexity: 0,
    duplicateRisk: 0,
    codeSmells: [],
    averageFileSize: 0,
    commentRatio: 0,
  };

  let totalLines = 0;
  let totalComments = 0;
  let complexitySum = 0;

  for (const file of files.slice(0, 50)) {
    // Analyze top 50 files
    if (!isSourceFile(file)) continue;

    try {
      // Handle both relative and absolute paths
      let filePath = file;
      if (!file.startsWith(repoPath)) {
        filePath = path.join(repoPath, file);
      }

      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const lineCount = lines.length;
      totalLines += lineCount;

      // Calculate complexity (simple heuristic)
      const complexity = calculateCyclomaticComplexity(content);
      complexitySum += complexity;

      // Count comments
      const commentCount = (content.match(/\/\/|\/\*|\*\//g) || []).length;
      totalComments += commentCount;

      // Detect code smells
      const smells = detectCodeSmells(content, file);

      metrics.fileMetrics.push({
        file: file.split("/").pop() || file,
        lines: lineCount,
        complexity,
        commentDensity: lineCount > 0 ? commentCount / lineCount : 0,
        codeSmells: smells,
        size: content.length,
      });
    } catch (e) {
      console.log(`⚠️ Could not analyze ${file}:`, e.message);
    }
  }

  metrics.averageComplexity =
    complexitySum / Math.max(metrics.fileMetrics.length, 1);
  metrics.commentRatio = totalLines > 0 ? totalComments / totalLines : 0;
  metrics.averageFileSize = totalLines / Math.max(metrics.fileMetrics.length, 1);

  // Identify high complexity files
  const highComplexityFiles = metrics.fileMetrics
    .filter((f) => f.complexity > 15)
    .map((f) => f.file);

  // Collect all code smells
  metrics.codeSmells = metrics.fileMetrics.flatMap((f) => f.codeSmells);

  // Calculate duplicate risk
  metrics.duplicateRisk = detectDuplicates(metrics.fileMetrics);

  return {
    codeQuality: {
      score: calculateQualityScore(metrics),
      complexity: {
        average: Math.round(metrics.averageComplexity * 100) / 100,
        high: highComplexityFiles.slice(0, 5),
      },
      duplication: metrics.duplicateRisk,
      comments: {
        ratio: Math.round(metrics.commentRatio * 10000) / 100 + "%",
        quality: metrics.commentRatio > 0.15 ? "Good" : "Low",
      },
      codeSmells: metrics.codeSmells.slice(0, 10),
      totalFilesAnalyzed: metrics.fileMetrics.length,
    },
  };
}

function calculateCyclomaticComplexity(code) {
  const patterns = [
    /if\s*\(/g,
    /else\s*if\s*\(/g,
    /switch\s*\(/g,
    /case\s+/g,
    /catch\s*\(/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /&&/g,
    /\|\|/g,
    /\?/g,
  ];

  let complexity = 1;
  patterns.forEach((pattern) => {
    const matches = code.match(pattern) || [];
    complexity += matches.length;
  });
  return complexity;
}

function detectCodeSmells(code, filename) {
  const smells = [];

  // Long method detection
  const functions = code.match(/function|const\s+\w+\s*=/g) || [];
  if (functions.length > 0) {
    const avgFunctionSize = code.length / functions.length;
    if (avgFunctionSize > 500) {
      smells.push("Long methods detected");
    }
  }

  // Magic numbers
  if (/\b[0-9]{3,}\b/.test(code)) {
    smells.push("Magic numbers found");
  }

  // Deep nesting
  const nestingLevel = Math.max(
    ...(code.match(/({|})/g) || []).reduce((acc, char, idx, arr) => {
      if (char === "{") acc.push(acc[acc.length - 1] + 1);
      else acc.pop();
      return acc;
    }, [0])
  );
  if (nestingLevel > 5) {
    smells.push(`Deep nesting detected (level ${nestingLevel})`);
  }

  // TODO/FIXME comments
  if (/TODO|FIXME|HACK|XXX/.test(code)) {
    smells.push("TODO/FIXME comments found");
  }

  return smells;
}

function detectDuplicates(fileMetrics) {
  if (fileMetrics.length === 0) return 0;

  let duplicateChance = 0;
  const sizes = fileMetrics.map((f) => f.size);
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;

  // High variance = similar patterns = duplication risk
  duplicateChance = Math.min(100, Math.round((variance / avgSize) * 10));
  return duplicateChance;
}

function calculateQualityScore(metrics) {
  let score = 100;

  // Deduct for high complexity
  if (metrics.averageComplexity > 10) {
    score -= (metrics.averageComplexity - 10) * 2;
  }

  // Deduct for low comments
  if (metrics.commentRatio < 0.1) {
    score -= 15;
  }

  // Deduct for code smells
  score -= metrics.codeSmells.length * 2;

  return Math.max(0, Math.round(score));
}

function isSourceFile(file) {
  const extensions = [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".cpp", ".go"];
  return extensions.some((ext) => file.endsWith(ext));
}

module.exports = analyzeCodeQuality;
