const crypto = require('crypto');

const url = 'https://github.com/axios/axios.git';
const hash = crypto.createHash('md5').update(url).digest('hex');
console.log('URL:', url);
console.log('MD5 Hash:', hash);
console.log('Cache file should be: d:\\RepoLense\\backend\\cache\\' + hash + '.json');
