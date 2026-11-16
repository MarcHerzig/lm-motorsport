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

let state = { items: [], spin: null, spinCount: 0 };
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

const publicState = () => ({ items: state.items, spin: state.spin, now: Date.now() });

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  if (route === 'GET /api/state') return json(res, 200, publicState());

  let body = {};
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: 'Ungültige Anfrage' });
  }

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
      wonBy: null,
      wonAt: null
    });
    save();
    return json(res, 200, publicState());
  }

  const m = url.pathname.match(/^\/api\/items\/([\w-]+)$/);
  if (m) {
    const item = state.items.find((i) => i.id === m[1]);
    if (!item) return json(res, 404, { error: 'Nicht gefunden' });
    if (req.method === 'PATCH') {
      if (body.weight !== undefined) item.weight = weightOf(body.weight);
      if (body.name !== undefined && clean(body.name, 80)) item.name = clean(body.name, 80);
      save();
      return json(res, 200, publicState());
    }
    if (req.method === 'DELETE') {
      if (item.wonBy) return json(res, 409, { error: 'Schon vergeben, erst zurücklegen' });
      state.items = state.items.filter((i) => i !== item);
      save();
      return json(res, 200, publicState());
    }
  }

  if (route === 'POST /api/spin') {
    const by = clean(body.name, 30);
    if (!by) return json(res, 400, { error: 'Dein Name fehlt' });
    // Nicht doppelt drehen, solange eine Drehung noch läuft
    if (state.spin && Date.now() - state.spin.at < 8000) {
      return json(res, 409, { error: 'Das Rad dreht gerade noch' });
    }
    const open = state.items.filter((i) => !i.wonBy);
    if (!open.length) return json(res, 409, { error: 'Keine freien Wünsche mehr im Rad' });
    const total = open.reduce((s, i) => s + i.weight, 0);
    let r = crypto.randomInt(0, 1_000_000) / 1_000_000 * total;
    let pick = open[open.length - 1];
    for (const i of open) {
      if (r < i.weight) {
        pick = i;
        break;
      }
      r -= i.weight;
    }
    pick.wonBy = by;
    pick.wonAt = Date.now();
    state.spinCount += 1;
    state.spin = {
      n: state.spinCount,
      itemId: pick.id,
      by,
      offset: 0.15 + (crypto.randomInt(0, 1000) / 1000) * 0.7,
      at: Date.now()
    };
    save();
    return json(res, 200, publicState());
  }

  if (route === 'POST /api/release') {
    const item = state.items.find((i) => i.id === body.id);
    if (!item || !item.wonBy) return json(res, 404, { error: 'Nicht gefunden' });
    item.wonBy = null;
    item.wonAt = null;
    if (state.spin?.itemId === item.id) state.spin = null;
    save();
    return json(res, 200, publicState());
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
