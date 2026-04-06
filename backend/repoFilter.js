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

function filterImportantFiles(allFiles) {
  return allFiles.filter(file => {
    const lower = file.toLowerCase();

    if (IMPORTANT_FILES.some(f => lower.endsWith(f.toLowerCase())))
      return true;

    if (IMPORTANT_FOLDERS.some(f => lower.includes(`/${f}/`)))
      return true;

    if (lower.endsWith(".js") || lower.endsWith(".ts") || lower.endsWith(".php"))
      return true;

    return false;
  }).slice(0, 80); // HARD LIMIT 🔥
}

module.exports = { filterImportantFiles };