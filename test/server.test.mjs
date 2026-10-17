import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('local HTTP boundary, assets, and input failures', async () => {
  const child = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, PORT: '13210' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await Promise.race([once(child.stdout, 'data'), new Promise((_, reject) => setTimeout(() => reject(new Error('Server startup timed out')), 5000).unref())]);
    const root = 'http://127.0.0.1:13210';
    const page = await fetch(root);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /ScopeShield/);
    assert.match(page.headers.get('content-security-policy'), /connect-src 'self'/);
    for (const path of ['/app.js', '/style.css', '/samples.js']) assert.equal((await fetch(root + path)).status, 200);
    assert.equal((await fetch(root + '/.git/config')).status, 404);
    const cross = await fetch(root + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' }, body: '{}' });
    assert.equal(cross.status, 403);
    const media = await fetch(root + '/api/analyze', { method: 'POST', body: '{}' });
    assert.equal(media.status, 415);
    const broken = await fetch(root + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
    assert.equal(broken.status, 400);
    const invalid = await fetch(root + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contract: 'tiny', request: 'tiny', rate: -1 }) });
    assert.equal(invalid.status, 422);
    assert.match((await invalid.json()).error, /20 characters/);
    const oversized = await fetch(root + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(151000) });
    assert.equal(oversized.status, 413);
  } finally { child.kill(); await once(child, 'exit'); }
});
