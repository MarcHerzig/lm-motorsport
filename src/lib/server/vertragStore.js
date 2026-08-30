// Ablage der gespeicherten Kaufverträge: eine JSON-Datei pro Vertrag,
// benannt nach dem sechsstelligen Abruf-Code. Kein DB-Server nötig, das
// Verzeichnis liegt im Cluster auf einem PVC (Env KAUFVERTRAG_DATA_DIR).

import { mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomInt, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { felder, gastFeld, maxFeldLaenge } from '$lib/vertragFelder.js';

const DATA_DIR = process.env.KAUFVERTRAG_DATA_DIR || '.data/kaufvertraege';

// Ein Vertrag verfällt nach einem Jahr ohne Änderung.
const MAX_ALTER_MS = 365 * 24 * 60 * 60 * 1000;

const erlaubteFelder = new Set(felder);

async function ensureDir() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

function istCode(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code);
}

function pfad(code) {
  if (!istCode(code)) throw new Error('Ungültiger Code');
  return join(DATA_DIR, `${code}.json`);
}

function neueZiffern() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function hashPin(pin, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(pin, salt, 32).toString('hex')}`;
}

function pinStimmt(pin, gespeichert) {
  if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) return false;
  const [salt, hash] = String(gespeichert).split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(pin, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Nur bekannte Felder, nur Strings/Booleans, nur begrenzte Länge.
export function saubereDaten(roh) {
  const daten = {};
  if (!roh || typeof roh !== 'object') return daten;
  for (const [key, wert] of Object.entries(roh)) {
    if (!erlaubteFelder.has(key)) continue;
    if (typeof wert === 'boolean') daten[key] = wert;
    else if (typeof wert === 'string') daten[key] = wert.slice(0, maxFeldLaenge);
  }
  return daten;
}

async function lesen(code) {
  try {
    return JSON.parse(await readFile(pfad(code), 'utf-8'));
  } catch {
    return null;
  }
}

async function schreiben(code, eintrag) {
  await ensureDir();
  await writeFile(pfad(code), JSON.stringify(eintrag), 'utf-8');
}

function abgelaufen(eintrag) {
  return Date.now() - new Date(eintrag.geaendert || eintrag.erstellt).getTime() > MAX_ALTER_MS;
}

// Räumt abgelaufene Verträge weg; läuft beim Anlegen mit.
async function aufraeumen() {
  try {
    for (const datei of await readdir(DATA_DIR)) {
      if (!datei.endsWith('.json')) continue;
      const code = datei.slice(0, -5);
      const eintrag = await lesen(code);
      if (eintrag && abgelaufen(eintrag)) await unlink(pfad(code)).catch(() => {});
    }
  } catch {
    /* Verzeichnis existiert noch nicht — nichts aufzuräumen */
  }
}

export async function anlegen(rohdaten) {
  await ensureDir();
  await aufraeumen();

  let code = neueZiffern();
  for (let versuch = 0; versuch < 20 && existsSync(pfad(code)); versuch++) code = neueZiffern();
  if (existsSync(pfad(code))) throw new Error('Kein freier Code gefunden');

  const masterPin = neueZiffern();
  const jetzt = new Date().toISOString();

  await schreiben(code, {
    code,
    pinHash: hashPin(masterPin),
    daten: saubereDaten(rohdaten),
    erstellt: jetzt,
    geaendert: jetzt
  });

  return { code, masterPin };
}

/**
 * Öffnet einen Vertrag. Mit korrektem Master-PIN als 'verkaeufer'
 * (darf alles), ohne PIN als 'gast' (darf nur das Bemerkungsfeld).
 */
export async function oeffnen(code, pin) {
  const eintrag = await lesen(code);
  if (!eintrag) return null;
  if (abgelaufen(eintrag)) {
    await unlink(pfad(code)).catch(() => {});
    return null;
  }

  const pinAngegeben = typeof pin === 'string' && pin.length > 0;
  if (pinAngegeben && !pinStimmt(pin, eintrag.pinHash)) return { fehler: 'pin' };

  return {
    rolle: pinAngegeben ? 'verkaeufer' : 'gast',
    daten: eintrag.daten,
    geaendert: eintrag.geaendert
  };
}

export async function aktualisieren(code, pin, rohdaten) {
  const eintrag = await lesen(code);
  if (!eintrag || abgelaufen(eintrag)) return null;

  const pinAngegeben = typeof pin === 'string' && pin.length > 0;
  if (pinAngegeben && !pinStimmt(pin, eintrag.pinHash)) return { fehler: 'pin' };

  const neu = saubereDaten(rohdaten);
  if (pinAngegeben) {
    eintrag.daten = neu;
  } else {
    // Gast: alles andere bleibt, wie der Verkäufer es hinterlegt hat.
    eintrag.daten = { ...eintrag.daten, [gastFeld]: neu[gastFeld] ?? '' };
  }
  eintrag.geaendert = new Date().toISOString();
  await schreiben(code, eintrag);

  return { rolle: pinAngegeben ? 'verkaeufer' : 'gast', daten: eintrag.daten };
}

export async function loeschen(code, pin) {
  const eintrag = await lesen(code);
  if (!eintrag) return null;
  if (!pinStimmt(pin, eintrag.pinHash)) return { fehler: 'pin' };
  await unlink(pfad(code)).catch(() => {});
  return { geloescht: true };
}

// Einfache Bremse gegen das Durchprobieren von Codes und PINs: pro IP
// 20 Fehlversuche in 15 Minuten. Reicht bei einer Seite dieser Grösse.
const versuche = new Map();
const FENSTER_MS = 15 * 60 * 1000;
const MAX_FEHLVERSUCHE = 20;

export function gebremst(ip) {
  const eintrag = versuche.get(ip);
  if (!eintrag) return false;
  if (Date.now() - eintrag.seit > FENSTER_MS) {
    versuche.delete(ip);
    return false;
  }
  return eintrag.anzahl >= MAX_FEHLVERSUCHE;
}

export function fehlversuch(ip) {
  const eintrag = versuche.get(ip);
  if (!eintrag || Date.now() - eintrag.seit > FENSTER_MS) {
    versuche.set(ip, { anzahl: 1, seit: Date.now() });
    return;
  }
  eintrag.anzahl += 1;
}

export function versucheZuruecksetzen(ip) {
  versuche.delete(ip);
}
