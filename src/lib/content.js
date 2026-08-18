// Zentrale Inhalte (Entwurf 1) — Preise sind Platzhalter/Richtwerte, siehe Briefing Abschnitt 9.

export const site = {
  name: 'LM Motorsport',
  legalName: 'LM Motorsport GmbH',
  claim: 'Dein Auto. Gefunden, geprüft, gewartet.',
  email: 'info@lm-motorsport.ch',
  phone: '+41 XX XXX XX XX',
  location: 'Schweiz (Adresse/Region — Platzhalter)'
};

export const images = {
  hero: 'https://images.unsplash.com/photo-1597849428022-92605a5e5309?q=80&w=1920&auto=format&fit=crop',
  finder: 'https://images.unsplash.com/photo-1624914261154-061edb25385e?q=80&w=1600&auto=format&fit=crop',
  checker: 'https://images.unsplash.com/photo-1552982070-5c7588fa46ec?q=80&w=1600&auto=format&fit=crop',
  pitstop: 'https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?q=80&w=1600&auto=format&fit=crop',
  brands: {
    audi: 'https://images.unsplash.com/photo-1532974143451-8162d38a1257?q=80&w=800&auto=format&fit=crop',
    mercedes: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=800&auto=format&fit=crop',
    bmw: 'https://images.unsplash.com/photo-1642538033964-b0da6e136536?q=80&w=800&auto=format&fit=crop',
    volvo: 'https://images.unsplash.com/photo-1644004485045-da65391d6f44?q=80&w=800&auto=format&fit=crop'
  }
};

export const services = [
  {
    key: 'finder',
    slug: 'car-finder',
    name: 'LM Car Finder',
    short: 'Wir finden dein Auto',
    teaser:
      'Du weisst, was du willst, hast aber keine Zeit zum Suchen? Wir übernehmen die Recherche und legen dir eine passende Vorauswahl vor.',
    image: images.finder,
    priceFrom: 'ab CHF 250 pro Suchauftrag',
    steps: [
      { title: 'Wunsch aufnehmen', text: 'Marke, Modell, Budget, Anforderungen, Ausstattung.' },
      { title: 'Marktrecherche', text: 'Wir durchsuchen Plattformen, Händler und unser Netzwerk.' },
      {
        title: 'Abklärung beim Händler',
        text: 'Telefonische Abklärung zu Zustand, Servicehistorie und bekannten Mängeln, ggf. Preisverhandlung.'
      },
      { title: 'Vorauswahl', text: 'Wir präsentieren dir die besten Treffer, transparent bewertet.' },
      { title: 'Nächster Schritt', text: 'Auf Wunsch prüfen wir dein Favoriten-Auto direkt vor Ort (LM Car Checker).' }
    ],
    includes: [
      'Eine handverlesene Vorauswahl passender Fahrzeuge',
      'Ehrliche Einschätzung zu Preis und Zustand der Angebote',
      'Recherche zu bekannten Mängeln je Modell',
      'Zeitersparnis und ein gutes Gefühl beim Kauf'
    ]
  },
  {
    key: 'checker',
    slug: 'car-checker',
    name: 'LM Car Checker',
    short: 'Wir prüfen dein Auto',
    teaser:
      'Ein konkretes Auto im Blick? Wir fahren hin, prüfen es fachmännisch und sagen dir ehrlich, was es taugt – inklusive Zustandsbericht.',
    image: images.checker,
    priceFrom: 'ab CHF 180 pro Besichtigung (zzgl. Anfahrt)',
    checks: [
      { title: 'Technik', text: 'Motor, Getriebe, Bremsen, Fahrwerk, Elektronik.' },
      { title: 'Karosserie & Optik', text: 'Roststellen, Unfallspuren, Lack, Zustand.' },
      { title: 'Historie', text: 'Serviceheft, Kilometerstand, Plausibilität.' },
      { title: 'Probefahrt', text: 'Fahrverhalten, Geräusche, Auffälligkeiten.' }
    ],
    includes: [
      'Verständlicher Zustandsbericht mit klarer Empfehlung',
      'Ehrliche Einschätzung – auch wenn sie mal „Finger weg" heisst',
      'Grundlage für eine fundierte Kaufentscheidung'
    ]
  },
  {
    key: 'pitstop',
    slug: 'pit-stop',
    name: 'LM Pit Stop',
    short: 'Wir halten dich am Laufen',
    teaser:
      'Reifenwechsel, Ölwechsel und kleine Wartungsarbeiten – schnell, sauber und zu fairen Preisen.',
    image: images.pitstop,
    priceFrom: 'Reifenwechsel ab CHF 40, Ölwechsel ab CHF 90',
    offerings: [
      'Reifenwechsel (Sommer/Winter), inkl. Einlagerung auf Wunsch',
      'Ölwechsel und Flüssigkeitskontrolle',
      'Kleine Wartung und Checks vor der grossen Fahrt',
      'Aufbereitung und Pflege'
    ]
  }
];

export const combo = {
  name: 'Kombi-Paket: Finder + Checker',
  teaser:
    'Du willst beides? Wir suchen dein Auto und prüfen es vor Ort – alles aus einer Hand. Das Rundum-sorglos-Paket vom ersten Inserat bis zur ehrlichen Kaufempfehlung.',
  priceFrom: 'ab CHF 380 (günstiger als beide einzeln)'
};

export const howItWorks = [
  { title: 'Melden', text: 'Du meldest dich – über das Formular oder direkt per Telefon.' },
  { title: 'Besprechen', text: 'Wir besprechen dein Anliegen – Wunschauto, Budget, oder was ansteht.' },
  { title: 'Loslegen', text: 'Wir legen los – suchen, prüfen oder schrauben.' },
  { title: 'Ergebnis', text: 'Du bekommst ein klares Ergebnis – ehrliche Empfehlung statt Verkaufsgeschwätz.' }
];

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/ueber-uns', label: 'Über uns' },
  { href: '/kontakt', label: 'Kontakt' }
];
