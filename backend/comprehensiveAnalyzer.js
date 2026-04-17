// Comprehensive Analysis Integration
const analyzeCodeQuality = require("./codeQualityAnalyzer");
const analyzeSecurityRisks = require("./securityAnalyzer");
const analyzeGitHealth = require("./gitHealthAnalyzer");
const analyzePerformance = require("./performanceAnalyzer");
const generateVisualizations = require("./visualizationGenerator");
const calculateProjectMaturityScore = require("./projectMaturityAnalyzer");

async function runComprehensiveAnalysis(repoPath, repoData) {
  try {
    console.log("🔍 Starting comprehensive analysis...");

    // Run all analyzers in parallel where possible
    const results = await Promise.allSettled([
      analyzeCodeQuality(repoPath, repoData.files),
      analyzeSecurityRisks(repoPath, repoData.files, repoData.dependencies),
      analyzeGitHealth(repoPath),
      analyzePerformance(repoPath, repoData.files, repoData.techStack),
    ]);

    // Handle promise results with fallbacks
    const codeQuality = results[0].status === 'fulfilled' ? results[0].value : { codeQuality: { score: 50, complexity: {}, duplication: 0 } };
    const security = results[1].status === 'fulfilled' ? results[1].value : { security: { score: 50, riskLevel: "UNKNOWN", vulnerabilities: [] } };
    const gitHealth = results[2].status === 'fulfilled' ? results[2].value : { gitHealth: { healthScore: 0 } };
    const performance = results[3].status === 'fulfilled' ? results[3].value : { performance: { healthScore: 50, bundleSize: { total: "Unknown" } } };

    if (results[0].status === 'rejected') console.log("❌ Code Quality failed:", results[0].reason);
    if (results[1].status === 'rejected') console.log("❌ Security failed:", results[1].reason);
    if (results[2].status === 'rejected') console.log("❌ Git Health failed:", results[2].reason);
    if (results[3].status === 'rejected') console.log("❌ Performance failed:", results[3].reason);

    console.log("✅ Basic analyzers complete");

    // Generate visualizations
    const visualizations = await generateVisualizations(
      repoData,
      codeQuality,
      security,
      gitHealth,
      performance
    );

    console.log("✅ Visualizations generated");

    // Calculate project maturity
    const maturity = await calculateProjectMaturityScore(
      codeQuality,
      security,
      gitHealth,
      performance,
      repoData
    );

    console.log("✅ Maturity score calculated");

    return {
      analysis: {
        codeQuality,
        security,
        gitHealth,
        performance,
        projectMaturity: maturity.projectMaturity,
      },
      visualizations: visualizations.visualizations,
      summary: generateAnalysisSummary(
        codeQuality,
        security,
        gitHealth,
        performance,
        maturity
      ),
    };
  } catch (err) {
    console.error("❌ Comprehensive analysis failed:", err);
    return {
      error: "Analysis failed",
      message: err.message,
    };
  }
}

function generateAnalysisSummary(codeQuality, security, gitHealth, performance, maturity) {
  const {
    score: cqScore = 0,
  } = codeQuality?.codeQuality || {};
  const { score: secScore = 0 } = security?.security || {};
  const { healthScore: ghScore = 0 } = gitHealth?.gitHealth || {};
  const { healthScore: perfScore = 0 } = performance?.performance || {};
  const { overallScore } = maturity?.projectMaturity || {};

  return {
    timestamp: new Date().toISOString(),
    overallHealthScore: overallScore || 0,
    scores: {
      codeQuality: cqScore,
      security: secScore,
      gitHealth: ghScore,
      performance: perfScore,
    },
    status:
      overallScore >= 80
        ? "✅ EXCELLENT"
        : overallScore >= 60
        ? "🟡 GOOD"
        : overallScore >= 40
        ? "⚠️ FAIR"
        : "🔴 NEEDS WORK",
    keyInsights: generateKeyInsights(
      codeQuality,
      security,
      gitHealth,
      performance
    ),
  };
}

function generateKeyInsights(codeQuality, security, gitHealth, performance) {
  const insights = [];

  // Code quality insights
  const cqMetrics = codeQuality?.codeQuality || {};
  if (cqMetrics.complexity?.average > 10) {
    insights.push("⚠️ Code complexity is above average - consider refactoring");
  }
  if (cqMetrics.codeSmells?.length > 5) {
    insights.push(`🔍 Found ${cqMetrics.codeSmells.length} code smells that need attention`);
  }

  // Security insights
  const secMetrics = security?.security || {};
  if (secMetrics.secrets?.length > 0) {
    insights.push("🔴 CRITICAL: Hardcoded secrets found - move to environment variables");
  }
  if (secMetrics.vulnerabilities?.length > 0) {
    insights.push(`🛡️ ${secMetrics.vulnerabilities.length} vulnerabilities detected`);
  }

  // Git health insights
  const ghMetrics = gitHealth?.gitHealth || {};
  if (ghMetrics.stats?.totalCommits > 100) {
    insights.push("✅ Project has healthy commit history");
  }
  if (ghMetrics.stats?.contributors > 5) {
    insights.push("👥 Good team collaboration detected");
  }

  // Performance insights
  const perfMetrics = performance?.performance || {};
  if (perfMetrics.bundleSize?.total) {
    insights.push(`📦 Bundle size: ${perfMetrics.bundleSize.total}`);
  }

  return insights.slice(0, 5);
}

module.exports = {
  runComprehensiveAnalysis,
  generateAnalysisSummary,
};
