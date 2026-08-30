import { json, error } from '@sveltejs/kit';
import {
  oeffnen,
  aktualisieren,
  loeschen,
  gebremst,
  fehlversuch,
  versucheZuruecksetzen
} from '$lib/server/vertragStore.js';

function ip(event) {
  try {
    return event.getClientAddress();
  } catch {
    return 'unbekannt';
  }
}

async function body(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// Öffnen ist ein POST, damit der PIN nicht in der URL landet.
export async function POST(event) {
  const adresse = ip(event);
  if (gebremst(adresse)) throw error(429, 'Zu viele Versuche. Bitte in 15 Minuten nochmals probieren.');

  const { pin } = await body(event.request);
  const ergebnis = await oeffnen(event.params.code, pin);

  if (!ergebnis) {
    fehlversuch(adresse);
    throw error(404, 'Zu diesem Code ist kein Vertrag hinterlegt.');
  }
  if (ergebnis.fehler === 'pin') {
    fehlversuch(adresse);
    throw error(403, 'Der Master-PIN stimmt nicht.');
  }

  versucheZuruecksetzen(adresse);
  return json(ergebnis);
}

export async function PUT(event) {
  const adresse = ip(event);
  if (gebremst(adresse)) throw error(429, 'Zu viele Versuche. Bitte in 15 Minuten nochmals probieren.');

  const { pin, daten } = await body(event.request);
  const ergebnis = await aktualisieren(event.params.code, pin, daten);

  if (!ergebnis) {
    fehlversuch(adresse);
    throw error(404, 'Zu diesem Code ist kein Vertrag hinterlegt.');
  }
  if (ergebnis.fehler === 'pin') {
    fehlversuch(adresse);
    throw error(403, 'Der Master-PIN stimmt nicht.');
  }

  return json(ergebnis);
}

export async function DELETE(event) {
  const adresse = ip(event);
  if (gebremst(adresse)) throw error(429, 'Zu viele Versuche. Bitte in 15 Minuten nochmals probieren.');

  const { pin } = await body(event.request);
  const ergebnis = await loeschen(event.params.code, pin);

  if (!ergebnis) {
    fehlversuch(adresse);
    throw error(404, 'Zu diesem Code ist kein Vertrag hinterlegt.');
  }
  if (ergebnis.fehler === 'pin') {
    fehlversuch(adresse);
    throw error(403, 'Zum Löschen braucht es den Master-PIN.');
  }

  return json({ geloescht: true });
}
