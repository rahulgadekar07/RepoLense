// repoUtils.js

const fs = require("fs");
const path = require("path");

const IGNORE_FOLDERS = [
  ".git", "node_modules", "dist", "build",
  "coverage", ".next", ".nuxt", ".cache", ".vscode",".idea",
".husky",
".github",
".turbo",
".vercel",
"public",
"static",
"assets",
"vendor",
"bin",
"obj"
];

function scanDirectory(dirPath, basePath = dirPath) {
  console.log(`🔍 Scanning directory: ${dirPath}`);
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Directory does not exist: ${dirPath}`);
    return [];
  }
  
  try {
    let results = [];
    const files = fs.readdirSync(dirPath);
    console.log(`📁 Found ${files.length} items in ${dirPath}`);

    files.forEach((file) => {
      if (IGNORE_FOLDERS.includes(file)) return;
      const fullPath = path.join(dirPath, file);
      try {
        const stat = fs.lstatSync(fullPath);
        if (stat.isSymbolicLink()) return;
        const relativePath = path.relative(basePath, fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirectory(fullPath, basePath));
        } else {
          results.push(relativePath);
        }
      } catch (statErr) {
        console.warn(`⚠️ Skip stat ${fullPath}: ${statErr.message}`);
      }
    });

    console.log(`✅ Scan complete: ${results.length} files from ${dirPath}`);
    return results;
  } catch (err) {
    console.error(`💥 scanDirectory failed for ${dirPath}: ${err.message}`);
    return [];
  }
}

const VALID_CODE_EXTENSIONS = [
  "js","ts","jsx","tsx","json","html","css","scss",
  "py","java","c","cpp","cs","go","php","rb","rs",
  "swift","kt","kts","yml","yaml","sh"
];

function detectLanguages(files) {
  const extSet = new Set();
  files.forEach(file => {
    const ext = path.extname(file).toLowerCase().replace(".", "");
    if (VALID_CODE_EXTENSIONS.includes(ext)) extSet.add(ext);
  });
  return Array.from(extSet);
}

const JS_FRAMEWORK_MAP = {
  "react": "React",
  "react-dom": "React",
  "next": "Next.js",
  "vue": "Vue.js",
  "nuxt": "Nuxt.js",
  "angular": "Angular",
  "@angular/core": "Angular",
  "svelte": "Svelte",
  "express": "Express.js",
  "fastify": "Fastify",
  "koa": "Koa.js",
  "mongoose": "MongoDB (Mongoose)",
  "sequelize": "SQL (Sequelize)",
  "prisma": "Prisma ORM",
  "typeorm": "TypeORM",
  "pg": "PostgreSQL",
  "mysql2": "MySQL",
  "redis": "Redis",
  "socket.io": "Socket.IO",
  "graphql": "GraphQL",
  "apollo-server": "Apollo GraphQL",
  "typescript": "TypeScript",
  "tailwindcss": "Tailwind CSS",
  "bootstrap": "Bootstrap",
  "axios": "Axios",
  "jest": "Jest (Testing)",
  "webpack": "Webpack",
  "vite": "Vite",
  "electron": "Electron",
  "nestjs": "NestJS",
"express-session": "Express.js",
"jsonwebtoken": "JWT Auth",
"multer": "File Upload (Multer)",
"cors": "CORS Middleware",
"dotenv": "Environment Config",
"bcrypt": "Password Hashing",
"razorpay": "Razorpay Payments",
"stripe": "Stripe Payments",
"nodemailer": "Email Service",
"socket.io-client": "Socket.IO",
};

/**
 * Detect real tech stack by reading ALL package.json files
 * including subfolders like frontend/ and backend/
 */
function detectTechStack(repoPath, files) {
  const techSet = new Set();

  // ── 1. Find ALL package.json files (root + subfolders) ──
  const packageJsonFiles = files
    .filter(f => path.basename(f) === "package.json")
    .map(f => path.join(repoPath, f));

  // Also always check root
  const rootPkg = path.join(repoPath, "package.json");
  if (!packageJsonFiles.includes(rootPkg)) {
    packageJsonFiles.unshift(rootPkg);
  }

  for (const pkgPath of packageJsonFiles) {
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      for (const dep of Object.keys(allDeps)) {
        if (JS_FRAMEWORK_MAP[dep]) techSet.add(JS_FRAMEWORK_MAP[dep]);
      }
      console.log(`📦 Scanned ${pkgPath} — found ${Object.keys(allDeps).length} deps`);
    } catch {}
  }

  // ── 2. Python requirements.txt ──
  const reqPath = path.join(repoPath, "requirements.txt");
  if (fs.existsSync(reqPath)) {
    try {
      const content = fs.readFileSync(reqPath, "utf-8").toLowerCase();
      const pythonMap = {
        "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
        "sqlalchemy": "SQLAlchemy", "pandas": "Pandas", "numpy": "NumPy",
        "tensorflow": "TensorFlow", "torch": "PyTorch", "scikit-learn": "Scikit-learn",
      };
      for (const [key, val] of Object.entries(pythonMap)) {
        if (content.includes(key)) techSet.add(val);
      }
    } catch {}
  }

  // ── 3. Detect from config file names ──
  const fileNames = files.map(f => path.basename(f).toLowerCase());
  const configMap = {
    "tailwind.config.js": "Tailwind CSS",
    "tailwind.config.ts": "Tailwind CSS",
    "vite.config.js": "Vite",
    "vite.config.ts": "Vite",
    "next.config.js": "Next.js",
    "next.config.ts": "Next.js",
    "angular.json": "Angular",
    "dockerfile": "Docker",
    "docker-compose.yml": "Docker",
    "pom.xml": "Java (Maven)",
    "build.gradle": "Java (Gradle)",
    "cargo.toml": "Rust",
    "go.mod": "Go",
  };
  for (const [fileName, tech] of Object.entries(configMap)) {
    if (fileNames.includes(fileName)) techSet.add(tech);
  }

  // ── 4. Detect from file extensions ──
  const hasExt = (ext) => files.some(f => f.endsWith(ext));
  if (hasExt(".jsx") || hasExt(".tsx")) techSet.add("React");
  if (hasExt(".vue")) techSet.add("Vue.js");
  if (hasExt(".py")) techSet.add("Python");
  if (hasExt(".java")) techSet.add("Java");
  if (hasExt(".go")) techSet.add("Go");
  if (hasExt(".php")) techSet.add("PHP");
  if (hasExt(".rb")) techSet.add("Ruby");
  if (hasExt(".cs")) techSet.add("C#");
  if (hasExt(".ts") || hasExt(".tsx")) techSet.add("TypeScript");

  // ── 5. Fallback to raw extensions if nothing found ──
  if (techSet.size === 0) {
    detectLanguages(files).forEach(e => techSet.add(e));
  }

  return Array.from(techSet);
}

function readFileSafe(filePath, maxChars = 4000) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return content.substring(0, maxChars);
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

function getPackageJsonDependencies(repoPath, files) {
  const deps = {};

  const packageJsonFiles = files
    .filter(f => path.basename(f) === "package.json")
    .map(f => path.join(repoPath, f));

  for (const pkgPath of packageJsonFiles) {
    try {
      const content = readFileSafe(pkgPath);
      if (!content) continue;
      const json = JSON.parse(content);

      Object.assign(deps, json.dependencies || {});
      Object.assign(deps, json.devDependencies || {});
    } catch {}
  }

  return { dependencies: deps };
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
  detectTechStack,
  readFileSafe,
  getReadme,
  getPackageJsonDependencies,
  buildFolderTree
};