const { runComprehensiveAnalysis } = require('./comprehensiveAnalyzer');
const path = require('path');

async function test() {
  const repoPath = path.join(__dirname, 'repos', 'axios');
  
  console.log('📊 Testing comprehensive analyzer on:', repoPath);
  console.log('');
  
  const result = await runComprehensiveAnalysis(repoPath, {
    files: ['index.js', 'package.json', 'README.md'],
    languages: ['javascript', 'json', 'markdown'],
    techStack: ['Axios', 'Node.js'],
    dependencies: { dependencies: {} },
    folderTree: {},
    readme: 'Test project',
    name: 'axios'
  });
  
  console.log('\n✅ Analyzer Result Keys:', Object.keys(result));
  console.log('✓ analysis:', result.analysis ? 'YES' : 'NO');
  console.log('✓ visualizations:', result.visualizations ? 'YES' : 'NO');
  console.log('✓ summary:', result.summary ? 'YES' : 'NO');
  
  if (result.analysis) {
    console.log('\n📊 Analysis keys:', Object.keys(result.analysis));
  }
  
  if (result.error) {
    console.log('\n❌ Error:', result.message);
  }
}

test().catch(console.error);
