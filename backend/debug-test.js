const http = require('http');
const fs = require('fs');

function testAPI() {
  const url = 'http://localhost:5000/analyze-repo-stream?url=https://github.com/axios/axios.git&refresh=true';
  const output = [];
  
  console.log('🔍 Making request...');
  output.push('🔍 Making request to analyze endpoint\n');
  
  http.get(url, (res) => {
    let buffer = '';
    let finalResult = null;
    
    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.replace('data: ', ''));
            const msg = `[${data.progress}%] ${data.message}`;
            console.log(msg);
            output.push(msg);
            
            if (data.result && data.progress === 100) {
              finalResult = data.result;
            }
          } catch (e) {}
        }
      }
      buffer = lines[lines.length - 1];
    });
    
    res.on('end', () => {
      if (finalResult) {
        const keys = Object.keys(finalResult);
        output.push('\n✅ RESULT STRUCTURE:');
        output.push('Keys: ' + keys.join(', '));
        output.push('✓ analysis: ' + (finalResult.analysis ? 'YES ✨' : 'NO ❌'));
        output.push('✓ visualizations: ' + (finalResult.visualizations ? 'YES ✨' : 'NO ❌'));
        output.push('✓ summary: ' + (finalResult.summary ? 'YES ✨' : 'NO ❌'));
        
        if (finalResult.analysis) {
          output.push('\nAnalysis keys: ' + Object.keys(finalResult.analysis).join(', '));
        }
        
        console.log(output.join('\n'));
      } else {
        output.push('❌ No final result');
        console.log(output.join('\n'));
      }
      
      fs.writeFileSync('./debug-output.txt', output.join('\n'));
      process.exit(0);
    });
  }).on('error', (e) => {
    output.push('❌ Error: ' + e.message);
    fs.writeFileSync('./debug-output.txt', output.join('\n'));
    console.log(output.join('\n'));
    process.exit(1);
  });
}

testAPI();
