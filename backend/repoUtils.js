// repoUtils.js

const fs = require("fs");
const path = require("path");

const IGNORE_FOLDERS = [
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".cache",
  ".vscode",
];

function scanDirectory(dirPath, basePath = dirPath) {
  let results = [];

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    // ❌ Skip hidden/system folders
    if (IGNORE_FOLDERS.includes(file)) return;

    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(basePath, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(scanDirectory(fullPath, basePath));
    } else {
      results.push(relativePath);
    }
  });

  return results;
}

const VALID_CODE_EXTENSIONS = [
  "js","ts","jsx","tsx",
  "json","html","css","scss",
  "py","java","c","cpp","cs",
  "go","php","rb","rs","swift",
  "kt","kts","yml","yaml","sh"
];

function detectLanguages(files) {
  const extSet = new Set();

  files.forEach(file => {
    const ext = path.extname(file).toLowerCase().replace(".", "");
    if (VALID_CODE_EXTENSIONS.includes(ext)) {
      extSet.add(ext);
    }
  });

  return Array.from(extSet);
}
function readFileSafe(filePath, maxChars = 4000) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return content.substring(0, maxChars); // avoid huge files
  } catch {
    return null;
  }
}
function getReadme(repoPath) {
  const names = ["README.md", "readme.md", "Readme.md"];
  for (const name of names) {
    const full = path.join(repoPath, name);
    const data = readFileSafe(full);
    if (data) return data;
  }
  return "No README found";
}
function getPackageJsonDependencies(repoPath) {
  const pkgPath = path.join(repoPath, "package.json");
  const content = readFileSafe(pkgPath);

  if (!content) return {};

  try {
    const json = JSON.parse(content);
    return {
      dependencies: json.dependencies || {},
      devDependencies: json.devDependencies || {}
    };
  } catch {
    return {};
  }
}
function buildFolderTree(dir, depth = 2, currentDepth = 0) {
  if (currentDepth > depth) return null;

  const tree = {};
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    if (IGNORE_FOLDERS.includes(file)) return;

    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      tree[file] = buildFolderTree(full, depth, currentDepth + 1);
    } else {
      tree[file] = "file";
    }
  });

  return tree;
}

module.exports = {
  scanDirectory,
  detectLanguages,
  readFileSafe,
  getReadme,
  getPackageJsonDependencies,
  buildFolderTree

};