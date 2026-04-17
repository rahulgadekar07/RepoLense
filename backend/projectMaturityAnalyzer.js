async function calculateProjectMaturityScore(
  codeQuality,
  security,
  gitHealth,
  performance,
  repoData
) {
  const scores = {
    codeQuality: codeQuality?.codeQuality?.score || 0,
    security: security?.security?.score || 0,
    gitHealth: gitHealth?.gitHealth?.healthScore || 0,
    performance: performance?.performance?.healthScore || 0,
  };

  // Calculate maturity level based on various factors
  const maturityFactors = {
    hasTests: repoData.files?.some(
      (f) => f.includes("test") || f.includes("spec")
    ) ? 15 : 0,
    hasCI: repoData.files?.some(
      (f) => f.includes(".github") || f.includes(".gitlab-ci") || f.includes("jenkinsfile")
    ) ? 15 : 0,
    hasDocumentation: repoData.readme && repoData.readme.length > 200 ? 20 : 0,
    hasLicense: repoData.files?.some(
      (f) => f.toLowerCase().includes("license")
    ) ? 10 : 0,
    hasChangelog: repoData.files?.some(
      (f) => f.toLowerCase().includes("changelog")
    ) ? 10 : 0,
    hasPackageJson: repoData.files?.some(
      (f) => f.endsWith("package.json")
    ) ? 10 : 0,
    multipleContributors: (gitHealth?.gitHealth?.stats?.contributors || 0) > 2 ? 10 : 0,
  };

  const maturityScore =
    Object.values(maturityFactors).reduce((a, b) => a + b, 0);

  const overallScore = Math.round(
    (scores.codeQuality * 0.25 +
      scores.security * 0.25 +
      scores.gitHealth * 0.25 +
      scores.performance * 0.15 +
      maturityScore * 0.1) /
    1
  );

  const maturityLevel = getMaturityLevel(overallScore);
  const riskFactors = identifyRiskFactors(
    scores,
    repoData,
    gitHealth,
    security
  );
  const recommendations = generateMaturityRecommendations(
    maturityFactors,
    scores,
    riskFactors
  );

  return {
    projectMaturity: {
      overallScore: Math.min(100, overallScore),
      maturityLevel,
      scoreBreakdown: scores,
      maturityFactors,
      riskLevel:
        overallScore >= 80
          ? "LOW"
          : overallScore >= 60
          ? "MEDIUM"
          : "HIGH",
      riskFactors: riskFactors.slice(0, 5),
      recommendations,
      summary: generateMaturitySummary(
        overallScore,
        maturityLevel,
        scores
      ),
    },
  };
}

function getMaturityLevel(score) {
  if (score >= 90) return "🚀 Production Ready";
  if (score >= 75) return "✅ Well-Maintained";
  if (score >= 60) return "⚠️ Developing";
  if (score >= 40) return "🟡 Early Stage";
  return "🔴 Needs Development";
}

function identifyRiskFactors(scores, repoData, gitHealth, security) {
  const risks = [];

  if (scores.codeQuality < 50) {
    risks.push({
      factor: "Low Code Quality",
      severity: "HIGH",
      impact: "Increased bugs and maintenance costs",
    });
  }

  if (scores.security < 60) {
    risks.push({
      factor: "Security Vulnerabilities",
      severity: "CRITICAL",
      impact: "Potential data breach or unauthorized access",
    });
  }

  if (scores.gitHealth < 50) {
    risks.push({
      factor: "Poor Version Control",
      severity: "MEDIUM",
      impact: "Difficult collaboration and history tracking",
    });
  }

  if (scores.performance < 50) {
    risks.push({
      factor: "Performance Issues",
      severity: "MEDIUM",
      impact: "Poor user experience and slow load times",
    });
  }

  if (!repoData.files?.some((f) => f.includes("test"))) {
    risks.push({
      factor: "No Tests Found",
      severity: "MEDIUM",
      impact: "Risk of regressions and unstable releases",
    });
  }

  if (!repoData.readme || repoData.readme.length < 100) {
    risks.push({
      factor: "Insufficient Documentation",
      severity: "LOW",
      impact: "Difficulty for new developers to onboard",
    });
  }

  return risks;
}

function generateMaturityRecommendations(maturityFactors, scores, risks) {
  const recommendations = [];

  // High priority recommendations
  if (maturityFactors.hasTests === 0) {
    recommendations.push({
      priority: "CRITICAL",
      action: "Add automated tests",
      description:
        "Implement unit tests and integration tests to ensure code reliability",
    });
  }

  if (scores.security < 70) {
    recommendations.push({
      priority: "CRITICAL",
      action: "Address security vulnerabilities",
      description: "Update dependencies and remove hardcoded secrets",
    });
  }

  if (maturityFactors.hasCI === 0) {
    recommendations.push({
      priority: "HIGH",
      action: "Set up CI/CD pipeline",
      description: "Implement GitHub Actions, GitLab CI, or similar",
    });
  }

  if (maturityFactors.hasDocumentation === 0) {
    recommendations.push({
      priority: "HIGH",
      action: "Improve documentation",
      description: "Expand README with setup, usage, and API documentation",
    });
  }

  if (maturityFactors.hasLicense === 0) {
    recommendations.push({
      priority: "MEDIUM",
      action: "Add LICENSE file",
      description: "Choose and add an appropriate open source license",
    });
  }

  if (maturityFactors.hasChangelog === 0) {
    recommendations.push({
      priority: "MEDIUM",
      action: "Create CHANGELOG",
      description:
        "Document version history and changes for each release",
    });
  }

  if (scores.codeQuality < 70) {
    recommendations.push({
      priority: "MEDIUM",
      action: "Refactor code",
      description: "Reduce complexity and improve code structure",
    });
  }

  return recommendations.slice(0, 5);
}

function generateMaturitySummary(score, level, scores) {
  let summary = `Project Maturity: ${level}\n\n`;

  summary += `This project is at a ${level} stage with an overall health score of ${score}/100.\n\n`;

  summary += `Key Metrics:\n`;
  summary += `• Code Quality: ${scores.codeQuality}/100 - ${scores.codeQuality >= 70 ? "Good" : "Needs improvement"}\n`;
  summary += `• Security: ${scores.security}/100 - ${scores.security >= 70 ? "Secure" : "Has vulnerabilities"}\n`;
  summary += `• Git Health: ${scores.gitHealth}/100 - ${scores.gitHealth >= 70 ? "Active" : "Inactive"}\n`;
  summary += `• Performance: ${scores.performance}/100 - ${scores.performance >= 70 ? "Optimized" : "Needs optimization"}\n\n`;

  if (score >= 80) {
    summary += "✅ This project is ready for production use.";
  } else if (score >= 60) {
    summary += "⚠️ This project is functional but could use improvements.";
  } else {
    summary += "🔴 This project needs significant improvements before production use.";
  }

  return summary;
}

module.exports = calculateProjectMaturityScore;
