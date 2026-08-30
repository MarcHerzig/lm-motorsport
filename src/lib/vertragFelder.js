// Alle Formularfelder des Kaufvertrags. Dient dem Server als Whitelist beim
// Speichern (nichts anderes wird abgelegt) und dem Client als Feldliste.
export const felder = [
  // Verkäufer
  'v-name', 'v-vorname', 'v-adresse', 'v-plz', 'v-tel', 'v-mail',
  // Käufer
  'k-name', 'k-vorname', 'k-adresse', 'k-plz', 'k-tel', 'k-mail',
  // Fahrzeug
  'f-marke', 'f-modell', 'f-farbe', 'f-hubraum', 'f-leistung',
  'f-fahrgestell', 'f-stamm', 'f-inverkehr', 'f-km', 'f-mfk',
  // Verkaufspreis
  'p-chf', 'p-anzahlung', 'p-rest', 'p-ausstattung', 'p-key-ja', 'p-key-nein', 'p-aus', 'p-heft',
  // Weitere Angaben
  'w-unfall-ja', 'w-unfall-nein', 'w-maengel-ja', 'w-maengel-nein',
  'w-heft-ja', 'w-heft-nein', 'w-tuning-ja', 'w-tuning-nein', 'w-bemerkungen',
  // Allgemeine Bestimmungen
  'g-aus', 'g-zwei', 'g-andere', 'g-andere-txt',
  'z-bar', 'z-bank', 'z-sonst', 'z-sonst-txt',
  'u-datum', 'u-ort',
  // Unterschriften
  's-v-ort', 's-k-ort'
];

// Das einzige Feld, das jemand mit blossem Abruf-Code ändern darf.
export const gastFeld = 'w-bemerkungen';

export const maxFeldLaenge = 2000;
