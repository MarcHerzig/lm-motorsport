<script>
  import { site } from '$lib/content.js';

  function drucken() {
    window.print();
  }
</script>

<svelte:head>
  <title>Kaufvertrag Fahrzeug — Vorlage zum Ausfüllen | LM Motorsport</title>
  <meta
    name="description"
    content="Kostenlose Kaufvertrags-Vorlage für den privaten Fahrzeugverkauf in der Schweiz. Direkt im Browser ausfüllen, als PDF speichern oder ausdrucken."
  />
</svelte:head>

<section class="section max-w-6xl kv-intro">
  <span class="eyebrow">Werkzeug</span>
  <h1 class="text-4xl md:text-5xl mt-2 mb-6">Kaufvertrag</h1>
  <div class="max-w-2xl text-muted leading-relaxed space-y-4">
    <p>
      Vorlage für den privaten Fahrzeugverkauf in der Schweiz — zwei Seiten, alles drin, was in den
      Vertrag gehört. Direkt hier ausfüllen, als PDF speichern oder leer ausdrucken und von Hand
      ergänzen.
    </p>
    <p class="text-sm">
      Deine Eingaben bleiben im Browser und werden nirgendwohin übermittelt. Beim Neuladen der Seite
      sind sie weg — sichere den Vertrag also als PDF, bevor du das Fenster schliesst.
    </p>
  </div>

  <div class="mt-8 flex flex-wrap gap-4">
    <button type="button" class="btn-primary" on:click={drucken}>Als PDF speichern / drucken</button>
    <button type="reset" form="kaufvertrag" class="btn-ghost">Felder leeren</button>
  </div>

  <p class="mt-6 text-xs text-muted max-w-2xl">
    Tipp für ein sauberes PDF: im Druckdialog Ziel „Als PDF speichern", Ränder „Keine" und
    „Hintergrundgrafiken" aktivieren.
  </p>
</section>

<form id="kaufvertrag" class="kv-stage">
  <!-- ============ SEITE 1 ============ -->
  <div class="kv-sheet">
    <div class="kv-masthead">
      <img src="/brand/logo.png?v=2" alt={site.name} />
      <div class="kv-doctitle">Kaufvertrag<span>Fahrzeug — Privatverkauf</span></div>
    </div>

    <div class="kv-section">
      <h2>Verkäufer</h2>
      <div class="kv-grid">
        <p class="kv-field"><label for="v-name">Name</label><input id="v-name" type="text" /></p>
        <p class="kv-field"><label for="v-vorname">Vorname</label><input id="v-vorname" type="text" /></p>
        <p class="kv-field"><label for="v-adresse">Wohnadresse</label><input id="v-adresse" type="text" /></p>
        <p class="kv-field"><label for="v-plz">PLZ / Ort</label><input id="v-plz" type="text" /></p>
        <p class="kv-field"><label for="v-tel">Telefonnummer</label><input id="v-tel" type="text" /></p>
        <p class="kv-field"><label for="v-mail">E-Mail</label><input id="v-mail" type="text" /></p>
        <div class="kv-field kv-span2">
          <span class="kv-label">Verkäufer ist rechtmässiger Eigentümer</span>
          <span class="kv-choices kv-choices-pad">
            <span class="kv-choice"><input type="checkbox" id="v-eig-ja" /><label for="v-eig-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="v-eig-nein" /><label for="v-eig-nein">nein</label></span>
          </span>
        </div>
      </div>
    </div>

    <div class="kv-section">
      <h2>Käufer</h2>
      <div class="kv-grid">
        <p class="kv-field"><label for="k-name">Name</label><input id="k-name" type="text" /></p>
        <p class="kv-field"><label for="k-vorname">Vorname</label><input id="k-vorname" type="text" /></p>
        <p class="kv-field"><label for="k-adresse">Wohnadresse</label><input id="k-adresse" type="text" /></p>
        <p class="kv-field"><label for="k-plz">PLZ / Ort</label><input id="k-plz" type="text" /></p>
        <p class="kv-field"><label for="k-tel">Telefonnummer</label><input id="k-tel" type="text" /></p>
        <p class="kv-field"><label for="k-mail">E-Mail</label><input id="k-mail" type="text" /></p>
      </div>
    </div>

    <div class="kv-section">
      <h2>Fahrzeug</h2>
      <div class="kv-grid">
        <p class="kv-field"><label for="f-marke">Marke</label><input id="f-marke" type="text" /></p>
        <p class="kv-field"><label for="f-fahrgestell">Fahrgestell-Nummer</label><input id="f-fahrgestell" type="text" /></p>
        <p class="kv-field"><label for="f-modell">Modell / Typ</label><input id="f-modell" type="text" /></p>
        <p class="kv-field"><label for="f-stamm">Stamm-Nummer</label><input id="f-stamm" type="text" /></p>
        <p class="kv-field"><label for="f-karosserie">Karosserie (Limousine, Kombi, Cabrio, …)</label><input id="f-karosserie" type="text" /></p>
        <p class="kv-field"><label for="f-typengen">Typengenehmigung</label><input id="f-typengen" type="text" /></p>
        <p class="kv-field"><label for="f-farbe">Farbe</label><input id="f-farbe" type="text" /></p>
        <p class="kv-field"><label for="f-inverkehr">1. Inverkehrsetzung</label><input id="f-inverkehr" type="text" /></p>
        <p class="kv-field"><label for="f-hubraum">Hubraum</label><input id="f-hubraum" type="text" /></p>
        <p class="kv-field"><label for="f-km">Kilometerstand</label><input id="f-km" type="text" /></p>
        <p class="kv-field"><label for="f-leistung">Leistung</label><input id="f-leistung" type="text" /></p>
        <p class="kv-field"><label for="f-mfk">Datum der letzten MFK-Prüfung</label><input id="f-mfk" type="text" /></p>
      </div>
      <p class="kv-note">Die meisten dieser Angaben stehen im Fahrzeugausweis.</p>
    </div>

    <div class="kv-section">
      <h2>Verkaufspreis</h2>
      <div class="kv-grid">
        <p class="kv-field"><label for="p-chf">Kaufpreis in CHF</label><input id="p-chf" type="text" /></p>
        <p class="kv-field"><label for="p-anzahlung">Anzahlung in CHF (falls vereinbart)</label><input id="p-anzahlung" type="text" /></p>
        <p class="kv-field"><label for="p-rest">Restbetrag bei Übergabe in CHF</label><input id="p-rest" type="text" /></p>
        <p class="kv-field kv-span2">
          <label for="p-ausstattung">Zusätzliche Ausstattung (z. B. Anbauteile, Zubehör-Auspuff, Räder)</label>
          <textarea id="p-ausstattung" rows="3"></textarea>
        </p>
        <div class="kv-field">
          <span class="kv-label">Zweitschlüssel vorhanden</span>
          <span class="kv-choices kv-choices-pad">
            <span class="kv-choice"><input type="checkbox" id="p-key-ja" /><label for="p-key-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="p-key-nein" /><label for="p-key-nein">nein</label></span>
          </span>
        </div>
        <div class="kv-field">
          <span class="kv-label">Mitgegeben</span>
          <span class="kv-choices kv-choices-pad">
            <span class="kv-choice"><input type="checkbox" id="p-aus" /><label for="p-aus">Fahrzeugausweis</label></span>
            <span class="kv-choice"><input type="checkbox" id="p-heft" /><label for="p-heft">Serviceheft</label></span>
          </span>
        </div>
      </div>
    </div>

    <div class="kv-foot">
      <div>
        {site.name} &middot; lm-motorsport.ch &middot; {site.email}<br />
        Vertragsvorlage — Seite 1 von 2, nur zusammen mit Seite 2 gültig.
      </div>
      <div class="kv-pageno">1/2</div>
    </div>
  </div>

  <!-- ============ SEITE 2 ============ -->
  <div class="kv-sheet">
    <div class="kv-masthead kv-slim">
      <img src="/brand/logo.png?v=2" alt={site.name} />
      <div class="kv-doctitle kv-doctitle-sm">Kaufvertrag<span>Seite 2 von 2</span></div>
    </div>

    <div class="kv-section">
      <h2>Weitere Angaben zum Fahrzeug</h2>

      <div class="kv-qlist">
        <div class="kv-qrow">
          <span class="kv-question">Ist das Fahrzeug unfallfrei (nur allfällige Bagatellschäden wie Kratzer o. ä.)?</span>
          <span class="kv-choices">
            <span class="kv-choice"><input type="checkbox" id="w-unfall-ja" /><label for="w-unfall-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="w-unfall-nein" /><label for="w-unfall-nein">nein</label></span>
          </span>
        </div>
        <div class="kv-qrow">
          <span class="kv-question">Sind Mängel am Fahrzeug bekannt?</span>
          <span class="kv-choices">
            <span class="kv-choice"><input type="checkbox" id="w-maengel-ja" /><label for="w-maengel-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="w-maengel-nein" /><label for="w-maengel-nein">nein</label></span>
          </span>
        </div>
        <div class="kv-qrow">
          <span class="kv-question">Ist das Serviceheft vorhanden und korrekt nachgeführt?</span>
          <span class="kv-choices">
            <span class="kv-choice"><input type="checkbox" id="w-heft-ja" /><label for="w-heft-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="w-heft-nein" /><label for="w-heft-nein">nein</label></span>
          </span>
        </div>
        <div class="kv-qrow">
          <span class="kv-question">Wurde das Fahrzeug getunt oder technisch verändert (Eintrag im Fahrzeugausweis)?</span>
          <span class="kv-choices">
            <span class="kv-choice"><input type="checkbox" id="w-tuning-ja" /><label for="w-tuning-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="w-tuning-nein" /><label for="w-tuning-nein">nein</label></span>
          </span>
        </div>
      </div>

      <p class="kv-field kv-remarks">
        <label for="w-bemerkungen">Generelle Bemerkungen</label>
        <textarea id="w-bemerkungen" rows="6"></textarea>
      </p>
    </div>

    <div class="kv-section">
      <h2>Allgemeine Bestimmungen</h2>

      <h3>Gewährleistung</h3>
      <div class="kv-opt">
        <input type="checkbox" id="g-aus" />
        <label for="g-aus">
          Jede Gewährleistung wird, soweit gesetzlich zulässig, wegbedungen; insbesondere sind
          Wandelung und Minderung ausgeschlossen. Das Fahrzeug wird verkauft, wie es steht und liegt.
        </label>
      </div>
      <div class="kv-opt">
        <input type="checkbox" id="g-zwei" />
        <label for="g-zwei">Zwei Jahre Gewährleistung gemäss Art. 210 OR.</label>
      </div>
      <div class="kv-opt">
        <input type="checkbox" id="g-andere" />
        <label for="g-andere" class="kv-nowrap">Andere Bestimmung</label>
        <input type="text" id="g-andere-txt" class="kv-inline" aria-label="Andere Bestimmung zur Gewährleistung" />
      </div>

      <h3 class="kv-h3-gap">Zahlung</h3>
      <div class="kv-opt">
        <input type="checkbox" id="z-bar" />
        <label for="z-bar">Bar bei der Übergabe des Fahrzeugs.</label>
      </div>
      <div class="kv-opt">
        <input type="checkbox" id="z-bank" />
        <label for="z-bank">Banküberweisung.</label>
      </div>
      <div class="kv-opt">
        <input type="checkbox" id="z-sonst" />
        <label for="z-sonst" class="kv-nowrap">Sonstige Zahlungsart</label>
        <input type="text" id="z-sonst-txt" class="kv-inline" aria-label="Sonstige Zahlungsart" />
      </div>
      <p class="kv-clause">
        Die Übergabe des Fahrzeugs erfolgt in jedem Fall erst, wenn der volle Kaufpreis beim
        Verkäufer eingegangen ist.
      </p>

      <h3 class="kv-h3-gap">Fahrzeugübergabe</h3>
      <div class="kv-grid">
        <p class="kv-field"><label for="u-datum">Übergabedatum</label><input id="u-datum" type="text" /></p>
        <p class="kv-field"><label for="u-ort">Übergabeort</label><input id="u-ort" type="text" /></p>
      </div>
      <p class="kv-note">
        Nutzen und Gefahr gehen mit der Übergabe des Fahrzeugs auf den Käufer über. Der Käufer
        bestätigt mit seiner Unterschrift, das Fahrzeug besichtigt und probegefahren zu haben.
      </p>
    </div>

    <div class="kv-section">
      <h2>Unterschriften</h2>
      <div class="kv-signatures">
        <div>
          <h3>Verkäufer</h3>
          <p class="kv-field"><label for="s-v-ort">Ort / Datum</label><input id="s-v-ort" type="text" /></p>
          <div class="kv-sigline"></div>
          <div class="kv-sigcap">Unterschrift</div>
        </div>
        <div>
          <h3>Käufer</h3>
          <p class="kv-field"><label for="s-k-ort">Ort / Datum</label><input id="s-k-ort" type="text" /></p>
          <div class="kv-sigline"></div>
          <div class="kv-sigcap">Unterschrift</div>
        </div>
      </div>
    </div>

    <div class="kv-foot">
      <div>
        Diese Vertragsvorlage wird von {site.name} zur Verfügung gestellt. {site.name} ist an der
        vertraglichen Beziehung zwischen Verkäufer und Käufer nicht beteiligt und übernimmt keine
        Verantwortung für Abschluss, Inhalt oder Erfüllung dieses Vertrages.<br />
        {site.name} &middot; lm-motorsport.ch &middot; {site.email}
      </div>
      <div class="kv-pageno">2/2</div>
    </div>
  </div>
</form>

<style>
  /* Der Vertrag ist ein Papierdokument auf der dunklen Seite: eigene, druckfeste
     Millimeter-CSS statt Tailwind-Utilities. Alle Klassen mit kv- präfixiert,
     damit nichts mit den Tailwind-Utilities kollidiert. */
  .kv-stage {
    --paper: #ffffff;
    --ink: #14161a;
    --ink-soft: #5c626b;
    --hairline: #ccd0d5;
    --band: #0b0c0e;
    --band-ink: #f5f5f3;
    --silver: #8b9199;
    --fill: #f1f2f4;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8mm;
    padding: 0 16px 64px;
  }

  .kv-sheet {
    width: 210mm;
    max-width: 100%;
    min-height: 297mm;
    background: var(--paper);
    color: var(--ink);
    padding: 14mm 16mm 12mm;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 18px 44px rgba(0, 0, 0, 0.45);
    box-sizing: border-box;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .kv-masthead {
    background: var(--band);
    margin: -14mm -16mm 9mm;
    padding: 9mm 16mm 8mm;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12mm;
  }
  .kv-masthead img {
    width: 44mm;
    height: auto;
    display: block;
  }
  .kv-slim {
    padding-top: 7mm;
    padding-bottom: 6mm;
  }
  .kv-slim img {
    width: 30mm;
  }

  .kv-doctitle {
    font-family: 'Oswald', 'Arial Narrow', sans-serif;
    font-weight: 500;
    font-size: 20pt;
    line-height: 1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--band-ink);
    text-align: right;
    text-wrap: balance;
  }
  .kv-doctitle-sm {
    font-size: 13pt;
  }
  .kv-doctitle span {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    font-weight: 400;
    letter-spacing: 0.22em;
    color: var(--silver);
    margin-top: 3mm;
  }

  .kv-section {
    margin-bottom: 7mm;
  }
  .kv-sheet h2 {
    font-family: 'Oswald', 'Arial Narrow', sans-serif;
    font-weight: 500;
    font-size: 12.5pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink);
    margin: 0 0 4mm;
    padding-bottom: 1.6mm;
    border-bottom: 1.6pt solid var(--ink);
    display: flex;
    align-items: baseline;
    gap: 3mm;
  }
  /* Das Dreifach-Slash aus dem Logo als Sektionsmarke */
  .kv-sheet h2::before {
    content: '';
    width: 7mm;
    height: 3mm;
    flex: none;
    background: linear-gradient(
      105deg,
      transparent 0 8%,
      var(--silver) 8% 30%,
      transparent 30% 40%,
      var(--silver) 40% 62%,
      transparent 62% 72%,
      var(--silver) 72% 94%,
      transparent 94%
    );
  }
  .kv-sheet h3 {
    font-family: 'Oswald', 'Arial Narrow', sans-serif;
    font-weight: 500;
    font-size: 9.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink);
    margin: 0 0 1.5mm;
  }
  .kv-h3-gap {
    margin-top: 5mm !important;
  }

  .kv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 10mm;
    row-gap: 4.5mm;
  }
  .kv-span2 {
    grid-column: 1 / -1;
  }

  .kv-field {
    display: flex;
    flex-direction: column;
    gap: 1mm;
    margin: 0 0 4.5mm;
  }
  .kv-grid .kv-field {
    margin-bottom: 0;
  }
  .kv-field label,
  .kv-label,
  .kv-sigcap {
    font-size: 7pt;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .kv-field input,
  .kv-field textarea,
  .kv-inline {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 10pt;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    background: var(--fill);
    border: none;
    border-bottom: 0.6pt solid var(--hairline);
    border-radius: 1px;
    padding: 1.6mm 2mm;
    width: 100%;
    box-sizing: border-box;
  }
  .kv-field textarea {
    resize: none;
    font-variant-numeric: normal;
  }
  .kv-field input:focus,
  .kv-field textarea:focus,
  .kv-inline:focus {
    outline: none;
    border-bottom: 1.2pt solid var(--ink);
    background: #e9eaed;
  }

  .kv-note {
    font-size: 7.5pt;
    color: var(--ink-soft);
    margin: 2mm 0 0;
    line-height: 1.5;
  }

  .kv-choices {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1mm 6mm;
  }
  .kv-choices-pad {
    padding-top: 1.5mm;
  }
  .kv-choice {
    display: flex;
    align-items: center;
    gap: 2mm;
    font-size: 9.5pt;
  }
  .kv-choice label {
    color: var(--ink);
  }

  .kv-sheet input[type='checkbox'] {
    appearance: none;
    -webkit-appearance: none;
    width: 3.4mm;
    height: 3.4mm;
    flex: none;
    margin: 0;
    padding: 0;
    border: 0.8pt solid var(--ink);
    border-radius: 0.5px;
    background: var(--paper);
    display: inline-block;
    position: relative;
    cursor: pointer;
  }
  .kv-sheet input[type='checkbox']:checked::after {
    content: '';
    position: absolute;
    inset: 0.6mm;
    background: var(--ink);
  }
  .kv-sheet input[type='checkbox']:focus-visible {
    outline: 1.5pt solid var(--silver);
    outline-offset: 1px;
  }

  /* Vier Ja/Nein-Fragen als kompakte Liste mit Trennlinien statt Bemerkungsfeldern */
  .kv-qlist {
    border-top: 0.6pt solid var(--hairline);
    margin-bottom: 5mm;
  }
  .kv-qrow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6mm;
    padding: 2.6mm 0;
    border-bottom: 0.6pt solid var(--hairline);
  }
  .kv-remarks textarea {
    min-height: 26mm;
  }
  .kv-clause {
    font-size: 9.5pt;
    line-height: 1.45;
    color: var(--ink);
    margin: 3mm 0 0;
    padding-left: 3mm;
    border-left: 1.2pt solid var(--silver);
  }
  .kv-question {
    font-size: 9.5pt;
    line-height: 1.4;
    color: var(--ink);
  }

  .kv-opt {
    display: flex;
    align-items: flex-start;
    gap: 2.5mm;
    font-size: 9.5pt;
    line-height: 1.45;
    margin-bottom: 1.5mm;
  }
  .kv-opt input[type='checkbox'] {
    margin-top: 0.9mm;
  }
  .kv-opt label {
    color: var(--ink);
  }
  .kv-nowrap {
    white-space: nowrap;
  }
  .kv-inline {
    font-size: 9.5pt;
    padding: 0.8mm 1.5mm;
    flex: 1;
    width: auto;
  }

  .kv-signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10mm;
    margin-top: 2mm;
  }
  .kv-signatures h3 {
    font-size: 10pt;
    margin-bottom: 3mm;
  }
  .kv-sigline {
    border-bottom: 0.8pt solid var(--ink);
    height: 16mm;
    margin-top: 4mm;
  }
  .kv-sigcap {
    margin-top: 1.5mm;
  }

  .kv-foot {
    margin-top: auto;
    padding-top: 5mm;
    border-top: 0.6pt solid var(--hairline);
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8mm;
    font-size: 7.5pt;
    line-height: 1.5;
    color: var(--ink-soft);
  }
  .kv-pageno {
    font-family: 'Oswald', sans-serif;
    font-size: 11pt;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  /* ---------- Schmale Viewports ---------- */
  @media (max-width: 820px) {
    .kv-stage {
      padding: 0 12px 48px;
    }
    .kv-sheet {
      min-height: 0;
      padding: 8mm 6mm;
    }
    .kv-masthead {
      margin: -8mm -6mm 7mm;
      padding: 7mm 6mm 6mm;
    }
    .kv-grid,
    .kv-signatures {
      grid-template-columns: 1fr;
    }
    .kv-qrow {
      flex-direction: column;
      gap: 1.5mm;
    }
  }

  /* ---------- Druck: nur die beiden Blätter ---------- */
  @page {
    size: A4;
    margin: 0;
  }

  @media print {
    :global(body) {
      background: #fff !important;
    }
    :global(header),
    :global(footer),
    :global(.cookie-banner) {
      display: none !important;
    }
    .kv-intro {
      display: none !important;
    }
    .kv-stage {
      display: block;
      padding: 0;
      gap: 0;
    }
    .kv-sheet {
      width: 210mm;
      height: 297mm;
      min-height: 0;
      max-width: none;
      box-shadow: none;
      break-after: page;
      page-break-after: always;
    }
    .kv-sheet:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    .kv-sheet input,
    .kv-sheet textarea {
      background: var(--fill) !important;
    }
    .kv-sheet,
    .kv-sheet * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
