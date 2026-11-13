// Tiny client for the public demo API (demo auth: pick a seeded person, no password).
const BASE = process.env.KEEPWELL_URL || 'https://keepwell-951434273932.asia-southeast1.run.app';

async function as(email) {
  const r = await fetch(BASE + '/api/v1/dev/token', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
  if (!r.ok) throw new Error('token ' + r.status + ' ' + (await r.text()));
  const t = await r.json();
  const org = t.memberships[0].orgId;
  const call = async (method, path, body) => {
    const res = await fetch(BASE + '/api/v1' + path, {
      method,
      headers: { authorization: 'Bearer ' + t.accessToken, 'x-org-id': org, 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 400)}`);
    return text ? JSON.parse(text) : null;
  };
  return { get: (p) => call('GET', p), post: (p, b) => call('POST', p, b ?? {}), user: t.user, org };
}

module.exports = { as, BASE };
