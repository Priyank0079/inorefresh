const http = require('http');
http.get('http://127.0.0.1:7000/api/v1/customer/home?latitude=22.7196&longitude=75.8577', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json.data.promoStrip, null, 2));
  });
});
