import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Starter HTTP client: Node.js 24, no additional dependency.
const base = process.env.LAB_API_URL || 'http://localhost:3001';
const exercises = process.argv.includes('--exercises');
let token;
let email;
let checks = 0;

async function send(method, path, body, authenticated = true, id = `lab-${randomUUID()}`) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': id,
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null,
    requestId: response.headers.get('x-request-id'), sentId: id };
}
function check(name, result, expected) {
  assert.equal(result.status, expected, `${name}: ${JSON.stringify(result.body)}`);
  assert.equal(result.requestId, result.sentId, `${name}: response header request ID`);
  if (expected >= 400) {
    assert.equal(result.body.statusCode, expected);
    assert.equal(result.body.requestId, result.sentId);
    assert.ok(result.body.timestamp);
    assert.ok(result.body.path);
    assert.ok(result.body.message);
  }
  checks++;
  console.log(`PASS ${name}: HTTP ${expected}; requestId=${result.requestId}`);
}

try {
  email = `lab-${randomUUID()}@example.com`;
  const registered = await send('POST', '/auth/register', {
    email, password: 'LabOnly@2026!', fullName: 'Hands-on lab',
  }, false);
  token = registered.body?.accessToken;
  check('register temporary user', registered, 201);
  assert.ok(token, 'registration must return accessToken');

  check('missing token + invalid query: guard first',
    await send('GET', '/tasks?limit=0', undefined, false, 'lab-guard-first'), 401);
  check('valid token + invalid query: pipe rejects',
    await send('GET', '/tasks?limit=0', undefined, true, 'lab-pipe-error'), 400);
  check('unknown property rejected',
    await send('POST', '/tasks', { title: 'Lab', unexpectedField: true }), 400);
  const created = await send('POST', '/tasks', { title: 'Lab valid task' });
  check('valid task', created, 201);
  const listed = await send('GET', '/tasks?page=1&limit=2');
  check('valid pagination', listed, 200);
  assert.equal(listed.body.meta.page, 1);
  assert.equal(listed.body.meta.limit, 2);

  if (exercises) {
    check('title boundary 120 accepted',
      await send('POST', '/tasks', { title: 'a'.repeat(120) }), 201);
    check('title boundary 121 rejected',
      await send('POST', '/tasks', { title: 'a'.repeat(121) }), 400);
    check('update title 121 rejected',
      await send('PATCH', `/tasks/${created.body.id}`, { title: 'a'.repeat(121) }), 400);
    check('limit boundary 50 accepted', await send('GET', '/tasks?limit=50'), 200);
    check('limit boundary 51 rejected', await send('GET', '/tasks?limit=51'), 400);
    check('fractional limit rejected', await send('GET', '/tasks?limit=1.5'), 400);
  }
  console.log(`PASS: ${checks} HTTP checks (${exercises ? 'exercise' : 'baseline'} mode).`);
} catch (error) {
  console.error('FAIL:', error.message);
  process.exitCode = 1;
} finally {
  // Only delete the fresh account created by this execution, using its own JWT.
  if (token) {
    try {
      const deleted = await send('DELETE', '/users/me');
      assert.equal(deleted.status, 204);
      console.log('CLEANUP: temporary user and its tasks deleted.');
    } catch (error) {
      console.error(`CLEANUP FAILED (${email}): ${error.message}`);
      process.exitCode = 1;
    }
  }
}
