require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');

const hostname = '0.0.0.0';
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
  <meta name="description" content="Azin is a DevOps engineer focused on automation, cloud infrastructure, and reliable deployments." />
  <meta name="theme-color" content="#07111f" />
  <title>Azin | DevOps Engineer</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #07111f;
      --panel: rgba(8, 16, 35, 0.8);
      --accent: #4ade80;
      --accent-2: #60a5fa;
      --text: #e2e8f0;
      --muted: #94a3b8;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
      background:
        radial-gradient(circle at top left, rgba(96, 165, 250, 0.25), transparent 28%),
        linear-gradient(135deg, var(--bg), #111827 60%, #1d4ed8);
      color: var(--text);
      min-height: 100vh;
    }

    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 20px 80px;
    }

    .hero {
      background: var(--panel);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 36px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(18px);
    }

    .eyebrow {
      display: inline-block;
      padding: 7px 12px;
      background: rgba(74, 222, 128, 0.16);
      color: var(--accent);
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    h1 {
      font-size: clamp(2rem, 4vw, 3.2rem);
      line-height: 1.1;
      margin: 0 0 12px;
    }

    .lead {
      font-size: 1.05rem;
      line-height: 1.7;
      color: var(--muted);
      max-width: 700px;
      margin-bottom: 24px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 28px;
    }

    .btn {
      display: inline-block;
      padding: 12px 16px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 700;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn:hover { transform: translateY(-2px); }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent), #22c55e);
      color: #042f2e;
      box-shadow: 0 10px 20px rgba(74, 222, 128, 0.24);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.08);
      color: var(--text);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 18px;
    }

    .stat {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 14px;
    }

    .stat strong {
      display: block;
      font-size: 1.1rem;
      margin-bottom: 4px;
    }

    .section-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 20px;
      margin-top: 20px;
    }

    .card {
      background: var(--panel);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 22px;
      box-shadow: 0 12px 35px rgba(0,0,0,0.2);
    }

    .card h2 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 1.2rem;
    }

    .card p, .card li {
      color: var(--muted);
      line-height: 1.7;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 0;
      list-style: none;
      margin: 0;
    }

    .chip-list li {
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(96, 165, 250, 0.12);
      color: #bfdbfe;
      font-size: 0.95rem;
    }

    .contact a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 700;
    }

    @media (max-width: 760px) {
      .section-grid { grid-template-columns: 1fr; }
      .stats { grid-template-columns: 1fr; }
      .hero { padding: 24px; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="eyebrow">DevOps • Cloud • Automation</div>
      <h1>Hi, I’m Azin — building reliable systems that scale.</h1>
      <p class="lead">
        I design deployment pipelines, streamline infrastructure, and help teams ship faster with confidence.
        My focus is creating dependable cloud environments, strong automation, and smooth delivery workflows.
      </p>
      <div class="actions">
        <a class="btn btn-primary" href="#contact">Let’s Connect</a>
        <a class="btn btn-secondary" href="#skills">Explore My Stack</a>
      </div>

      <div class="stats">
        <div class="stat">
          <strong>CI/CD</strong>
          <span>Automated pipelines</span>
        </div>
        <div class="stat">
          <strong>Cloud</strong>
          <span>Scalable infrastructure</span>
        </div>
        <div class="stat">
          <strong>Reliability</strong>
          <span>Monitoring & uptime</span>
        </div>
      </div>
    </section>

    <section class="section-grid">
      <article class="card" id="skills">
        <h2>Core Skills</h2>
        <ul class="chip-list">
          <li>Docker</li>
          <li>Kubernetes</li>
          <li>Linux</li>
          <li>GitHub Actions</li>
          <li>Terraform</li>
          <li>Monitoring</li>
          <li>Shell Scripting</li>
          <li>Cloud Platforms</li>
        </ul>
      </article>

      <article class="card">
        <h2>What I Care About</h2>
        <p>
          I believe great DevOps work means making systems simple to operate, resilient under pressure,
          and easy for teams to trust and evolve.
        </p>
      </article>
    </section>

    <section class="card contact" id="contact" style="margin-top:20px;">
      <h2>Contact</h2>
      <p>
        Interested in collaboration or a new opportunity? Reach out at
        <a href="mailto:azin@example.com">azin@example.com</a>.
      </p>
    </section>
  </main>
</body>
</html>`);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
