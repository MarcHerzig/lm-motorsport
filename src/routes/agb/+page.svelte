<script>
  import { site } from '$lib/content.js';
</script>

<svelte:head>
  <title>AGB — LM Motorsport</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="section max-w-3xl">
  <span class="eyebrow">Rechtliches</span>
  <h1 class="text-4xl mt-2 mb-8">Allgemeine Geschäftsbedingungen</h1>

  <div class="card !bg-transparent border-dashed mb-8 text-sm text-muted">
    Entwurf/Platzhalter — juristisch prüfen lassen und an die tatsächlichen Leistungen, Preise und
    Zahlungsbedingungen anpassen, bevor die Seite live geht.
  </div>

  <div class="space-y-8 text-muted leading-relaxed">
    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">1. Geltungsbereich</h2>
      <p>
        Diese AGB gelten für alle Aufträge und Dienstleistungen von {site.legalName} — LM Car Finder,
        LM Car Checker, LM Pit Stop sowie das Kombi-Paket.
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">2. Leistungsumfang</h2>
      <p>
        Der genaue Leistungsumfang je Service (Suchauftrag, Fahrzeugbesichtigung, Garagenarbeiten)
        wird vor Auftragsbeginn schriftlich oder per E-Mail bestätigt. Preise auf der Website sind
        Richtwerte; der definitive Preis wird pro Auftrag individuell bestätigt.
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">3. Haftung</h2>
      <p>
        Bei LM Car Finder und LM Car Checker handelt es sich um eine fachkundige Einschätzung, keine
        Garantie. Eine Haftung für verdeckte Mängel, die auch bei fachmännischer Prüfung nicht
        erkennbar waren, ist ausgeschlossen, soweit gesetzlich zulässig.
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">4. Zahlungsbedingungen</h2>
      <p>Zahlungsbedingungen werden pro Auftrag vereinbart. (Platzhalter — bitte ergänzen.)</p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">5. Anwendbares Recht</h2>
      <p>Es gilt Schweizer Recht. Gerichtsstand ist der Sitz von {site.legalName}.</p>
    </div>
  </div>
</section>
