const express = require('express');
const app = express();

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