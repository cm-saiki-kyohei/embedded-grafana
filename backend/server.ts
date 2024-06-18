
import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.send("Hello Express");
});

// HTMLファイルを返す
app.get('/grafana', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Grafana Iframe</title>
      </head>
      <body>
      <iframe src="http://localhost:3000/d-solo/bdoqdz0iyyg3kc/da?orgId=1&from=1718326817646&to=1718348417646&panelId=1"
      width="450" height="200" frameborder="0"></iframe>
      </body>
    </html>
  `);
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});