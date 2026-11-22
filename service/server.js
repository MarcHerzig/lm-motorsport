// LM Motorsport Service: Kundenfahrzeuge, Teilekatalog pro Fahrzeug, Offerten mit Historie.
// Keine Abhängigkeiten, Daten in einer JSON-Datei (wie lm-wheel).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'ausweise');
const DATA_FILE = path.join(DATA_DIR, 'service.json');
const PORT = Number(process.env.PORT || 3000);
const ASSET_DIR = new URL('./assets/', import.meta.url).pathname;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_MS = 12 * 3600 * 1000;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- Daten ----------
const DEFAULT_SETTINGS = {
  firma: 'LM Motorsport GmbH',
  titel: 'Offerte',
  adresse: '',
  kontakt: '',
  mwst: 8.1,
  arbeit: 0,
  entsorgung: 0,
  reifenmontage: 100,
  bremsfluessigkeit: 50
};
let db = { customers: [], vehicles: [], offers: [], settings: { ...DEFAULT_SETTINGS }, counters: {} };
try {
  const loaded = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  db = { ...db, ...loaded, settings: { ...DEFAULT_SETTINGS, ...(loaded.settings || {}) } };
} catch {}

function save() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
const uid = () => crypto.randomBytes(6).toString('hex');

// Teile, die pro Fahrzeug gemerkt werden. menge = Standardmenge.
const TEILE = [
  { k: 'oel', label: 'Motoröl', grp: 'Service', menge: 5, unit: 'l', hint: 'Sorte/Spezifikation, Menge in Litern, Preis pro Liter' },
  { k: 'oelfilter', label: 'Ölfilter', grp: 'Service', menge: 1, defBez: 'MANN-FILTER' },
  { k: 'luftfilter', label: 'Luftfilter', grp: 'Service', menge: 1, defBez: 'MANN-FILTER' },
  { k: 'innenraumfilter', label: 'Innenraumfilter', grp: 'Service', menge: 1, defBez: 'MANN-FILTER' },
  { k: 'zuendkerzen', label: 'Zündkerzen', grp: 'Service', menge: 4, unit: 'Stk' },
  { k: 'bremsfl', label: 'Bremsflüssigkeit wechseln', grp: 'Service', menge: 1, unit: 'l', defBez: 'Brembo DOT 4', defPreis: 'bremsfluessigkeit' },
  { k: 'scheiben_v', label: 'Bremsscheiben vorne', grp: 'Bremsen', defBez: 'Brembo', menge: 2, unit: 'Stk' },
  { k: 'belaege_v', label: 'Bremsbeläge vorne', grp: 'Bremsen', defBez: 'Brembo', menge: 1, unit: 'Satz' },
  { k: 'scheiben_h', label: 'Bremsscheiben hinten', grp: 'Bremsen', defBez: 'Brembo', menge: 2, unit: 'Stk' },
  { k: 'belaege_h', label: 'Bremsbeläge hinten', grp: 'Bremsen', defBez: 'Brembo', menge: 1, unit: 'Satz' },
  { k: 'reifensatz', label: 'Reifen', grp: 'Reifen', menge: 4, unit: 'Stk' }
];
const SERVICE_DEFAULT_ON = ['oel', 'oelfilter', 'luftfilter', 'innenraumfilter'];

// ---------- Helfer ----------
const e = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = (v, d = 0) => {
  const n = parseFloat(String(v ?? '').replace(',', '.').replace(/['\s]/g, ''));
  return Number.isFinite(n) ? n : d;
};
const round5 = (x) => Math.round(x * 20) / 20;
const chf = (x) =>
  Number(x).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const datum = (iso) => new Date(iso).toLocaleDateString('de-CH', { timeZone: 'Europe/Zurich' });
const custName = (c) => (c ? `${c.vorname} ${c.name}`.trim() : '—');
const vehName = (v) => (v ? `${v.marke} ${v.typ}`.trim() : '—');
const ausweisListe = (v) => v.ausweise || (v.ausweis ? [v.ausweis] : []);
const autodoc = (v, label) =>
  `https://www.autodoc.ch/search?keyword=${encodeURIComponent(`${v.marke} ${v.typ} ${label}`)}`;

// ---------- Login / Sessions ----------
function checkPassword(pw) {
  const [alg, salt, hash] = ADMIN_HASH.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const a = crypto.scryptSync(String(pw), salt, 32);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
function makeToken() {
  const exp = Date.now() + SESSION_MS;
  return `${exp}.${sign(String(exp))}`;
}
function validToken(t) {
  if (!t) return false;
  const [exp, mac] = t.split('.');
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const want = sign(exp);
  return mac.length === want.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(want));
}
function cookies(req) {
  const out = {};
  for (const p of (req.headers.cookie || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  }
  return out;
}
const failed = new Map(); // ip -> { n, until }
const clientIp = (req) => (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

// ---------- HTML ----------
const CSS = `
@font-face{font-family:Oswald;font-weight:500;font-display:swap;src:url(/assets/oswald-500.woff2) format('woff2')}
@font-face{font-family:Oswald;font-weight:600;font-display:swap;src:url(/assets/oswald-600.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:400;font-display:swap;src:url(/assets/inter-400.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:600;font-display:swap;src:url(/assets/inter-600.woff2) format('woff2')}
:root{--bg:#0b0c0e;--surface:#16181c;--border:#2a2d33;--ink:#f5f5f3;--muted:#9ca0a8;--accent:#c8cdd4;--ok:#6fbf8b;--warn:#e0b060;--bad:#e07070}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Inter,system-ui,sans-serif}
a{color:var(--accent)}a:hover{color:#fff}
header.top{display:flex;gap:1rem;align-items:center;flex-wrap:wrap;padding:.8rem 1.2rem;border-bottom:1px solid var(--border);background:var(--surface)}
header.top b{font:600 1.1rem Oswald,Impact,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-right:auto}
header.top a{text-decoration:none;color:var(--muted)}header.top a:hover{color:#fff}
main{max-width:1000px;margin:0 auto;padding:1.2rem}
h1,h2,h3{font-family:Oswald,Impact,sans-serif;font-weight:500;letter-spacing:.03em;margin:.2em 0 .6em}
h1{font-size:1.7rem}h2{font-size:1.25rem;margin-top:1.6em}
.card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1rem;margin:0 0 1rem}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:.45rem .5rem;border-bottom:1px solid var(--border);vertical-align:top}
th{color:var(--muted);font-weight:500;font-size:.82rem}
td.r,th.r{text-align:right;white-space:nowrap}
input,select,textarea{background:#0f1114;color:var(--ink);border:1px solid var(--border);border-radius:6px;padding:.5rem .6rem;font:inherit;width:100%}
input[type=checkbox]{width:auto;transform:scale(1.2)}
input:focus,select:focus,textarea:focus{outline:2px solid #5a6270;border-color:#5a6270}
label{display:block;font-size:.8rem;color:var(--muted);margin-bottom:.2rem}
.grid{display:grid;gap:.8rem;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.btn,button{background:#e9ebee;color:#0b0c0e;border:0;border-radius:6px;padding:.55rem 1rem;font:600 .9rem Inter,sans-serif;cursor:pointer;text-decoration:none;display:inline-block}
.btn:hover,button:hover{background:#fff;color:#000}
.btn.sec,button.sec{background:transparent;color:var(--ink);border:1px solid var(--border)}
.btn.sec:hover,button.sec:hover{border-color:#777;background:transparent;color:#fff}
.btn.del,button.del{background:transparent;color:var(--bad);border:1px solid #5a3030}
.row{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}
.muted{color:var(--muted)}.small{font-size:.82rem}
.tag{display:inline-block;padding:.05rem .5rem;border-radius:99px;font-size:.75rem;border:1px solid var(--border)}
.tag.Bestellt{color:var(--warn);border-color:#6b5628}.tag.Erledigt{color:var(--ok);border-color:#2f5b40}.tag.Abgelehnt{color:var(--bad);border-color:#5a3030}
.err{color:var(--bad)}.pos{display:grid;grid-template-columns:26px 1.6fr 1.1fr 70px 90px 90px;gap:.4rem;align-items:center;padding:.35rem 0;border-bottom:1px solid var(--border)}
.pos.head{color:var(--muted);font-size:.78rem}
.pos .tot{text-align:right;white-space:nowrap}
details.card>summary{cursor:pointer;font:500 1.15rem Oswald,Impact,sans-serif;letter-spacing:.03em;list-style:none;margin:-.2rem 0 .2rem}
details.card>summary::before{content:'▸ ';color:var(--muted)}details.card[open]>summary::before{content:'▾ '}
details.card[open]>summary{margin-bottom:.6rem}
@media(max-width:760px){.pos{grid-template-columns:26px 1fr 1fr}.pos.head{display:none}.pos .tot{grid-column:2/4}}
.sum{margin-left:auto;max-width:340px}.sum td{border:0;padding:.2rem .5rem}.sum tr.t td{font-weight:700;font-size:1.1rem;border-top:2px solid var(--ink)}
`;

function page(title, body, { nav = true, wide = false } = {}) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${e(title)} · LM Service</title><style>${CSS}</style></head><body>
${nav ? `<header class="top"><b>LM Service</b><a href="/">Kunden</a><a href="/offerten">Offerten</a><a href="/einstellungen">Einstellungen</a>
<form method="post" action="/logout" style="margin:0"><button class="sec" style="padding:.3rem .7rem">Logout</button></form></header>` : ''}
<main${wide ? ' style="max-width:1200px"' : ''}>${body}</main></body></html>`;
}

const field = (name, label, val = '', extra = '') =>
  `<div><label for="${name}">${label}</label><input id="${name}" name="${name}" value="${e(val)}" ${extra}></div>`;

// ---------- Offerten-Logik ----------
function buildOffer(form, vehicle) {
  const get = (k) => form.get(k) ?? '';
  const positionen = [];
  for (const t of TEILE) {
    if (get(`on_${t.k}`) !== '1') continue;
    positionen.push({
      key: t.k,
      label: t.label,
      bez: get(`bez_${t.k}`).trim(),
      nr: get(`nr_${t.k}`).trim(),
      menge: num(get(`menge_${t.k}`), 1),
      unit: t.unit || '',
      preis: num(get(`preis_${t.k}`))
    });
  }
  const s = db.settings;
  const arbeit = num(get('arbeit'));
  const entsorgung = num(get('entsorgung'));
  if (arbeit) positionen.push({ key: 'arbeit', label: 'Arbeitsaufwand pauschal', bez: get('arbeit_text').trim(), nr: '', menge: 1, unit: '', preis: arbeit });
  if (entsorgung) positionen.push({ key: 'entsorgung', label: 'Entsorgung pauschal', bez: '', nr: '', menge: 1, unit: '', preis: entsorgung });
  if (get('on_reifen') === '1')
    positionen.push({ key: 'reifen', label: 'Reifenmontage', bez: get('reifen_text').trim(), nr: '', menge: 1, unit: '', preis: num(get('preis_reifen'), s.reifenmontage) });
  for (let i = 1; i <= 80; i++) {
    const b = get(`frei_bez_${i}`).trim();
    if (b) positionen.push({ key: 'frei', label: b, bez: get(`frei_info_${i}`).trim(), nr: get(`frei_nr_${i}`).trim(), menge: num(get(`frei_menge_${i}`), 1), unit: '', preis: num(get(`frei_preis_${i}`)) });
  }
  return sortiert(positionen);
}
const parseDatum = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? new Date(`${d}T12:00:00`).toISOString() : new Date().toISOString());
// Reihenfolge auf dem Beleg: Teile, eigene Positionen, Reifenmontage, Entsorgung, zuletzt Arbeitsaufwand
const RANG = { frei: 100, reifen: 110, entsorgung: 120, arbeit: 130 };
const sortiert = (ps) => {
  const rang = (p) => { const i = TEILE.findIndex((t) => t.k === p.key); return i >= 0 ? i : RANG[p.key] ?? 200; };
  return ps.map((p, i) => [p, i]).sort((a, b) => rang(a[0]) - rang(b[0]) || a[1] - b[1]).map((x) => x[0]);
};
const lineTotal = (p) => Math.round(p.menge * p.preis * 100) / 100;
function totals(positionen) {
  const sum = positionen.reduce((a, p) => a + lineTotal(p), 0);
  const total = round5(sum);
  const mwst = db.settings.mwst;
  return { sum, total, mwstBetrag: Math.round(((total * mwst) / (100 + mwst)) * 100) / 100, mwst };
}
function nextNumber() {
  const y = new Date().getFullYear();
  db.counters[y] = (db.counters[y] || 0) + 1;
  return `O-${y}-${String(db.counters[y]).padStart(3, '0')}`;
}
const posText = (p) => [p.label, p.bez, p.nr ? `Art. ${p.nr}` : ''].filter(Boolean).join(' · ');

// ---------- Seiten ----------
function loginPage(err) {
  return page(
    'Login',
    `<div class="card" style="max-width:360px;margin:12vh auto 0"><h1>LM Service</h1>
<form method="post" action="/login" class="grid" style="grid-template-columns:1fr">
${field('user', 'Benutzer', '', 'autocomplete="username" autofocus')}
<div><label for="pw">Passwort</label><input id="pw" name="pw" type="password" autocomplete="current-password"></div>
${err ? `<div class="err">${e(err)}</div>` : ''}<button>Anmelden</button></form></div>`,
    { nav: false }
  );
}

function dashboard(q) {
  const ql = q.toLowerCase();
  const list = db.customers
    .filter((c) => {
      if (!ql) return true;
      const vs = db.vehicles.filter((v) => v.customerId === c.id).map((v) => `${v.marke} ${v.typ} ${v.kennzeichen}`).join(' ');
      return `${c.vorname} ${c.name} ${c.ort || ''} ${vs}`.toLowerCase().includes(ql);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const rows = list
    .map((c) => {
      const vs = db.vehicles.filter((v) => v.customerId === c.id);
      return `<tr><td><a href="/kunde/${c.id}"><b>${e(custName(c))}</b></a><div class="muted small">${e([c.plz, c.ort].filter(Boolean).join(' '))}</div></td>
<td>${vs.map((v) => `<a href="/fahrzeug/${v.id}">${e(vehName(v))}</a>${v.kennzeichen ? ` <span class="muted small">${e(v.kennzeichen)}</span>` : ''}`).join('<br>') || '<span class="muted">—</span>'}</td></tr>`;
    })
    .join('');
  const recent = [...db.offers].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 5);
  return page(
    'Kunden',
    `<div class="row"><h1 style="margin-right:auto">Kunden</h1><a class="btn" href="/kunde/neu">+ Neuer Kunde</a></div>
<form class="row" method="get" style="margin-bottom:1rem"><input name="q" value="${e(q)}" placeholder="Suche: Name, Ort, Marke, Kennzeichen" style="max-width:420px"><button class="sec">Suchen</button></form>
<div class="card"><table><tr><th>Kunde</th><th>Fahrzeuge</th></tr>${rows || '<tr><td colspan="2" class="muted">Noch keine Kunden.</td></tr>'}</table></div>
${recent.length ? `<h2>Letzte Offerten</h2>${offerTable(recent)}` : ''}`
  );
}

function offerTable(list) {
  return `<div class="card"><table><tr><th>Nr.</th><th>Datum</th><th>Kunde / Fahrzeug</th><th>Status</th><th class="r">Total CHF</th></tr>${list
    .map((o) => {
      const v = db.vehicles.find((x) => x.id === o.vehicleId);
      const c = db.customers.find((x) => x.id === o.customerId);
      return `<tr><td><a href="/offerte/${o.id}">${e(o.nr)}</a></td><td>${datum(o.datum)}</td><td>${e(custName(c))}<div class="muted small">${e(vehName(v))}</div></td>
<td><span class="tag ${e(o.status)}">${e(o.status)}</span></td><td class="r">${chf(totals(o.positionen).total)}</td></tr>`;
    })
    .join('')}</table></div>`;
}

function customerForm(c, action, title, del) {
  c = c || {};
  return page(
    title,
    `<h1>${e(title)}</h1><form method="post" action="${action}" class="card"><div class="grid">
${field('vorname', 'Vorname', c.vorname, 'required')}${field('name', 'Name', c.name, 'required')}
${field('strasse', 'Strasse', c.strasse)}${field('plz', 'PLZ', c.plz)}${field('ort', 'Ort', c.ort)}
${field('tel', 'Telefon', c.tel, 'type="tel"')}${field('email', 'E-Mail', c.email, 'type="email"')}</div>
<div style="margin-top:.8rem"><label for="notiz">Notizen</label><textarea id="notiz" name="notiz" rows="3">${e(c.notiz)}</textarea></div>
<div class="row" style="margin-top:1rem"><button>Speichern</button><a class="btn sec" href="${c.id ? '/kunde/' + c.id : '/'}">Abbrechen</a></div></form>${del || ''}`
  );
}

function customerPage(c) {
  const vs = db.vehicles.filter((v) => v.customerId === c.id);
  const offers = db.offers.filter((o) => o.customerId === c.id).sort((a, b) => b.datum.localeCompare(a.datum));
  const canDel = !offers.length;
  return customerForm(
    c,
    `/kunde/${c.id}`,
    custName(c),
    `<h2>Fahrzeuge</h2><div class="card"><table>${vs
      .map((v) => `<tr><td><a href="/fahrzeug/${v.id}"><b>${e(vehName(v))}</b></a> <span class="muted small">${e([v.baujahr, v.kennzeichen].filter(Boolean).join(' · '))}</span></td>
<td class="r"><a class="btn sec" href="/fahrzeug/${v.id}/offerte">Offerte</a></td></tr>`)
      .join('') || '<tr><td class="muted">Noch kein Fahrzeug.</td></tr>'}</table>
<p><a class="btn" href="/kunde/${c.id}/fahrzeug/neu">+ Fahrzeug</a></p></div>
${offers.length ? `<h2>Offerten</h2>${offerTable(offers)}` : ''}
${canDel ? `<form method="post" action="/kunde/${c.id}/loeschen" onsubmit="return confirm('Kunde und seine Fahrzeuge löschen?')"><button class="del">Kunde löschen</button></form>` : '<p class="muted small">Kunde mit Offerten kann nicht gelöscht werden (Historie).</p>'}`
  );
}

function vehicleForm(v, c, action) {
  v = v || {};
  return `<form method="post" action="${action}" class="card"><div class="grid">
${field('marke', 'Marke', v.marke, 'required placeholder="z.B. BMW"')}${field('typ', 'Typ / Modell', v.typ, 'required placeholder="z.B. 320d F30"')}
${field('motor', 'Motor / Code', v.motor, 'placeholder="z.B. 2.0d 135kW N47"')}${field('baujahr', 'Baujahr / Inverkehrsetzung', v.baujahr)}
${field('kennzeichen', 'Kontrollschild', v.kennzeichen)}${field('stammnr', 'Stammnummer', v.stammnr)}
${field('typenschein', 'Typenschein-Nr. / TG-Code', v.typenschein)}${field('fgnr', 'Fahrgestellnummer (VIN)', v.fgnr)}
${field('km', 'Km-Stand (letzter)', v.km, 'inputmode="numeric"')}</div>
<div style="margin-top:.8rem"><label for="notiz">Notizen</label><textarea id="notiz" name="notiz" rows="2">${e(v.notiz)}</textarea></div>
${v.id ? '' : `<div style="margin-top:.8rem"><label for="neufile">Fahrzeugausweis (Foto oder PDF, mehrere möglich)</label><input type="file" id="neufile" accept="image/*,application/pdf" multiple></div>`}
<div class="row" style="margin-top:1rem"><button>Speichern</button><a class="btn sec" href="${v.id ? '/fahrzeug/' + v.id : '/kunde/' + c.id}">Abbrechen</a><span id="neust" class="muted small"></span></div></form>
${v.id ? '' : `<script>const nf=document.getElementById('neufile');nf.form.addEventListener('submit',async(ev)=>{const fs=[...nf.files];if(!fs.length)return;ev.preventDefault();
const st=document.getElementById('neust');st.textContent='speichert…';const fd=new FormData(nf.form);fd.delete('neufile');const r=await fetch(nf.form.action,{method:'POST',body:new URLSearchParams(fd)});
const base=r.url.replace(/\\/$/,'');if(!r.ok||!/\\/fahrzeug\\/\\w+$/.test(base)){st.textContent='Fehler beim Speichern';return}
for(const f of fs){st.textContent='lädt '+f.name+'…';const u=await fetch(base+'/ausweis',{method:'POST',headers:{'content-type':f.type||'application/octet-stream'},body:f});
if(!u.ok){st.textContent='Fahrzeug gespeichert, Upload fehlgeschlagen: '+await u.text();setTimeout(()=>location.href=base,2500);return}}location.href=base})</script>`}`;
}

function vehiclePage(v) {
  const c = db.customers.find((x) => x.id === v.customerId);
  const offers = db.offers.filter((o) => o.vehicleId === v.id).sort((a, b) => b.datum.localeCompare(a.datum));
  const teile = TEILE.filter((t) => v.teile?.[t.k]);
  const ausweis = ausweisListe(v).length
    ? `<div class="grid" style="margin-bottom:.8rem">${ausweisListe(v).map((f) => `<div>
${f.endsWith('.pdf') ? `<a href="/datei/${e(f)}" target="_blank">PDF öffnen</a>` : `<a href="/datei/${e(f)}" target="_blank"><img src="/datei/${e(f)}" alt="Fahrzeugausweis" style="width:100%;border-radius:6px;border:1px solid var(--border)"></a>`}
<form method="post" action="/fahrzeug/${v.id}/ausweis-loeschen"><input type="hidden" name="datei" value="${e(f)}"><button class="del" style="padding:.2rem .6rem;margin-top:.3rem">entfernen</button></form></div>`).join('')}</div>`
    : '<p class="muted">Noch kein Ausweis hochgeladen.</p>';
  return page(
    vehName(v),
    `<div class="row"><h1 style="margin-right:auto">${e(vehName(v))} <span class="muted" style="font-size:1rem">${e(v.kennzeichen)}</span></h1>
<a class="btn" href="/fahrzeug/${v.id}/offerte">+ Neue Offerte</a></div>
<p>Kunde: <a href="/kunde/${c.id}">${e(custName(c))}</a>${c.tel ? ` · ${e(c.tel)}` : ''}</p>
${vehicleForm(v, c, `/fahrzeug/${v.id}`)}
<h2>Fahrzeugausweis</h2><div class="card">${ausweis}
<div class="row"><input type="file" id="f" accept="image/*,application/pdf" multiple style="max-width:360px"> <button class="sec" type="button" onclick="up()">Hochladen</button>
<span id="st" class="muted small">Foto oder PDF, mehrere Dateien möglich (Vorder- und Rückseite)</span></div></div>
<script>async function up(){const fs=[...document.getElementById('f').files];if(!fs.length)return;const st=document.getElementById('st');
for(const f of fs){st.textContent='lädt '+f.name+'…';const r=await fetch('/fahrzeug/${v.id}/ausweis',{method:'POST',headers:{'content-type':f.type||'application/octet-stream'},body:f});
if(!r.ok){st.textContent='Fehler: '+await r.text();return}}location.reload()}</script>
<h2>Gemerkte Teile</h2><div class="card">${teile.length ? `<table><tr><th>Teil</th><th>Bezeichnung</th><th>Art.-Nr.</th><th class="r">Menge</th><th class="r">Preis</th></tr>${teile
      .map((t) => { const p = v.teile[t.k]; return `<tr><td>${t.label}</td><td>${e(p.bez)}</td><td>${e(p.nr)}</td><td class="r">${p.menge} ${t.unit || ''}</td><td class="r">${chf(p.preis)}</td></tr>`; })
      .join('')}</table>` : '<p class="muted">Noch nichts gespeichert. Die Teile werden beim Erstellen der ersten Offerte erfasst und beim nächsten Mal automatisch vorgeschlagen.</p>'}</div>
<h2>Historie</h2>${offers.length ? offers.map((o) => `<div class="card"><div class="row"><a href="/offerte/${o.id}"><b>${e(o.nr)}</b></a> <span>${datum(o.datum)}</span>
<span class="tag ${e(o.status)}">${e(o.status)}</span>${o.km ? `<span class="muted small">${e(o.km)} km</span>` : ''}<b style="margin-left:auto">CHF ${chf(totals(o.positionen).total)}</b></div>
<div class="muted small">${o.positionen.map((p) => e(p.label + (p.bez ? ' ' + p.bez : '') + (p.nr ? ' (' + p.nr + ')' : ''))).join(' · ')}</div></div>`).join('') : '<p class="muted">Noch keine Offerten.</p>'}
<form method="post" action="/fahrzeug/${v.id}/loeschen" onsubmit="return confirm('Fahrzeug löschen?')">${offers.length ? '<p class="muted small">Fahrzeug mit Offerten kann nicht gelöscht werden (Historie).</p>' : '<button class="del">Fahrzeug löschen</button>'}</form>`
  );
}

const todayZh = (iso) => new Date(iso || Date.now()).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

function offerFormPage(v, von, edit) {
  const c = db.customers.find((x) => x.id === v.customerId);
  const s = db.settings;
  const last = db.offers.filter((o) => o.vehicleId === v.id && o.id !== edit?.id).sort((a, b) => b.datum.localeCompare(a.datum))[0];
  const base = edit || von || null;
  const rowFor = (t) => {
    const saved = v.teile?.[t.k] || {};
    const pos = base?.positionen.find((p) => p.key === t.k);
    const p = pos || { ...saved, bez: saved.bez || t.defBez || '', preis: saved.preis ?? (t.defPreis ? s[t.defPreis] : undefined) };
    const on = base ? !!pos : t.grp === 'Service' && SERVICE_DEFAULT_ON.includes(t.k);
    return `<div class="pos"><input type="checkbox" name="on_${t.k}" value="1" ${on ? 'checked' : ''} class="calc">
<div><input name="bez_${t.k}" value="${e(p.bez)}" placeholder="${t.k === 'oel' ? 'z.B. Castrol Edge 5W-30 LL' : t.k === 'reifensatz' ? 'z.B. Michelin Pilot Sport 4 225/45 R17' : 'Hersteller / Bezeichnung'}" aria-label="${t.label}"><div class="small muted">${t.label}${t.k === 'reifensatz' ? ' · Preis pro Stück' : ''} · <a href="${autodoc(v, t.label)}" target="_blank" rel="noopener">Autodoc ↗</a>${t.k === 'oel' ? ` · <a href="https://www.google.com/search?q=${encodeURIComponent('castrol ölfinder ' + vehName(v))}" target="_blank" rel="noopener">Ölfinder ↗</a>` : ''}</div></div>
<input name="nr_${t.k}" value="${e(p.nr)}" placeholder="Art.-Nr." aria-label="Artikelnummer">
<input name="menge_${t.k}" value="${p.menge ?? t.menge}" inputmode="decimal" class="calc" aria-label="Menge ${t.unit || ''}" title="${t.unit || 'Menge'}">
<input name="preis_${t.k}" value="${p.preis ?? ''}" inputmode="decimal" class="calc" placeholder="Preis" aria-label="Preis">
<div class="tot" data-tot="${t.k}"></div></div>`;
  };
  const head = '<div class="pos head"><span></span><span>Bezeichnung</span><span>Art.-Nr.</span><span>Menge</span><span>Preis CHF</span><span class="tot">Total</span></div>';
  const group = (g) => `<h3>${g}</h3>${head}${TEILE.filter((t) => t.grp === g).map(rowFor).join('')}`;
  const bp = (k) => base?.positionen.find((p) => p.key === k);
  const grpOpen = (g) => !!base?.positionen.some((p) => TEILE.find((t) => t.k === p.key)?.grp === g);
  const extra = (key, label, def, name) => `<div class="pos"><input type="checkbox" name="on_${name}" value="1" class="calc" ${base ? (bp(key) ? 'checked' : '') : ''}><div>${label}${key === 'reifen' ? `<input name="reifen_text" value="${e(bp('reifen')?.bez || '')}" placeholder="z.B. 4 Räder 17&quot;, ohne Entsorgung Altreifen" style="margin-top:.3rem">` : ''}</div><span></span><span></span><input name="preis_${name}" value="${bp(key)?.preis ?? def}" inputmode="decimal" class="calc"><div class="tot"></div></div>`;
  const freie = (base?.positionen || []).filter((p) => p.key === 'frei');
  const freiRow = (i, f) => `<div class="pos frei"><span></span><input name="frei_bez_${i}" value="${e(f?.label || '')}" placeholder="Hersteller / Bezeichnung"><input name="frei_nr_${i}" value="${e(f?.nr || '')}" placeholder="Art.-Nr."><input name="frei_menge_${i}" value="${f?.menge ?? 1}" class="calc" inputmode="decimal"><input name="frei_preis_${i}" value="${f?.preis ?? ''}" class="calc" inputmode="decimal" placeholder="CHF"><div class="tot"></div></div>`;
  const nFrei = Math.max(freie.length, 2);
  const titel = edit ? `${e(s.titel)} ${e(edit.nr)} bearbeiten` : `Neue ${e(s.titel)}`;
  return page(
    titel,
    `<h1>${titel}</h1><p><a href="/kunde/${c.id}">${e(custName(c))}</a> · <a href="/fahrzeug/${v.id}"><b>${e(vehName(v))}</b></a> ${e(v.kennzeichen)} ${v.motor ? `<span class="muted">· ${e(v.motor)}</span>` : ''}</p>
${last && !edit ? `<div class="card small"><b>Letzte ${e(s.titel)} ${e(last.nr)} (${datum(last.datum)}, ${e(last.status)}):</b> ${last.positionen.map((p) => e(p.label + (p.bez ? ' ' + p.bez : ''))).join(' · ')}
<br><a href="/fahrzeug/${v.id}/offerte?von=${last.id}">→ Genau diese Positionen übernehmen</a></div>` : ''}
<form method="post" action="${edit ? `/offerte/${edit.id}/bearbeiten` : `/fahrzeug/${v.id}/offerte`}" id="of">
<div class="card">${group('Service')}</div>
<details class="card" ${freie.length ? 'open' : ''}><summary>Eigene Positionen</summary>${head}<div id="frei">${Array.from({ length: nFrei }, (_, i) => freiRow(i + 1, freie[i])).join('')}</div>
<p><button type="button" class="sec" id="addfrei">+ Position hinzufügen</button></p></details>
<details class="card" ${grpOpen('Bremsen') ? 'open' : ''}><summary>Bremsen</summary>${head}${TEILE.filter((t) => t.grp === 'Bremsen').map(rowFor).join('')}</details>
<details class="card" ${grpOpen('Reifen') || bp('reifen') ? 'open' : ''}><summary>Reifen</summary>${head}${TEILE.filter((t) => t.grp === 'Reifen').map(rowFor).join('')}
${extra('reifen', 'Reifenmontage (ohne Entsorgung Altreifen)', s.reifenmontage, 'reifen')}</details>
<details class="card" open><summary>Aufwand &amp; Entsorgung</summary>
<div class="pos"><span></span><div>Arbeitsaufwand pauschal<input name="arbeit_text" value="${e(bp('arbeit')?.bez || '')}" placeholder="Beschreibung (optional)" style="margin-top:.3rem"></div><span></span><span></span><input name="arbeit" value="${bp('arbeit')?.preis ?? (base ? '' : s.arbeit || '')}" inputmode="decimal" class="calc" placeholder="CHF"><div class="tot"></div></div>
<div class="pos"><span></span><div>Entsorgung pauschal (Altöl, Filter, Bremsteile)</div><span></span><span></span><input name="entsorgung" value="${bp('entsorgung')?.preis ?? (base ? '' : s.entsorgung || '')}" inputmode="decimal" class="calc" placeholder="CHF"><div class="tot"></div></div>
</details>
<div class="card"><div class="grid">${field('datum', 'Datum', todayZh(edit?.datum), 'type="date" required')}${field('km', 'Km-Stand', base?.km || v.km || '', 'inputmode="numeric"')}</div>
<div style="margin-top:.8rem"><label for="notiz">Bemerkung auf dem Beleg</label><textarea id="notiz" name="notiz" rows="2">${e(base?.notiz || '')}</textarea></div>
<p><label style="display:inline"><input type="checkbox" name="merken" value="1" checked> Teile (Bezeichnung, Art.-Nr., Menge, Preis) am Fahrzeug merken</label></p>
<table class="sum"><tr><td>Total CHF (auf 5 Rappen)</td><td class="r" id="sum"><b>0.00</b></td></tr></table></div>
<div class="row"><button>${edit ? 'Änderungen speichern' : 'Erstellen'}</button><a class="btn sec" href="${edit ? '/offerte/' + edit.id : '/fahrzeug/' + v.id}">Abbrechen</a></div></form>
<script>
const f=document.getElementById('of'),n=x=>parseFloat(String(x||'').replace(',','.'))||0;
function calc(){let s=0;f.querySelectorAll('.pos:not(.head)').forEach(r=>{const cb=r.querySelector('input[type=checkbox]');const m=r.querySelector('[name^=menge_],[name^=frei_menge_]');
const p=r.querySelector('[name^=preis_],[name=arbeit],[name=entsorgung],[name^=frei_preis_]');const t=r.querySelector('.tot');if(!p||!t)return;
const on=cb?cb.checked:true;const v=on?Math.round((m?n(m.value):1)*n(p.value)*100)/100:0;t.textContent=v?v.toFixed(2):'';s+=v});
document.getElementById('sum').innerHTML='<b>'+(Math.round(s*20)/20).toFixed(2)+'</b>'}
let nf=${nFrei};
document.getElementById('addfrei').onclick=()=>{nf++;const d=document.createElement('div');d.className='pos frei';
d.innerHTML='<span></span><input name="frei_bez_'+nf+'" placeholder="Hersteller / Bezeichnung"><input name="frei_nr_'+nf+'" placeholder="Art.-Nr."><input name="frei_menge_'+nf+'" value="1" class="calc" inputmode="decimal"><input name="frei_preis_'+nf+'" class="calc" inputmode="decimal" placeholder="CHF"><div class="tot"></div>';
document.getElementById('frei').appendChild(d);d.querySelector('input').focus()};
f.addEventListener('input',calc);f.addEventListener('change',calc);calc();
</script>`,
    { wide: true }
  );
}

const SHEET_CSS = `
.paper{background:#fff;color:#16181c;max-width:210mm;margin:0 auto;font:14px/1.45 Inter,system-ui,sans-serif;box-shadow:0 8px 40px #000a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.paper .band{background:#0b0c0e;color:#f5f5f3;padding:7mm 9mm;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.paper .band img{height:13mm;width:auto;display:block}
.paper .doc{text-align:right;font:500 6.4mm Oswald,Impact,sans-serif;letter-spacing:.14em;text-transform:uppercase;line-height:1.1}
.paper .doc small{display:block;font:400 3.3mm Inter,sans-serif;letter-spacing:.04em;color:#a7acb4;text-transform:none;margin-top:1.4mm}
.paper .rule{height:1.3mm;background:linear-gradient(90deg,#f5f5f3,#8b9199 55%,#3a3d44)}
.paper .bd{padding:8mm 9mm 7mm}
.paper .parties{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-bottom:8mm}
.paper .party{border-left:1mm solid #8b9199;padding-left:4mm;line-height:1.5}
.paper .lab{font:500 3mm Oswald,Impact,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#6b7078;margin-bottom:1mm}
.paper .party b{font-size:4.3mm;font-weight:600}
.paper table.pt{width:100%;border-collapse:collapse}
.paper .pt th{background:#0b0c0e;color:#f5f5f3;font:500 3.1mm Oswald,Impact,sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:2.3mm 3mm;text-align:left;border:0}
.paper .pt td{padding:2.7mm 3mm;border:0;border-bottom:.25mm solid #dcdfe3;vertical-align:top;color:#16181c}
.paper .pt tbody tr:nth-child(even) td{background:#f4f5f6}
.paper .pt .r{text-align:right;white-space:nowrap}
.paper .pt tr{break-inside:avoid}
.paper .sub{color:#6b7078;font-size:3.3mm}
.paper .totbox{margin:6mm 0 0 auto;width:78mm;break-inside:avoid}
.paper .totbox .ln{display:flex;justify-content:space-between;padding:.9mm 0;color:#6b7078;font-size:3.4mm}
.paper .totbox .t{background:#0b0c0e;color:#f5f5f3;padding:3.2mm 4mm;margin-top:2mm;font:500 5.4mm Oswald,Impact,sans-serif;letter-spacing:.05em;display:flex;justify-content:space-between}
.paper .note{margin-top:7mm;white-space:pre-line;border-left:1mm solid #dcdfe3;padding-left:4mm;color:#3a3d44}
.paper .foot{margin:9mm 9mm 0;padding:3mm 0 7mm;border-top:.3mm solid #c9cdd2;color:#6b7078;font-size:3.1mm;display:flex;justify-content:space-between;gap:6mm;white-space:pre-line}
@page{size:A4;margin:10mm}
@media print{header.top,.noprint{display:none!important}body{background:#fff}main{max-width:none;padding:0}.paper{box-shadow:none;max-width:none}}
`;

function sheetHtml(o) {
  const v = db.vehicles.find((x) => x.id === o.vehicleId);
  const c = db.customers.find((x) => x.id === o.customerId);
  const t = totals(o.positionen);
  const s = db.settings;
  const foot = [s.firma, s.adresse.replace(/\n+/g, ', '), s.kontakt].filter(Boolean).join('  ·  ');
  return `<style>${SHEET_CSS}</style>
<div class="paper">
<div class="band"><img src="/assets/logo.png" alt="${e(s.firma)}"><div class="doc">${e(s.titel)}<small>Nr. ${e(o.nr)} · ${datum(o.datum)}</small></div></div>
<div class="rule"></div>
<div class="bd">
<div class="parties">
<div class="party"><div class="lab">Kunde</div><b>${e(custName(c))}</b><br>${e(c.strasse || '')}${c.strasse ? '<br>' : ''}${e([c.plz, c.ort].filter(Boolean).join(' '))}</div>
<div class="party"><div class="lab">Fahrzeug</div><b>${e(vehName(v))}</b>${v.motor ? '<br>' + e(v.motor) : ''}${v.kennzeichen ? '<br>Kontrollschild ' + e(v.kennzeichen) : ''}${v.fgnr ? '<br>VIN ' + e(v.fgnr) : ''}${o.km ? '<br>' + e(o.km) + ' km' : ''}</div></div>
<table class="pt"><thead><tr><th>Position</th><th class="r">Menge</th><th class="r">Preis</th><th class="r">Total CHF</th></tr></thead><tbody>${sortiert(o.positionen)
      .map((p) => `<tr><td><b>${e(p.label)}</b>${p.bez ? '<div class="sub">' + e(p.bez) + '</div>' : ''}${p.nr ? `<div class="sub">Art.-Nr. ${e(p.nr)}</div>` : ''}</td><td class="r">${p.menge}${p.unit ? ' ' + p.unit : ''}</td><td class="r">${chf(p.preis)}</td><td class="r">${chf(lineTotal(p))}</td></tr>`)
      .join('')}</tbody></table>
<div class="totbox"><div class="ln"><span>Zwischensumme</span><span>${chf(t.sum)}</span></div>
${Math.abs(t.total - t.sum) > 0.001 ? `<div class="ln"><span>Rundung auf 5 Rp.</span><span>${chf(t.total - t.sum)}</span></div>` : ''}
<div class="t"><span>Total CHF</span><span>${chf(t.total)}</span></div>
<div class="ln" style="margin-top:1.5mm"><span>inkl. ${s.mwst}% MWST</span><span>${chf(t.mwstBetrag)}</span></div></div>
${o.notiz ? `<div class="note">${e(o.notiz)}</div>` : ''}
</div>
<div class="foot">${e(foot)}</div></div>`;
}

function offerPage(o, origin) {
  const v = db.vehicles.find((x) => x.id === o.vehicleId);
  const link = o.share ? `${origin}/v/${o.share}` : '';
  return page(
    o.nr,
    `<div class="row noprint" style="margin-bottom:1rem"><a class="btn" href="#" onclick="window.print();return false">Als PDF speichern / drucken</a>
<a class="btn sec" href="/offerte/${o.id}/bearbeiten">Bearbeiten</a>
<a class="btn sec" href="/fahrzeug/${v.id}/offerte?von=${o.id}">Als Vorlage für neuen Beleg</a>
${['Offerte', 'Bestellt', 'Erledigt', 'Abgelehnt'].filter((st) => st !== o.status).map((st) => `<form method="post" action="/offerte/${o.id}/status" style="margin:0"><input type="hidden" name="status" value="${st}"><button class="sec">→ ${st}</button></form>`).join('')}
<span class="tag ${e(o.status)}">Status: ${e(o.status)}</span>
<form method="post" action="/offerte/${o.id}/loeschen" style="margin:0" onsubmit="return confirm('Löschen?')"><button class="del">Löschen</button></form></div>
<div class="card noprint"><b>Vorschau-Link für den Kunden</b> <span class="muted small">zeigt nur diesen Beleg, ohne Login</span>
${link ? `<div class="row" style="margin-top:.5rem"><input id="lnk" value="${e(link)}" readonly style="max-width:520px" onclick="this.select()"><button class="sec" type="button" onclick="navigator.clipboard.writeText(document.getElementById('lnk').value).then(()=>this.textContent='Kopiert ✓')">Kopieren</button>
<form method="post" action="/offerte/${o.id}/teilen-aus" style="margin:0" onsubmit="return confirm('Link sperren? Der Kunde sieht den Beleg dann nicht mehr.')"><button class="del">Link sperren</button></form></div>`
 : `<form method="post" action="/offerte/${o.id}/teilen" style="margin-top:.5rem"><button>Link erstellen</button></form>`}</div>
${sheetHtml(o)}`,
    {}
  );
}

function publicPage(o) {
  return page(
    `${db.settings.titel} ${o.nr}`,
    `<div class="row noprint" style="margin-bottom:1rem;max-width:210mm;margin-left:auto;margin-right:auto"><a class="btn" href="#" onclick="window.print();return false">Als PDF speichern / drucken</a></div>
${sheetHtml(o)}`,
    { nav: false }
  );
}

function offersPage(q) {
  const ql = q.toLowerCase();
  const list = db.offers
    .filter((o) => {
      if (!ql) return true;
      const v = db.vehicles.find((x) => x.id === o.vehicleId);
      const c = db.customers.find((x) => x.id === o.customerId);
      return `${o.nr} ${o.status} ${custName(c)} ${vehName(v)} ${v?.kennzeichen}`.toLowerCase().includes(ql);
    })
    .sort((a, b) => b.datum.localeCompare(a.datum));
  return page('Offerten', `<h1>Offerten</h1><form class="row" method="get" style="margin-bottom:1rem"><input name="q" value="${e(q)}" placeholder="Suche: Kunde, Fahrzeug, Nr., Status" style="max-width:420px"><button class="sec">Suchen</button></form>${offerTable(list)}`);
}

function settingsPage(msg) {
  const s = db.settings;
  return page(
    'Einstellungen',
    `<h1>Einstellungen</h1>${msg ? `<p class="muted">${e(msg)}</p>` : ''}<form method="post" class="card"><div class="grid">
${field('firma', 'Firma', s.firma)}${field('titel', 'Titel des Belegs (z.B. Offerte, Leistungsnachweis)', s.titel)}${field('mwst', 'MWST % (in Preisen enthalten)', s.mwst, 'inputmode="decimal"')}
${field('arbeit', 'Standard Arbeitsaufwand CHF', s.arbeit, 'inputmode="decimal"')}${field('entsorgung', 'Standard Entsorgung CHF', s.entsorgung, 'inputmode="decimal"')}
${field('reifenmontage', 'Reifenmontage CHF', s.reifenmontage, 'inputmode="decimal"')}${field('bremsfluessigkeit', 'Bremsflüssigkeit CHF', s.bremsfluessigkeit, 'inputmode="decimal"')}
</div>
<div style="margin-top:.8rem"><label for="adresse">Adresse (Briefkopf)</label><textarea id="adresse" name="adresse" rows="3">${e(s.adresse)}</textarea></div>
<div style="margin-top:.8rem"><label for="kontakt">Kontakt (Telefon, E-Mail, MWST-Nr.)</label><input id="kontakt" name="kontakt" value="${e(s.kontakt)}"></div>
<p><button>Speichern</button></p></form>`
  );
}

// ---------- Server ----------
const send = (res, code, body, type = 'text/html; charset=utf-8', extra = {}) => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store', 'x-frame-options': 'DENY', 'referrer-policy': 'same-origin', ...extra });
  res.end(body);
};
const redirect = (res, to, extra = {}) => { res.writeHead(303, { location: to, ...extra }); res.end(); };
function readBody(req, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('zu gross')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
const pick = (form, keys) => Object.fromEntries(keys.map((k) => [k, (form.get(k) ?? '').trim()]));
const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf', heic: 'image/heic' };
const EXT_BY_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf', 'image/heic': 'heic' };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    const secure = req.headers['x-forwarded-proto'] === 'https';
    const origin = `${secure ? 'https' : 'http'}://${req.headers.host}`;

    if (p === '/healthz') return send(res, 200, 'ok', 'text/plain');

    let pr;
    if ((pr = p.match(/^\/assets\/([\w.-]+)$/)) && req.method === 'GET') {
      const f = path.join(ASSET_DIR, path.basename(pr[1]));
      if (!fs.existsSync(f)) return send(res, 404, 'nicht gefunden', 'text/plain');
      const ext = path.extname(f).slice(1);
      return send(res, 200, fs.readFileSync(f), ext === 'woff2' ? 'font/woff2' : MIME[ext] || 'application/octet-stream', { 'cache-control': 'public, max-age=86400' });
    }
    // Vorschau-Link für Kunden: nur der eine Beleg, ohne Login
    if ((pr = p.match(/^\/v\/(\w{16,64})$/)) && req.method === 'GET') {
      const o = db.offers.find((x) => x.share && x.share === pr[1]);
      if (!o) return send(res, 404, page('Nicht gefunden', '<h1 style="text-align:center;margin-top:20vh">Dieser Link ist nicht (mehr) gültig.</h1>', { nav: false }));
      return send(res, 200, publicPage(o), 'text/html; charset=utf-8', { 'x-robots-tag': 'noindex' });
    }

    if (p === '/login') {
      if (req.method === 'GET') return send(res, 200, loginPage());
      const ip = clientIp(req);
      const f = failed.get(ip) || { n: 0, until: 0 };
      if (f.until > Date.now()) return send(res, 429, loginPage('Zu viele Versuche, bitte kurz warten.'));
      const form = new URLSearchParams((await readBody(req, 4096)).toString());
      const okUser = crypto.timingSafeEqual(crypto.createHash('sha256').update(form.get('user') || '').digest(), crypto.createHash('sha256').update(ADMIN_USER).digest());
      if (okUser && checkPassword(form.get('pw') || '')) {
        failed.delete(ip);
        return redirect(res, '/', { 'set-cookie': `lm_session=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${secure ? '; Secure' : ''}` });
      }
      f.n++; if (f.n >= 5) { f.until = Date.now() + 5 * 60000; f.n = 0; }
      failed.set(ip, f);
      return send(res, 401, loginPage('Benutzer oder Passwort falsch.'));
    }

    if (!validToken(cookies(req).lm_session)) return redirect(res, '/login');

    if (p === '/logout' && req.method === 'POST') return redirect(res, '/login', { 'set-cookie': 'lm_session=; Max-Age=0; Path=/' });

    // CSRF: schreibende Anfragen nur von der eigenen Seite
    if (req.method === 'POST') {
      // Cookie ist SameSite=Strict; zusätzlich fremde Herkunft ablehnen ("null" = Browser ohne Referrer, erlaubt)
      const site = req.headers['sec-fetch-site'];
      const o = req.headers.origin;
      let host = null;
      try { if (o && o !== 'null') host = new URL(o).host; } catch { host = '?'; }
      if ((site && !['same-origin', 'none'].includes(site)) || (host && host !== req.headers.host))
        return send(res, 403, 'verboten', 'text/plain');
    }

    const m = (re) => p.match(re);
    const getForm = async () => new URLSearchParams((await readBody(req, 1024 * 1024)).toString());
    let r;

    if (p === '/' && req.method === 'GET') return send(res, 200, dashboard(url.searchParams.get('q') || ''));
    if (p === '/offerten' && req.method === 'GET') return send(res, 200, offersPage(url.searchParams.get('q') || ''));

    if (p === '/einstellungen') {
      if (req.method === 'GET') return send(res, 200, settingsPage());
      const form = await getForm();
      const s = db.settings;
      for (const k of ['firma', 'titel', 'adresse', 'kontakt']) s[k] = (form.get(k) || '').trim() || (k === 'titel' ? 'Offerte' : '');
      for (const k of ['mwst', 'arbeit', 'entsorgung', 'reifenmontage', 'bremsfluessigkeit']) s[k] = num(form.get(k));
          save();
      return send(res, 200, settingsPage('Gespeichert.'));
    }

    // Kunden
    if (p === '/kunde/neu') {
      if (req.method === 'GET') return send(res, 200, customerForm(null, '/kunde/neu', 'Neuer Kunde'));
      const c = { id: uid(), ...pick(await getForm(), ['vorname', 'name', 'strasse', 'plz', 'ort', 'tel', 'email', 'notiz']), erstellt: new Date().toISOString() };
      db.customers.push(c); save();
      return redirect(res, `/kunde/${c.id}/fahrzeug/neu`);
    }
    if ((r = m(/^\/kunde\/(\w+)$/))) {
      const c = db.customers.find((x) => x.id === r[1]);
      if (!c) return send(res, 404, page('404', '<h1>Nicht gefunden</h1>'));
      if (req.method === 'GET') return send(res, 200, customerPage(c));
      Object.assign(c, pick(await getForm(), ['vorname', 'name', 'strasse', 'plz', 'ort', 'tel', 'email', 'notiz'])); save();
      return redirect(res, `/kunde/${c.id}`);
    }
    if ((r = m(/^\/kunde\/(\w+)\/loeschen$/)) && req.method === 'POST') {
      if (!db.offers.some((o) => o.customerId === r[1])) {
        db.vehicles = db.vehicles.filter((v) => v.customerId !== r[1]);
        db.customers = db.customers.filter((c) => c.id !== r[1]); save();
      }
      return redirect(res, '/');
    }
    if ((r = m(/^\/kunde\/(\w+)\/fahrzeug\/neu$/))) {
      const c = db.customers.find((x) => x.id === r[1]);
      if (!c) return send(res, 404, page('404', '<h1>Nicht gefunden</h1>'));
      if (req.method === 'GET') return send(res, 200, page('Neues Fahrzeug', `<h1>Neues Fahrzeug</h1><p>${e(custName(c))}</p>${vehicleForm(null, c, req.url)}`));
      const v = { id: uid(), customerId: c.id, ...pick(await getForm(), ['marke', 'typ', 'motor', 'baujahr', 'kennzeichen', 'stammnr', 'typenschein', 'fgnr', 'km', 'notiz']), teile: {}, erstellt: new Date().toISOString() };
      db.vehicles.push(v); save();
      return redirect(res, `/fahrzeug/${v.id}`);
    }

    // Fahrzeuge
    if ((r = m(/^\/fahrzeug\/(\w+)(?:\/(\w[\w-]*))?$/))) {
      const v = db.vehicles.find((x) => x.id === r[1]);
      if (!v) return send(res, 404, page('404', '<h1>Nicht gefunden</h1>'));
      const sub = r[2];
      if (!sub && req.method === 'GET') return send(res, 200, vehiclePage(v));
      if (!sub && req.method === 'POST') {
        Object.assign(v, pick(await getForm(), ['marke', 'typ', 'motor', 'baujahr', 'kennzeichen', 'stammnr', 'typenschein', 'fgnr', 'km', 'notiz'])); save();
        return redirect(res, `/fahrzeug/${v.id}`);
      }
      if (sub === 'loeschen' && req.method === 'POST') {
        if (!db.offers.some((o) => o.vehicleId === v.id)) { db.vehicles = db.vehicles.filter((x) => x.id !== v.id); save(); return redirect(res, `/kunde/${v.customerId}`); }
        return redirect(res, `/fahrzeug/${v.id}`);
      }
      if (sub === 'ausweis' && req.method === 'POST') {
        const ext = EXT_BY_TYPE[(req.headers['content-type'] || '').split(';')[0]];
        if (!ext) return send(res, 400, 'Nur Bild oder PDF', 'text/plain');
        const buf = await readBody(req);
        if (!buf.length) return send(res, 400, 'Datei leer', 'text/plain');
        const name = `${v.id}-${uid()}.${ext}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
        v.ausweise = [...ausweisListe(v), name]; delete v.ausweis; save();
        return send(res, 200, 'ok', 'text/plain');
      }
      if (sub === 'ausweis-loeschen' && req.method === 'POST') {
        const name = (await getForm()).get('datei');
        const liste = ausweisListe(v);
        if (liste.includes(name)) {
          fs.rmSync(path.join(UPLOAD_DIR, name), { force: true });
          v.ausweise = liste.filter((x) => x !== name); delete v.ausweis; save();
        }
        return redirect(res, `/fahrzeug/${v.id}`);
      }
      if (sub === 'offerte') {
        if (req.method === 'GET') {
          const von = db.offers.find((o) => o.id === url.searchParams.get('von') && o.vehicleId === v.id);
          return send(res, 200, offerFormPage(v, von));
        }
        const form = await getForm();
        const positionen = buildOffer(form, v);
        if (!positionen.length) return send(res, 400, page('Fehler', '<h1>Keine Position gewählt</h1><p><a href="javascript:history.back()">Zurück</a></p>'));
        if (form.get('merken') === '1') {
          v.teile = v.teile || {};
          for (const p of positionen) if (TEILE.some((t) => t.k === p.key)) v.teile[p.key] = { bez: p.bez, nr: p.nr, menge: p.menge, preis: p.preis };
        }
        const km = (form.get('km') || '').trim();
        if (km) v.km = km;
        const o = { id: uid(), nr: nextNumber(), datum: parseDatum(form.get('datum')), vehicleId: v.id, customerId: v.customerId, status: 'Offerte', km, notiz: (form.get('notiz') || '').trim(), positionen };
        db.offers.push(o); save();
        return redirect(res, `/offerte/${o.id}`);
      }
    }

    if ((r = m(/^\/datei\/([\w.-]+)$/))) {
      const f = path.join(UPLOAD_DIR, path.basename(r[1]));
      if (!fs.existsSync(f)) return send(res, 404, 'nicht gefunden', 'text/plain');
      return send(res, 200, fs.readFileSync(f), MIME[path.extname(f).slice(1)] || 'application/octet-stream');
    }

    // Offerten
    if ((r = m(/^\/offerte\/(\w+)(?:\/([\w-]+))?$/))) {
      const o = db.offers.find((x) => x.id === r[1]);
      if (!o) return send(res, 404, page('404', '<h1>Nicht gefunden</h1>'));
      if (!r[2] && req.method === 'GET') return send(res, 200, offerPage(o, origin));
      if (r[2] === 'bearbeiten') {
        const v = db.vehicles.find((x) => x.id === o.vehicleId);
        if (req.method === 'GET') return send(res, 200, offerFormPage(v, null, o));
        const form = await getForm();
        const positionen = buildOffer(form, v);
        if (!positionen.length) return send(res, 400, page('Fehler', '<h1>Keine Position gewählt</h1><p><a href="javascript:history.back()">Zurück</a></p>'));
        if (form.get('merken') === '1') {
          v.teile = v.teile || {};
          for (const p of positionen) if (TEILE.some((t) => t.k === p.key)) v.teile[p.key] = { bez: p.bez, nr: p.nr, menge: p.menge, preis: p.preis };
        }
        o.positionen = positionen;
        o.datum = parseDatum(form.get('datum'));
        o.km = (form.get('km') || '').trim();
        o.notiz = (form.get('notiz') || '').trim();
        o.geaendert = new Date().toISOString();
        save();
        return redirect(res, `/offerte/${o.id}`);
      }
      if (r[2] === 'teilen' && req.method === 'POST') { if (!o.share) { o.share = crypto.randomBytes(12).toString('hex'); save(); } return redirect(res, `/offerte/${o.id}`); }
      if (r[2] === 'teilen-aus' && req.method === 'POST') { delete o.share; save(); return redirect(res, `/offerte/${o.id}`); }
      if (r[2] === 'status' && req.method === 'POST') {
        const st = (await getForm()).get('status');
        if (['Offerte', 'Bestellt', 'Erledigt', 'Abgelehnt'].includes(st)) { o.status = st; o[`${st.toLowerCase()}Am`] = new Date().toISOString(); save(); }
        return redirect(res, `/offerte/${o.id}`);
      }
      if (r[2] === 'loeschen' && req.method === 'POST') { db.offers = db.offers.filter((x) => x.id !== o.id); save(); return redirect(res, `/fahrzeug/${o.vehicleId}`); }
    }

    return send(res, 404, page('404', '<h1>Nicht gefunden</h1>'));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(res, 500, 'Fehler', 'text/plain');
  }
});

if (!ADMIN_HASH) console.warn('ADMIN_PASSWORD_HASH nicht gesetzt: Login nicht möglich.');
server.listen(PORT, () => console.log(`lm-service auf :${PORT}`));
