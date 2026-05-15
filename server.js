/**
 * ClawMail Mock API
 * In-memory backend for local testing
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

const app = new Hono();
const PORT = process.env.PORT || 8787;
const TOKEN = process.env.API_TOKEN || 'dev-token-clawmail';

// In-memory storage
const inboxes = new Map(); // id -> { address, messages[] }
const DOMAINS = ['claw.dev', 'temp.mail', 'oneuse.io'];

// CORS for local dev
app.use('*', cors({
  origin: ['http://127.0.0.1:5180', 'http://localhost:5180', 'https://clawmail-seven.vercel.app', 'https://clawmail.vercel.app'],
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'DELETE'],
}));

// Health check (public, no auth)
app.get('/', (c) => c.json({ service: 'clawmail-api', ok: true }));

// Auth middleware
app.use('*', async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth || auth !== `Bearer ${TOKEN}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// Helpers
function newId() {
  return Math.random().toString(36).slice(2, 12);
}

function seedMessages(address) {
  const now = Date.now();
  return [
    {
      id: newId(),
      from: 'no-reply@github.com',
      subject: 'Verify your email - Code: 487213',
      text: 'Welcome! Your verification code is 487213. This code expires in 10 minutes.',
      html: '<p>Welcome! Your verification code is <b>487213</b>.</p>',
      timestamp: now - 60000,
    },
    {
      id: newId(),
      from: 'promotions@shopnow.com',
      subject: 'Special offer just for you - 50% discount',
      text: 'Get 50% off all items today. Click to unsubscribe.',
      html: '<h1>50% OFF</h1><p>Limited time offer.</p>',
      timestamp: now - 300000,
    },
    {
      id: newId(),
      from: 'support@example.org',
      subject: 'Welcome to our service',
      text: `Hi, your inbox ${address} is ready. Thank you for signing up!`,
      html: `<p>Hi, your inbox <code>${address}</code> is ready.</p>`,
      timestamp: now - 600000,
    },
  ];
}

// GET /domains
app.get('/domains', (c) => {
  return c.json({ domains: DOMAINS });
});

// POST /generate
app.post('/generate', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const address = body.address || `${newId()}@${DOMAINS[0]}`;
  const id = address;

  inboxes.set(id, {
    address,
    messages: seedMessages(address),
    createdAt: Date.now(),
  });

  return c.json({ id, address });
});

// GET /inbox/:id
app.get('/inbox/:id', (c) => {
  const id = c.req.param('id');
  const inbox = inboxes.get(id);

  if (!inbox) return c.json({ messages: [] });
  return c.json({ messages: inbox.messages });
});

// GET /message/:id
app.get('/message/:id', (c) => {
  const id = c.req.param('id');

  for (const inbox of inboxes.values()) {
    const msg = inbox.messages.find((m) => m.id === id);
    if (msg) return c.json(msg);
  }

  return c.json({ error: 'Not found' }, 404);
});

// GET /code/:id
app.get('/code/:id', (c) => {
  const id = c.req.param('id');

  for (const inbox of inboxes.values()) {
    const msg = inbox.messages.find((m) => m.id === id);
    if (msg) {
      const text = `${msg.subject} ${msg.text}`;
      const match = text.match(/\b(\d{4,8})\b/);
      if (match) return c.json({ code: match[1] });
      return c.json({ error: 'No code found' }, 404);
    }
  }

  return c.json({ error: 'Not found' }, 404);
});

// DELETE /email/:id
app.delete('/email/:id', (c) => {
  const id = c.req.param('id');
  const existed = inboxes.delete(id);
  return c.json({ ok: existed });
});

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' });
console.log(`ClawMail API running on port ${PORT}`);
console.log(`Token: ${TOKEN}`);
