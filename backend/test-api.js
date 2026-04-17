const http = require('http');

function testEndpoint() {
  const postData = JSON.stringify({
    repoUrl: 'https://github.com/axios/axios.git'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/analyze-repo',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Response received');
        console.log('Keys in response:', Object.keys(result));
        console.log('\n📊 Has analysis?', !!result.analysis);
        console.log('📈 Has visualizations?', !!result.visualizations);
        console.log('📋 Has summary?', !!result.summary);
        
        if (result.analysis) {
          console.log('\n🔍 Analysis keys:', Object.keys(result.analysis));
        }
        
        if (result.summary) {
          console.log('📊 Summary:', JSON.stringify(result.summary, null, 2).slice(0, 500));
        }
      } catch (e) {
        console.error('❌ Parse error:', e.message);
        console.log('Response:', data.slice(0, 500));
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });

  req.write(postData);
  req.end();
  
  console.log('📤 Sent test request to /analyze-repo...');
}

testEndpoint();
