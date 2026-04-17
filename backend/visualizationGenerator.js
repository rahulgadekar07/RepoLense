const fs = require("fs");
const path = require("path");

async function generateVisualizations(repoData, codeQuality, security, gitHealth, performance) {
  const visualizations = {
    dependencyGraph: generateDependencyGraph(repoData),
    architectureDiagram: generateArchitectureDiagram(repoData),
    fileHeatmap: generateFileHeatmap(codeQuality),
    techStackVisual: generateTechStackVisual(repoData.techStack),
    metricsChart: generateMetricsChart(
      codeQuality,
      security,
      gitHealth,
      performance
    ),
  };

  return {
    visualizations,
  };
}

// Sanitize node IDs for mermaid (handle special characters like @ and /)
function sanitizeId(id) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function generateDependencyGraph(repoData) {
  const deps = repoData.dependencies?.dependencies || {};
  const nodes = [];
  const edges = [];

  // Add main project node
  nodes.push({
    id: "root",
    label: repoData.name || "Project",
    type: "project",
    color: "#00FF00",
  });

  // Add dependency nodes
  Object.keys(deps)
    .slice(0, 20)
    .forEach((dep) => {
      nodes.push({
        id: dep,
        label: dep.split("/").pop(),
        type: "dependency",
        color: "#0066FF",
      });

      // Connect to root
      edges.push({
        source: "root",
        target: dep,
        weight: 1,
      });
    });

  return {
    format: "mermaid",
    diagram: `graph TD\n  ${nodes
      .map((n) => `  ${sanitizeId(n.id)}["${n.label}"]`)
      .join("\n")}${edges.map((e) => `\n  ${sanitizeId(e.source)} --> ${sanitizeId(e.target)}`).join("")}`,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    type: "dependency-graph",
  };
}

function generateArchitectureDiagram(repoData) {
  const techStack = repoData.techStack || [];
  const isFrontend = techStack.some((t) =>
    ["React", "Vue", "Angular", "Svelte"].includes(t)
  );
  const isBackend = techStack.some((t) =>
    ["Node.js", "Express", "Django", "Flask", "Java", "Go"].includes(t)
  );
  const hasDB = techStack.some((t) =>
    [
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Firebase",
      "Redis",
      "DynamoDB",
    ].includes(t)
  );

  let diagram = `graph LR\n`;

  if (isFrontend) {
    diagram += `  subgraph Frontend["Frontend"]\n`;
    diagram += `    UI["User Interface\n${techStack.filter((t) => ["React", "Vue", "Angular"].includes(t)).join(", ")}"]; \n`;
    diagram += `  end\n`;
  }

  if (isBackend) {
    diagram += `  subgraph Backend["Backend"]\n`;
    diagram += `    API["API Server\n${techStack.filter((t) => ["Node.js", "Express", "Django"].includes(t)).join(", ")}"]; \n`;
    diagram += `  end\n`;
  }

  if (hasDB) {
    diagram += `  subgraph Database["Database"]\n`;
    diagram += `    DB["${techStack.filter((t) => ["MongoDB", "PostgreSQL", "MySQL"].includes(t)).join(", ")}"];\n`;
    diagram += `  end\n`;
  }

  if (isFrontend && isBackend) diagram += `  UI -->|HTTP/REST| API\n`;
  if (isBackend && hasDB) diagram += `  API -->|Query| DB\n`;

  return {
    format: "mermaid",
    diagram,
    type: "architecture-diagram",
  };
}

function generateFileHeatmap(codeQuality) {
  const metrics = codeQuality.codeQuality || {};
  const files = (metrics.totalFilesAnalyzed || 0) > 0 ? "Generated from code analysis" : "No files analyzed";

  return {
    format: "text",
    heatmap: `
📊 FILE COMPLEXITY HEATMAP
${"=".repeat(50)}
Average Complexity: ${metrics.complexity?.average || "N/A"}
Files Analyzed: ${metrics.totalFilesAnalyzed || 0}

High Complexity Files (🔴):
${
  metrics.complexity?.high
    ? metrics.complexity.high.slice(0, 5).map((f) => `  • ${f}`).join("\n")
    : "  None"
}

Code Smells Found (⚠️): ${metrics.codeSmells?.length || 0}
Comment Quality: ${metrics.comments?.quality || "N/A"}
    `,
    type: "file-heatmap",
  };
}

function generateTechStackVisual(techStack) {
  const categories = {
    Frontend: [
      "React",
      "Vue",
      "Angular",
      "Svelte",
      "Next.js",
      "Nuxt",
      "Gatsby",
      "Next",
    ],
    Backend: [
      "Node.js",
      "Express",
      "Django",
      "Flask",
      "Java",
      "Spring",
      "Go",
      "Rust",
    ],
    Database: [
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Firebase",
      "Redis",
      "DynamoDB",
    ],
    DevOps: ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "Heroku"],
  };

  const diagram = `
🏗️ TECH STACK VISUALIZATION
${"=".repeat(50)}
${techStack && techStack.length > 0
  ? Object.entries(categories)
      .map(([category, techs]) => {
        const found = techStack.filter((t) =>
          techs.some((tech) => t.toLowerCase().includes(tech.toLowerCase()))
        );
        return found.length > 0
          ? `${category}: ${found.join(" → ")}`
          : `${category}: Not detected`;
      })
      .join("\n")
  : "No tech stack detected"
}
  `;

  return {
    format: "text",
    diagram,
    type: "tech-stack",
  };
}

function generateMetricsChart(codeQuality, security, gitHealth, performance) {
  const cqScore = codeQuality?.codeQuality?.score || 0;
  const secScore = security?.security?.score || 0;
  const gitScore = gitHealth?.gitHealth?.healthScore || 0;
  const perfScore = performance?.performance?.healthScore || 0;

  const overallScore = Math.round((cqScore + secScore + gitScore + perfScore) / 4);

  const makeBar = (score, length = 20) => {
    const filled = Math.round((score / 100) * length);
    return "█".repeat(filled) + "░".repeat(length - filled);
  };

  return {
    format: "text",
    chart: `
📈 PROJECT HEALTH DASHBOARD
${"=".repeat(50)}
Overall Score: ${overallScore}/100
┌─────────────────────────────────┐
│ Code Quality:  ${makeBar(cqScore)} ${cqScore}%
│ Security:      ${makeBar(secScore)} ${secScore}%
│ Git Health:    ${makeBar(gitScore)} ${gitScore}%
│ Performance:   ${makeBar(perfScore)} ${perfScore}%
└─────────────────────────────────┘

Status: ${
      overallScore >= 80
        ? "✅ EXCELLENT"
        : overallScore >= 60
        ? "🟡 GOOD"
        : overallScore >= 40
        ? "⚠️ FAIR"
        : "🔴 NEEDS WORK"
    }
    `,
    scores: {
      codeQuality: cqScore,
      security: secScore,
      gitHealth: gitScore,
      performance: perfScore,
      overall: overallScore,
    },
  };
}

module.exports = generateVisualizations;
