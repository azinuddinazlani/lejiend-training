const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const projectRoot = path.join(__dirname, '..');
const usersFilePath = path.join(projectRoot, 'users.json');
const initialUsers = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

function writeUsersFile(data) {
  fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));
}

function startServer() {
  writeUsersFile(initialUsers);

  const child = spawn(process.execPath, ['index.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '3101', API_KEY: 'supersecretkey' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let output = '';

    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes('Server running')) {
        cleanup();
        resolve(child);
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`Server exited early with code ${code}. Output:\n${output}`));
    };

    const cleanup = () => {
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
      child.off('exit', onExit);
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', onExit);
  });
}

function request(pathname, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3101,
        path: pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

test('GET /users returns users from users.json', async () => {
  const child = await startServer();

  try {
    const response = await request('/users', {
      headers: { 'x-api-key': 'supersecretkey' }
    });

    assert.equal(response.statusCode, 200);
    const users = JSON.parse(response.body);
    assert.equal(users.length, 2);
    assert.equal(users[0].name, 'Alice');
  } finally {
    child.kill();
  }
});

test('PUT /users/:id updates a user', async () => {
  const child = await startServer();

  try {
    const response = await request('/users/1', {
      method: 'PUT',
      headers: { 'x-api-key': 'supersecretkey' },
      body: { name: 'Alicia' }
    });

    assert.equal(response.statusCode, 200);
    const updatedUser = JSON.parse(response.body);
    assert.equal(updatedUser.name, 'Alicia');

    const fileUsers = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    assert.equal(fileUsers[0].name, 'Alicia');
  } finally {
    child.kill();
  }
});

test('DELETE /users/:id removes a user', async () => {
  const child = await startServer();

  try {
    const response = await request('/users/2', {
      method: 'DELETE',
      headers: { 'x-api-key': 'supersecretkey' }
    });

    assert.equal(response.statusCode, 200);
    const fileUsers = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    assert.equal(fileUsers.length, 1);
    assert.equal(fileUsers[0].id, 1);
  } finally {
    child.kill();
  }
});
