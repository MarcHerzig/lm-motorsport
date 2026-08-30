import { json, error } from '@sveltejs/kit';
import { anlegen } from '$lib/server/vertragStore.js';

// Neuen Vertrag ablegen -> Abruf-Code und Master-PIN zurückgeben.
export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Ungültige Anfrage');
  }

  try {
    const { code, masterPin } = await anlegen(body?.daten);
    return json({ code, masterPin });
  } catch (e) {
    console.error('[kaufvertrag] Speichern fehlgeschlagen:', e);
    throw error(500, 'Der Vertrag konnte nicht gespeichert werden.');
  }
}
