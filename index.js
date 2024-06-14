const express = require('express');
const app = express();

// CORSを有効にする
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/hello', (req, res) => {
    res.send('Hello');
});

app.get('/grafana', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Grafana</title>
      </head>
      <body>
        <h1>Welcome to Grafana</h1>
      </body>
      </html>
    `);
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});