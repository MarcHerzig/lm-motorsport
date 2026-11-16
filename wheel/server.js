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

let state = { items: [], wins: [], busyUntil: 0, busyBy: null, lock: { on: false, spinners: [], by: null }, users: {}, sessions: {} };
try {
  state = { ...state, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
} catch {}

function save() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

const MAX_LOCKED_SPINS = 2;
const LOCKED = { error: 'Das Rad ist gesperrt' };
const scrypt = (pin, salt) => crypto.scryptSync(pin, salt, 32).toString('hex');
const fails = {}; // Fehlversuche je Name: { n, until }
function auth(req) {
  const t = String(req.headers['x-token'] || '');
  const u = state.users[state.sessions[t]];
  return u ? u.name : '';
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
  me: viewer,
  items: state.items.map(({ id, name, owner, weight }) => ({ id, name, owner, weight })),
  mine: state.wins.filter((w) => w.by === viewer),
  lock: { on: state.lock.on, spinners: state.lock.spinners, by: state.lock.by, max: MAX_LOCKED_SPINS },
  busy: state.busyUntil > Date.now() ? state.busyBy : null,
  now: Date.now()
});

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const me = auth(req); // Wer du bist, bestimmt allein der Server anhand des Tokens
  if (route === 'GET /api/state') return json(res, 200, { ...publicState(me), me });

  let body = {};
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: 'Ungültige Anfrage' });
  }

  if (route === 'POST /api/login') {
    const name = clean(body.name, 30);
    const pin = String(body.pin ?? '');
    if (!name || pin.length < 4 || pin.length > 40) return json(res, 400, { error: 'Name und PIN (mind. 4 Zeichen) nötig' });
    const key = name.toLowerCase();
    const f = fails[key] || { n: 0, until: 0 };
    if (f.until > Date.now()) return json(res, 429, { error: 'Zu viele Fehlversuche, warte eine Minute' });
    let u = state.users[key];
    if (!u) {
      const salt = crypto.randomBytes(16).toString('hex');
      u = state.users[key] = { name, salt, hash: scrypt(pin, salt) };
    } else if (!crypto.timingSafeEqual(Buffer.from(scrypt(pin, u.salt)), Buffer.from(u.hash))) {
      f.n += 1;
      if (f.n >= 5) { f.n = 0; f.until = Date.now() + 60000; }
      fails[key] = f;
      return json(res, 401, { error: 'Falsche PIN. Dieser Name ist schon vergeben.' });
    }
    delete fails[key];
    const token = crypto.randomBytes(24).toString('hex');
    state.sessions[token] = key;
    save();
    return json(res, 200, { token, name: u.name });
  }

  if (!me) return json(res, 401, { error: 'Bitte zuerst oben anmelden' });

  if (route === 'POST /api/lock') {
    if (state.busyUntil > Date.now()) return json(res, 409, { error: 'Das Rad dreht gerade noch' });
    state.lock = { on: true, spinners: [], by: me };
    save();
    return json(res, 200, publicState(me));
  }
  if (route === 'POST /api/unlock') {
    if (state.busyUntil > Date.now()) return json(res, 409, { error: 'Das Rad dreht gerade noch' });
    if (state.lock.on && state.lock.by && state.lock.by !== me) return json(res, 403, { error: `Nur ${state.lock.by} kann entsperren` });
    state.lock = { on: false, spinners: [], by: null };
    save();
    return json(res, 200, publicState(me));
  }

  const mutating = ['POST /api/items', 'POST /api/shuffle', 'POST /api/release'].includes(route) || /^\/api\/items\//.test(url.pathname);
  if (state.lock.on && mutating) return json(res, 409, LOCKED);

  if (route === 'POST /api/items') {
    const name = clean(body.name, 80);
    const owner = me;
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
    if (state.lock.on) {
      if (state.lock.spinners.length >= MAX_LOCKED_SPINS) return json(res, 409, { error: `Gesperrt: es haben schon ${MAX_LOCKED_SPINS} Personen gedreht` });
      if (state.lock.spinners.includes(me)) return json(res, 409, { error: 'Gesperrt: du hast schon gedreht, jetzt ist jemand anderes dran' });
    }
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
    if (state.lock.on) state.lock.spinners.push(me);
    state.wins.push({ id: pick.id, name: pick.name, owner: pick.owner, weight: pick.weight, by: me, at: Date.now() });
    state.busyUntil = Date.now() + 8000;
    state.busyBy = me;
    save();
    return json(res, 200, {
      ...publicState(me),
      spin: { itemId: pick.id, offset: 0.15 + (crypto.randomInt(0, 1000) / 1000) * 0.7 }
    });
  }

  if (route === 'POST /api/shuffle') {
    if (state.busyUntil > Date.now()) return json(res, 409, { error: 'Das Rad dreht gerade noch' });
    for (let i = state.items.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [state.items[i], state.items[j]] = [state.items[j], state.items[i]];
    }
    save();
    return json(res, 200, publicState(me));
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
