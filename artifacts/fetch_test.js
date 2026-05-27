import http from 'http';

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HTML:', data.substring(0, 300)));
});

http.get('http://localhost:3000/assets/index-DsWdOBbd.css', (res) => {
  console.log('CSS Status:', res.statusCode);
});
