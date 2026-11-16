// Wunschrad der LM-Motorsport-Garage. Keine Abhängigkeiten, Daten in einer JSON-Datei.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'wheel.json');
const PORT = Number(process.env.PORT || 3000);

fs.mkdirSync(DATA_DIR, { recursive: true });

let state = { items: [], wins: [], busyUntil: 0, busyBy: null };
try {
  state = { ...state, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
} catch {}

function save() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

const clean = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const weightOf = (w) => Math.min(10, Math.max(1, Math.round(Number(w) || 5)));

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 20000) {
        reject(new Error('zu gross'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Privat: Niemand sieht, wer was gezogen hat. Jeder sieht nur seine eigenen Gewinne.
const publicState = (viewer = '') => ({
  items: state.items.map(({ id, name, owner, weight }) => ({ id, name, owner, weight })),
  mine: state.wins.filter((w) => w.by === viewer),
  busy: state.busyUntil > Date.now() ? state.busyBy : null,
  now: Date.now()
});

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const viewer = clean(url.searchParams.get('name'), 30);
  if (route === 'GET /api/state') return json(res, 200, publicState(viewer));

  let body = {};
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: 'Ungültige Anfrage' });
  }
  const me = clean(body.me ?? body.name ?? viewer, 30);

  if (route === 'POST /api/items') {
    const name = clean(body.name, 80);
    const owner = clean(body.owner, 30);
    if (!name || !owner) return json(res, 400, { error: 'Name und Wunsch nötig' });
    state.items.push({
      id: crypto.randomUUID(),
      name,
      owner,
      weight: weightOf(body.weight),
      createdAt: Date.now(),
      wonBy: null
    });
    save();
    return json(res, 200, publicState(me));
  }

  const m = url.pathname.match(/^\/api\/items\/([\w-]+)$/);
  if (m) {
    const item = state.items.find((i) => i.id === m[1]);
    if (!item) return json(res, 404, { error: 'Nicht gefunden' });
    if (req.method === 'PATCH') {
      if (body.weight !== undefined) item.weight = weightOf(body.weight);
      if (body.name !== undefined && clean(body.name, 80)) item.name = clean(body.name, 80);
      save();
      return json(res, 200, publicState(me));
    }
    if (req.method === 'DELETE') {
      state.items = state.items.filter((i) => i !== item);
      save();
      return json(res, 200, publicState(me));
    }
  }

  if (route === 'POST /api/spin') {
    if (!me) return json(res, 400, { error: 'Dein Name fehlt' });
    if (state.busyUntil > Date.now()) return json(res, 409, { error: 'Das Rad dreht gerade noch' });
    // Vergebene Wünsche bleiben im Rad (gleich gross), werden aber nie gezogen. Das sieht niemand.
    const open = state.items.filter((i) => !i.wonBy);
    if (!open.length) return json(res, 409, { error: 'Keine freien Wünsche mehr im Rad' });
    const total = open.reduce((s, i) => s + i.weight, 0);
    let r = (crypto.randomInt(0, 1_000_000) / 1_000_000) * total;
    let pick = open[open.length - 1];
    for (const i of open) {
      if (r < i.weight) {
        pick = i;
        break;
      }
      r -= i.weight;
    }
    pick.wonBy = me;
    state.wins.push({ id: pick.id, name: pick.name, owner: pick.owner, weight: pick.weight, by: me, at: Date.now() });
    state.busyUntil = Date.now() + 8000;
    state.busyBy = me;
    save();
    return json(res, 200, {
      ...publicState(me),
      spin: { itemId: pick.id, offset: 0.15 + (crypto.randomInt(0, 1000) / 1000) * 0.7 }
    });
  }

  if (route === 'POST /api/release') {
    const win = state.wins.find((w) => w.id === body.id && w.by === me);
    if (!win) return json(res, 404, { error: 'Nicht gefunden' });
    state.wins = state.wins.filter((w) => w !== win);
    const item = state.items.find((i) => i.id === win.id);
    if (item) item.wonBy = null;
    save();
    return json(res, 200, publicState(me));
  }

  json(res, 404, { error: 'Unbekannt' });
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, url) {
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) return json(res, 403, { error: 'verboten' });
  fs.readFile(file, (err, buf) => {
    if (err) return json(res, 404, { error: 'Nicht gefunden' });
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
      'cache-control': file.includes('fonts') ? 'public, max-age=31536000' : 'no-cache'
    });
    res.end(buf);
  });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return api(req, res, url).catch(() => json(res, 500, { error: 'Fehler' }));
    serveStatic(req, res, url);
  })
  .listen(PORT, () => console.log(`wheel läuft auf :${PORT}, Daten in ${DATA_FILE}`));
