const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const UI_PATH = path.join(__dirname, '..', 'src', 'UI.html');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(UI_PATH, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading UI.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving UI from: ${UI_PATH}`);
});
