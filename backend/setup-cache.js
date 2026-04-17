const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getRepoId(repoUrl) {
  return crypto.createHash('md5').update(repoUrl).digest('hex');
}

const urls = [
  'https://github.com/axios/axios.git',
  'https://github.com/facebook/react.git',
  'https://github.com/torvalds/linux.git',
];

console.log('🔑 Computing cache keys:\n');

const CACHE_DIR = path.join(__dirname, 'cache');

urls.forEach(url => {
  const hash = getRepoId(url);
  const cacheFile = path.join(CACHE_DIR, hash + '.json');
  const repoName = url.split('/').pop().replace('.git', '');
  
  console.log(`📦 ${repoName}:`);
  console.log(`   URL: ${url}`);
  console.log(`   Hash: ${hash}`);
  console.log(`   Cache file: ${hash}.json\n`);
});

// Setup axios cache
const axiosHash = getRepoId('https://github.com/axios/axios.git');
const mockFile = path.join(CACHE_DIR, 'mock-axios.json');
const axiosCacheFile = path.join(CACHE_DIR, axiosHash + '.json');

if (fs.existsSync(mockFile) && !fs.existsSync(axiosCacheFile)) {
  fs.copyFileSync(mockFile, axiosCacheFile);
  console.log(`✅ Copied mock data to: ${axiosHash}.json`);
  console.log(`✅ Cache is ready! Try analyzing: https://github.com/axios/axios.git`);
} else if (fs.existsSync(axiosCacheFile)) {
  console.log(`✅ Cache file already exists: ${axiosHash}.json`);
} else {
  console.log(`❌ Mock file not found: ${mockFile}`);
}
