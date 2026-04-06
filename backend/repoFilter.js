const IMPORTANT_FILES = [
  "package.json",
  "composer.json",
  "requirements.txt",
  "pom.xml",
  "build.gradle",
  "README.md",
  ".env.example",
];

const IMPORTANT_FOLDERS = [
  "src",
  "app",
  "controllers",
  "routes",
  "models",
  "services",
  "api",
  "config",
];
const ENTRY_FILES = [
  "server.js",
  "app.js",
  "index.js",
  "main.js",
  "vite.config.js",
  "next.config.js",
  "angular.json",
  "manage.py",
];

function filterImportantFiles(allFiles) {
  const lowerFiles = allFiles.map(f => f.toLowerCase());

  const priority = [];

  // 1️⃣ ENTRY FILES FIRST (most important)
  allFiles.forEach(file => {
    const lower = file.toLowerCase();
    if (ENTRY_FILES.some(f => lower.endsWith(f))) {
      priority.push(file);
    }
  });

  // 2️⃣ MANIFEST FILES
  allFiles.forEach(file => {
    const lower = file.toLowerCase();
    if (IMPORTANT_FILES.some(f => lower.endsWith(f.toLowerCase()))) {
      priority.push(file);
    }
  });

  // 3️⃣ IMPORTANT FOLDERS (source code)
  allFiles.forEach(file => {
    const lower = file.toLowerCase();

    if (
      IMPORTANT_FOLDERS.some(f => lower.includes(`/${f}/`)) &&
      (lower.endsWith(".js") || lower.endsWith(".ts") || lower.endsWith(".php"))
    ) {
      priority.push(file);
    }
  });

  // Remove duplicates + hard limit
  return [...new Set(priority)].slice(0, 80);
}

module.exports = { filterImportantFiles };