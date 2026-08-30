<script>
  import { site } from '$lib/content.js';
</script>

<svelte:head>
  <title>Datenschutzerklärung — LM Motorsport</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="section max-w-3xl">
  <span class="eyebrow">Rechtliches</span>
  <h1 class="text-4xl mt-2 mb-8">Datenschutzerklärung</h1>

  <div class="card !bg-transparent border-dashed mb-8 text-sm text-muted">
    Entwurf/Platzhalter, orientiert am Schweizer Datenschutzgesetz (DSG). Vor Live-Schaltung durch
    eine Fachperson prüfen und an die effektive Datenverarbeitung anpassen.
  </div>

  <div class="space-y-8 text-muted leading-relaxed">
    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Verantwortliche Stelle</h2>
      <p>
        {site.legalName}, {site.location}, Schweiz.<br />
        E-Mail: <a href={`mailto:${site.email}`} class="hover:text-accent">{site.email}</a>
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Welche Daten wir verarbeiten</h2>
      <p>
        Wenn du unser Kontaktformular nutzt, verarbeiten wir die von dir angegebenen Daten (Name,
        E-Mail, Telefon, Nachricht, optionale Fahrzeugangaben) ausschliesslich zur Bearbeitung deiner
        Anfrage. Diese Daten werden per E-Mail an uns übermittelt und nicht an Dritte weitergegeben.
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Gespeicherte Kaufverträge</h2>
      <p>
        Wer auf <a href="/kaufvertrag" class="hover:text-accent">/kaufvertrag</a> einen Vertrag
        speichert, legt die eingegebenen Angaben (unter anderem Namen, Adressen, Telefonnummern und
        Fahrzeugdaten von Verkäufer und Käufer) auf unserem Server ab. Der Zugriff erfolgt
        ausschliesslich über den sechsstelligen Abruf-Code, das Ändern und Löschen aller Felder
        zusätzlich nur mit dem Master-PIN. Wir werten diese Daten nicht aus und geben sie nicht
        weiter. Wer den Master-PIN hat, kann den Vertrag jederzeit selbst löschen; ohne Änderung
        wird ein Vertrag nach einem Jahr automatisch entfernt.
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Cookies</h2>
      <p>
        Diese Website verwendet aktuell nur ein technisch notwendiges, lokales Speicherelement
        (localStorage), um deine Zustimmung zum Cookie-Hinweis zu merken. Es werden keine
        Analyse- oder Tracking-Cookies eingesetzt. Sollte sich das ändern, wird diese Erklärung
        entsprechend aktualisiert.
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Deine Rechte</h2>
      <p>
        Nach Schweizer DSG hast du das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung
        der Bearbeitung deiner Daten. Wende dich dazu an die oben genannte Kontaktadresse.
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Hosting</h2>
      <p>
        Diese Website läuft aktuell auf einer privaten Infrastruktur als Vorabversion (Staging).
        Details zum finalen Hosting werden ergänzt, sobald der produktive Betrieb unter
        lm-motorsport.ch startet.
      </p>
    </div>
  </div>
</section>
