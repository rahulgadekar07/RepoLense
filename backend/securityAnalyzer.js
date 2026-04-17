const fs = require("fs");
const path = require("path");

async function analyzeSecurityRisks(repoPath, files, dependencies) {
  const risks = {
    vulnerabilities: [],
    secretsFound: [],
    outdatedDependencies: [],
    riskScore: 0,
  };

  // Check for hardcoded secrets
  for (const file of files.slice(0, 30)) {
    if (![".js", ".ts", ".jsx", ".tsx", ".env", ".json"].some((ext) => file.endsWith(ext)))
      continue;

    try {
      // Handle both relative and absolute paths
      let filePath = file;
      if (!file.startsWith(repoPath)) {
        filePath = path.join(repoPath, file);
      }

      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf-8");
      const secrets = detectSecrets(content, file);
      if (secrets.length > 0) {
        risks.secretsFound.push(...secrets);
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  // Check dependency vulnerabilities (simplified)
  if (dependencies && dependencies.dependencies) {
    const depList = Object.keys(dependencies.dependencies);
    const vulnerablePackages = checkVulnerablePackages(depList);
    risks.vulnerabilities.push(...vulnerablePackages);

    // Check for outdated packages
    const outdated = checkOutdatedPackages(dependencies.dependencies);
    risks.outdatedDependencies.push(...outdated);
  }

  // Calculate risk score
  risks.riskScore = calculateSecurityScore(risks);

  return {
    security: {
      riskLevel: risks.riskScore > 70 ? "HIGH" : risks.riskScore > 40 ? "MEDIUM" : "LOW",
      score: risks.riskScore,
      vulnerabilities: risks.vulnerabilities.slice(0, 5),
      secrets: risks.secretsFound.slice(0, 5),
      outdatedDeps: risks.outdatedDependencies.slice(0, 5),
      recommendations: generateSecurityRecommendations(risks),
    },
  };
}

function detectSecrets(content, filename) {
  const secrets = [];
  const patterns = [
    { regex: /api[_-]?key\s*[=:]\s*['"]([^'"]+)['"]/gi, type: "API Key" },
    { regex: /password\s*[=:]\s*['"]([^'"]+)['"]/gi, type: "Password" },
    { regex: /secret\s*[=:]\s*['"]([^'"]+)['"]/gi, type: "Secret" },
    { regex: /token\s*[=:]\s*['"]([^'"]+)['"]/gi, type: "Token" },
    { regex: /AKIA[0-9A-Z]{16}/g, type: "AWS Key" },
    { regex: /-----BEGIN RSA PRIVATE KEY-----/g, type: "Private Key" },
    { regex: /mongodb\+srv:\/\/\w+:\w+@/gi, type: "MongoDB URI" },
  ];

  patterns.forEach(({ regex, type }) => {
    if (regex.test(content)) {
      secrets.push({
        type,
        file: filename,
        severity: "CRITICAL",
      });
    }
  });

  return secrets;
}

function checkVulnerablePackages(packages) {
  // Common known vulnerable packages
  const vulnPackages = {
    "lodash": "0.1.0",
    "moment": "2.29.1",
    "express": "3.0.0",
    "react": "16.0.0",
  };

  const found = [];
  packages.forEach((pkg) => {
    if (vulnPackages[pkg.split("@")[0]]) {
      found.push({
        package: pkg,
        type: "Potential Vulnerability",
        action: "Update to latest version",
      });
    }
  });

  return found;
}

function checkOutdatedPackages(deps) {
  const outdated = [];
  // In real scenario, you'd check npm registry
  const majorVersionPackages = Object.entries(deps || {})
    .filter(([name, version]) => /^\d+\.\d+\.\d+/.test(version))
    .slice(0, 5);

  return majorVersionPackages.map(([name, version]) => ({
    package: name,
    currentVersion: version,
    type: "Potentially Outdated",
  }));
}

function calculateSecurityScore(risks) {
  let score = 100;

  // Critical issues
  score -= risks.secretsFound.length * 30;

  // Vulnerabilities
  score -= risks.vulnerabilities.length * 15;

  // Outdated dependencies
  score -= risks.outdatedDependencies.length * 5;

  return Math.max(0, Math.min(100, score));
}

function generateSecurityRecommendations(risks) {
  const recommendations = [];

  if (risks.secretsFound.length > 0) {
    recommendations.push("🔴 CRITICAL: Move secrets to .env files and use environment variables");
  }

  if (risks.vulnerabilities.length > 0) {
    recommendations.push("Update vulnerable dependencies immediately");
  }

  if (risks.outdatedDependencies.length > 0) {
    recommendations.push("Run 'npm audit fix' to update dependencies");
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ No critical security issues found");
  }

  return recommendations;
}

module.exports = analyzeSecurityRisks;
