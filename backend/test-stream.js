const http = require('http');

function testStreamingEndpoint() {
  const url = 'http://localhost:5000/analyze-repo-stream?url=https://github.com/axios/axios.git';
  
  http.get(url, (res) => {
    let buffer = '';
    
    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n\n');
      
      // Process complete messages
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].startsWith('data: ')) {
          try {
            const data = JSON.parse(lines[i].replace('data: ', ''));
            console.log(`[${data.progress}%]`, data.message);
            
            if (data.result && data.progress === 100) {
              console.log('\n✅ Analysis Complete!');
              console.log('Response keys:', Object.keys(data.result));
              console.log('Has analysis?', !!data.result.analysis);
              console.log('Has visualizations?', !!data.result.visualizations);
              console.log('Has summary?', !!data.result.summary);
            }
          } catch (e) {
            // Ignore ping messages
          }
        }
      }
      
      // Keep unprocessed data
      buffer = lines[lines.length - 1];
    });
    
    res.on('end', () => {
      console.log('\n✅ Stream ended');
    });
  }).on('error', (e) => {
    console.error('❌ Error:', e.message);
  });

  console.log('📡 Testing streaming endpoint...\n');
}

testStreamingEndpoint();

// Keep process alive
setTimeout(() => {
  console.log('\n⏱️ Timeout - keeping connection alive for server response...');
  setTimeout(() => process.exit(0), 180000); // Exit after 3 minutes
}, 5000);
