const { execSync } = require("child_process");
const fs = require("fs");

async function analyzeGitHealth(repoPath) {
  const gitMetrics = {
    commitCount: 0,
    contributors: 0,
    branches: 0,
    lastCommitDate: null,
    activityTrend: [],
    strategy: "unknown",
  };

  try {
    // Check if it's a git repo
    if (!fs.existsSync(`${repoPath}/.git`)) {
      return { gitHealth: { notAGitRepo: true, message: "Not a git repository" } };
    }

    // Get commit count
    try {
      gitMetrics.commitCount = parseInt(
        execSync(`cd "${repoPath}" && git rev-list --count HEAD`).toString().trim()
      );
    } catch (e) {
      gitMetrics.commitCount = 0;
    }

    // Get contributor count
    try {
      const contributors = execSync(
        `cd "${repoPath}" && git shortlog -sn --all`
      )
        .toString()
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      gitMetrics.contributors = contributors.length;
    } catch (e) {
      gitMetrics.contributors = 0;
    }

    // Get branches
    try {
      const branches = execSync(`cd "${repoPath}" && git branch -a`)
        .toString()
        .trim()
        .split("\n");
      gitMetrics.branches = branches.filter((b) => b.trim()).length;
    } catch (e) {
      gitMetrics.branches = 0;
    }

    // Get last commit date
    try {
      const lastCommit = execSync(
        `cd "${repoPath}" && git log -1 --format=%ai`
      )
        .toString()
        .trim();
      gitMetrics.lastCommitDate = lastCommit;
    } catch (e) {
      gitMetrics.lastCommitDate = "Unknown";
    }

    // Get commit activity (last 12 months)
    try {
      const logs = execSync(
        `cd "${repoPath}" && git log --oneline --all --date=short --pretty=format:%ai`
      )
        .toString()
        .trim()
        .split("\n");

      const monthCounts = {};
      logs.forEach((line) => {
        const month = line.substring(0, 7); // YYYY-MM
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      gitMetrics.activityTrend = Object.entries(monthCounts)
        .sort()
        .slice(-12)
        .map(([month, count]) => ({ month, commits: count }));
    } catch (e) {
      gitMetrics.activityTrend = [];
    }

    // Detect git strategy
    gitMetrics.strategy = detectGitStrategy(repoPath);
  } catch (e) {
    return { gitHealth: { error: "Could not analyze git repository" } };
  }

  return {
    gitHealth: {
      healthScore: calculateGitHealthScore(gitMetrics),
      stats: {
        totalCommits: gitMetrics.commitCount,
        contributors: gitMetrics.contributors,
        branches: gitMetrics.branches,
        lastUpdate: gitMetrics.lastCommitDate,
        strategy: gitMetrics.strategy,
      },
      activity: {
        trend: gitMetrics.activityTrend.slice(-6),
        frequency:
          gitMetrics.commitCount > 100
            ? "Active"
            : gitMetrics.commitCount > 20
            ? "Moderate"
            : "Low",
      },
      recommendations: getGitRecommendations(gitMetrics),
    },
  };
}

function detectGitStrategy(repoPath) {
  try {
    const branches = execSync(`cd "${repoPath}" && git branch -a`)
      .toString()
      .toLowerCase();

    if (
      branches.includes("develop") ||
      branches.includes("development")
    ) {
      return "GitFlow";
    } else if (branches.includes("release/") || branches.includes("hotfix/")) {
      return "GitFlow";
    } else if (branches.match(/main|master/)) {
      return "Trunk-based";
    }

    return "Custom";
  } catch (e) {
    return "Unknown";
  }
}

function calculateGitHealthScore(metrics) {
  let score = 50; // Base score

  // Active commits boost
  if (metrics.commitCount > 100) score += 20;
  else if (metrics.commitCount > 30) score += 10;

  // Multiple contributors boost
  if (metrics.contributors > 5) score += 15;
  else if (metrics.contributors > 1) score += 8;

  // Branch strategy boost
  if (metrics.strategy !== "unknown") score += 10;

  // Recent activity boost
  if (metrics.lastCommitDate !== "Unknown") {
    const lastDate = new Date(metrics.lastCommitDate);
    const daysSinceUpdate = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) score += 15;
    else if (daysSinceUpdate < 90) score += 8;
  }

  return Math.min(100, score);
}

function getGitRecommendations(metrics) {
  const recs = [];

  if (metrics.commitCount < 10) {
    recs.push("⚠️ Very few commits - project may be new or inactive");
  }

  if (metrics.contributors < 2) {
    recs.push("Single contributor - consider team collaboration");
  }

  if (metrics.strategy === "unknown") {
    recs.push("Define a clear git branching strategy (GitFlow/Trunk-based)");
  }

  if (metrics.lastCommitDate !== "Unknown") {
    const lastDate = new Date(metrics.lastCommitDate);
    const daysSinceUpdate = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 365) {
      recs.push("⚠️ No commits in over a year - project may be inactive");
    }
  }

  if (recs.length === 0) {
    recs.push("✅ Healthy git repository");
  }

  return recs;
}

module.exports = analyzeGitHealth;
