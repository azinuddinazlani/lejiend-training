require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;
const expectedApiKey = process.env.API_KEY;
const usersFilePath = path.join(__dirname, 'users.json');

function readUsers() {
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(data);
}

function writeUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function isAuthorized(req) {
  return req.headers['x-api-key'] === expectedApiKey;
}

const server = http.createServer((req, res) => {
  // Check authorization for all API routes
  if (!isAuthorized(req)) {
    if (req.url.startsWith('/api') || req.url.startsWith('/users')) {
      sendJson(res, 401, { error: 'Unauthorized: valid X-API-Key required' });
      return;
    }
  }

  if (req.url === '/api') {
    sendJson(res, 200, { message: 'API access granted' });
    return;
  }

  if ((req.url === '/api/users' || req.url === '/users') && req.method === 'GET') {
    sendJson(res, 200, readUsers());
    return;
  }

  const userMatch = req.url.match(/^\/(?:api\/)?users\/(\d+)$/);
  if (userMatch) {
    const userId = Number(userMatch[1]);

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const users = readUsers();
        const parsedBody = body ? JSON.parse(body) : {};
        const user = users.find((item) => item.id === userId);

        if (!user) {
          sendJson(res, 404, { error: 'User not found' });
          return;
        }

        Object.assign(user, parsedBody);
        writeUsers(users);
        sendJson(res, 200, user);
      });
      return;
    }

    if (req.method === 'DELETE') {
      const users = readUsers();
      const filteredUsers = users.filter((item) => item.id !== userId);
      if (filteredUsers.length === users.length) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      writeUsers(filteredUsers);
      sendJson(res, 200, { message: 'User deleted' });
      return;
    }
  }

  // Catch unrecognized API routes and return JSON error
  if (req.url.startsWith('/api') || req.url.startsWith('/users')) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Node.js Starter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #0f172a, #2563eb);
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 2rem 2.5rem;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      text-align: center;
    }
    h1 { margin-bottom: 0.5rem; }
    p { margin: 0; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Welcome to your Node.js app</h1>
    <p>This page is served from a simple local server.</p>
  </div>
</body>
</html>`);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
