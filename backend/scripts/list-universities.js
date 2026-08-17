const http = require('http');
const url = 'http://localhost:5000/api/universities';
http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const results = json.universities.map((u) => ({ name: u.name, image: u.image }));
      console.log(JSON.stringify(results.slice(0, 5), null, 2));
    } catch (error) {
      console.error('PARSE ERROR:', error.message);
      console.log(data);
    }
  });
}).on('error', (err) => {
  console.error('HTTP ERROR:', err.message);
});
