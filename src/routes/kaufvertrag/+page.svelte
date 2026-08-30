<script>
  import { onMount } from 'svelte';
  import { site } from '$lib/content.js';
  import { gastFeld } from '$lib/vertragFelder.js';

  let formEl;

  let rolle = null; // null | 'verkaeufer' | 'gast'
  let code = ''; // Abruf-Code des offenen Vertrags
  let masterPin = ''; // nur in dieser Sitzung, nie gespeichert
  let neuAngelegt = false;

  let oeffnenOffen = false;
  let codeEingabe = '';
  let pinEingabe = '';

  let meldung = '';
  let fehler = '';
  let laeuft = false;

  function felder() {
    return [...formEl.elements].filter((el) => el.name);
  }

  // Browser drucken den getippten Inhalt von input/textarea unzuverlaessig
  // (bei textarea praktisch nie). Darum bekommt jedes Feld vor dem Druck ein
  // Text-Element mit demselben Wert und derselben Hoehe; im Druck wird das
  // Eingabefeld aus- und dieses eingeblendet.
  function wertSpiegeln(el) {
    let spiegel = el.nextElementSibling;
    if (!spiegel || !spiegel.classList.contains('kv-wert')) {
      spiegel = document.createElement('span');
      spiegel.className = 'kv-wert' + (el.classList.contains('kv-inline') ? ' kv-wert-inline' : '');
      el.after(spiegel);
    }
    spiegel.textContent = el.value;
    spiegel.style.minHeight = `${el.offsetHeight}px`;
  }

  function werteSpiegeln() {
    if (!formEl) return;
    for (const el of felder()) if (el.type !== 'checkbox') wertSpiegeln(el);
  }

  function drucken() {
    werteSpiegeln();
    window.print();
  }

  function daten() {
    const d = {};
    for (const el of felder()) d[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    return d;
  }

  function fuellen(d) {
    for (const el of felder()) {
      const wert = d[el.name];
      if (el.type === 'checkbox') el.checked = wert === true;
      else el.value = typeof wert === 'string' ? wert : '';
    }
  }

  // Gäste (nur Abruf-Code, kein Master-PIN) dürfen ausschliesslich
  // das Bemerkungsfeld anfassen.
  function sperren(nurBemerkung) {
    for (const el of felder()) {
      const frei = !nurBemerkung || el.name === gastFeld;
      if (el.type === 'checkbox') el.disabled = !frei;
      else el.readOnly = !frei;
    }
  }

  async function anfrage(url, methode, koerper) {
    const res = await fetch(url, {
      method: methode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(koerper)
    });
    if (!res.ok) {
      let text = 'Es ist etwas schiefgelaufen. Bitte nochmals versuchen.';
      try {
        text = (await res.json()).message || text;
      } catch {
        /* keine JSON-Antwort */
      }
      throw new Error(text);
    }
    return res.json();
  }

  async function speichern() {
    laeuft = true;
    fehler = '';
    meldung = '';
    try {
      const r = await anfrage('/api/kaufvertrag', 'POST', { daten: daten() });
      code = r.code;
      masterPin = r.masterPin;
      rolle = 'verkaeufer';
      neuAngelegt = true;
      oeffnenOffen = false;
    } catch (e) {
      fehler = e.message;
    } finally {
      laeuft = false;
    }
  }

  async function oeffnen() {
    const c = codeEingabe.trim();
    fehler = '';
    meldung = '';
    if (!/^\d{6}$/.test(c)) {
      fehler = 'Bitte den sechsstelligen Abruf-Code eingeben.';
      return;
    }
    laeuft = true;
    try {
      const pin = pinEingabe.trim();
      const r = await anfrage(`/api/kaufvertrag/${c}`, 'POST', { pin });
      fuellen(r.daten);
      sperren(r.rolle === 'gast');
      code = c;
      rolle = r.rolle;
      masterPin = r.rolle === 'verkaeufer' ? pin : '';
      neuAngelegt = false;
      oeffnenOffen = false;
      pinEingabe = '';
      meldung =
        r.rolle === 'verkaeufer'
          ? 'Vertrag geöffnet. Du kannst alle Felder ändern.'
          : 'Vertrag geöffnet. Ändern lässt sich nur das Feld „Generelle Bemerkungen".';
    } catch (e) {
      fehler = e.message;
    } finally {
      laeuft = false;
    }
  }

  async function aktualisieren() {
    laeuft = true;
    fehler = '';
    meldung = '';
    try {
      await anfrage(`/api/kaufvertrag/${code}`, 'PUT', { pin: masterPin, daten: daten() });
      meldung =
        rolle === 'verkaeufer' ? 'Änderungen gespeichert.' : 'Bemerkung gespeichert.';
    } catch (e) {
      fehler = e.message;
    } finally {
      laeuft = false;
    }
  }

  async function loeschen() {
    if (!confirm(`Vertrag ${code} endgültig löschen? Das lässt sich nicht rückgängig machen.`)) return;
    laeuft = true;
    fehler = '';
    meldung = '';
    try {
      await anfrage(`/api/kaufvertrag/${code}`, 'DELETE', { pin: masterPin });
      zuruecksetzen();
      meldung = 'Vertrag gelöscht.';
    } catch (e) {
      fehler = e.message;
    } finally {
      laeuft = false;
    }
  }

  function zuruecksetzen() {
    formEl.reset();
    sperren(false);
    rolle = null;
    code = '';
    masterPin = '';
    neuAngelegt = false;
    meldung = '';
    fehler = '';
  }

  onMount(() => {
    const ausUrl = new URLSearchParams(location.search).get('code');
    if (ausUrl && /^\d{6}$/.test(ausUrl)) {
      codeEingabe = ausUrl;
      oeffnenOffen = true;
    }

    // Auch fuer Strg+P statt des Buttons
    window.addEventListener('beforeprint', werteSpiegeln);
    return () => window.removeEventListener('beforeprint', werteSpiegeln);
  });
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
  <div class="mt-8 flex flex-wrap gap-4">
    <button type="button" class="btn-primary" on:click={drucken}>Als PDF speichern / drucken</button>

    {#if rolle === null}
      <button type="button" class="btn-ghost" on:click={speichern} disabled={laeuft}>
        {laeuft ? 'Speichert …' : 'Vertrag speichern'}
      </button>
      <button type="button" class="btn-ghost" on:click={() => (oeffnenOffen = !oeffnenOffen)}>
        Gespeicherten Vertrag öffnen
      </button>
      <button type="reset" form="kaufvertrag" class="btn-ghost">Felder leeren</button>
    {:else}
      <button type="button" class="btn-ghost" on:click={aktualisieren} disabled={laeuft}>
        {laeuft ? 'Speichert …' : rolle === 'verkaeufer' ? 'Änderungen speichern' : 'Bemerkung speichern'}
      </button>
      {#if rolle === 'verkaeufer'}
        <button type="button" class="btn-ghost !border-red-900 hover:!border-red-600" on:click={loeschen} disabled={laeuft}>
          Vertrag löschen
        </button>
      {/if}
      <button type="button" class="btn-ghost" on:click={zuruecksetzen}>Schliessen</button>
    {/if}
  </div>

  {#if oeffnenOffen && rolle === null}
    <div class="card mt-6 max-w-2xl">
      <div class="eyebrow mb-4">Vertrag öffnen</div>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label for="code-eingabe" class="block text-sm mb-1 text-muted">Abruf-Code (6 Ziffern)</label>
          <input
            id="code-eingabe"
            bind:value={codeEingabe}
            inputmode="numeric"
            maxlength="6"
            autocomplete="off"
            class="w-full bg-bg border border-border rounded-sm px-4 py-3 tracking-[0.35em] font-heading focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label for="pin-eingabe" class="block text-sm mb-1 text-muted">Master-PIN (optional)</label>
          <input
            id="pin-eingabe"
            bind:value={pinEingabe}
            inputmode="numeric"
            maxlength="6"
            autocomplete="off"
            class="w-full bg-bg border border-border rounded-sm px-4 py-3 tracking-[0.35em] font-heading focus:outline-none focus:border-accent"
          />
        </div>
      </div>
      <p class="text-xs text-muted mt-3">
        Ohne PIN lässt sich der Vertrag ansehen und im Feld „Generelle Bemerkungen" ergänzen. Mit
        PIN sind alle Felder änderbar.
      </p>
      <button type="button" class="btn-primary mt-5" on:click={oeffnen} disabled={laeuft}>
        {laeuft ? 'Öffnet …' : 'Öffnen'}
      </button>
    </div>
  {/if}

  {#if neuAngelegt}
    <div class="card mt-6 max-w-2xl border-accent">
      <div class="eyebrow mb-4">Gespeichert — jetzt notieren</div>
      <div class="grid sm:grid-cols-2 gap-6">
        <div>
          <div class="text-xs uppercase tracking-[0.2em] text-muted mb-2">Abruf-Code</div>
          <div class="font-heading text-3xl tracking-[0.3em] text-ink">{code}</div>
          <p class="text-xs text-muted mt-2">Diesen Code darf der Käufer bekommen.</p>
        </div>
        <div>
          <div class="text-xs uppercase tracking-[0.2em] text-muted mb-2">Master-PIN</div>
          <div class="font-heading text-3xl tracking-[0.3em] text-ink">{masterPin}</div>
          <p class="text-xs text-muted mt-2">Nur für dich — damit änderst und löschst du alles.</p>
        </div>
      </div>
      <p class="text-sm text-muted mt-5">
        Beides wird nirgends nochmals angezeigt. Ohne Master-PIN lässt sich der Vertrag nicht mehr
        ändern oder löschen.
      </p>
    </div>
  {:else if rolle !== null}
    <div class="card mt-6 max-w-2xl">
      <div class="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <span class="text-xs uppercase tracking-[0.2em] text-muted">Abruf-Code</span>
          <span class="font-heading text-2xl tracking-[0.3em] text-ink ml-3">{code}</span>
        </div>
        <span class="text-sm text-muted">
          {rolle === 'verkaeufer' ? 'Geöffnet als Verkäufer — alle Felder änderbar.' : 'Nur „Generelle Bemerkungen" ist änderbar.'}
        </span>
      </div>
    </div>
  {/if}

  {#if meldung}
    <p class="mt-5 text-sm text-accent">{meldung}</p>
  {/if}
  {#if fehler}
    <p class="mt-5 text-sm text-red-400">{fehler}</p>
  {/if}

</section>

<form id="kaufvertrag" class="kv-stage" bind:this={formEl} on:submit|preventDefault>
  <!-- ============ SEITE 1 ============ -->
  <div class="kv-sheet">
    <div class="kv-masthead">
      <img src="/brand/logo.png?v=2" alt={site.name} />
      <div class="kv-doctitle">Kaufvertrag<span>Fahrzeug — Privatverkauf</span></div>
    </div>

    <div class="kv-section">
      <h2>Verkäufer</h2>
      <div class="kv-grid kv-grid-drei">
        <p class="kv-field"><label for="v-name">Name</label><input id="v-name" name="v-name" type="text" /></p>
        <p class="kv-field"><label for="v-vorname">Vorname</label><input id="v-vorname" name="v-vorname" type="text" /></p>
        <p class="kv-field"><label for="v-tel">Telefonnummer</label><input id="v-tel" name="v-tel" type="text" /></p>
        <p class="kv-field"><label for="v-adresse">Wohnadresse</label><input id="v-adresse" name="v-adresse" type="text" /></p>
        <p class="kv-field"><label for="v-plz">PLZ / Ort</label><input id="v-plz" name="v-plz" type="text" /></p>
        <p class="kv-field"><label for="v-mail">E-Mail</label><input id="v-mail" name="v-mail" type="text" /></p>
      </div>
    </div>

    <div class="kv-section">
      <h2>Käufer</h2>
      <div class="kv-grid kv-grid-drei">
        <p class="kv-field"><label for="k-name">Name</label><input id="k-name" name="k-name" type="text" /></p>
        <p class="kv-field"><label for="k-vorname">Vorname</label><input id="k-vorname" name="k-vorname" type="text" /></p>
        <p class="kv-field"><label for="k-tel">Telefonnummer</label><input id="k-tel" name="k-tel" type="text" /></p>
        <p class="kv-field"><label for="k-adresse">Wohnadresse</label><input id="k-adresse" name="k-adresse" type="text" /></p>
        <p class="kv-field"><label for="k-plz">PLZ / Ort</label><input id="k-plz" name="k-plz" type="text" /></p>
        <p class="kv-field"><label for="k-mail">E-Mail</label><input id="k-mail" name="k-mail" type="text" /></p>
      </div>
    </div>

    <div class="kv-section">
      <h2>Fahrzeug</h2>
      <div class="kv-grid kv-grid-drei">
        <p class="kv-field"><label for="f-marke">Marke</label><input id="f-marke" name="f-marke" type="text" /></p>
        <p class="kv-field"><label for="f-modell">Modell / Typ</label><input id="f-modell" name="f-modell" type="text" /></p>
        <p class="kv-field"><label for="f-farbe">Farbe</label><input id="f-farbe" name="f-farbe" type="text" /></p>
        <p class="kv-field"><label for="f-hubraum">Hubraum</label><input id="f-hubraum" name="f-hubraum" type="text" /></p>
        <p class="kv-field"><label for="f-leistung">Leistung</label><input id="f-leistung" name="f-leistung" type="text" /></p>
        <p class="kv-field"><label for="f-fahrgestell">Fahrgestell-Nummer</label><input id="f-fahrgestell" name="f-fahrgestell" type="text" /></p>
        <p class="kv-field"><label for="f-stamm">Stamm-Nummer</label><input id="f-stamm" name="f-stamm" type="text" /></p>
        <p class="kv-field"><label for="f-inverkehr">1. Inverkehrsetzung</label><input id="f-inverkehr" name="f-inverkehr" type="text" /></p>
        <p class="kv-field"><label for="f-km">Kilometerstand</label><input id="f-km" name="f-km" type="text" /></p>
        <p class="kv-field"><label for="f-mfk">Datum der letzten MFK-Prüfung</label><input id="f-mfk" name="f-mfk" type="text" /></p>
      </div>
    </div>

    <div class="kv-section">
      <h2>Verkaufspreis</h2>
      <div class="kv-grid kv-grid-drei">
        <p class="kv-field"><label for="p-chf">Kaufpreis in CHF</label><input id="p-chf" name="p-chf" type="text" /></p>
        <p class="kv-field"><label for="p-anzahlung">Anzahlung in CHF (falls vereinbart)</label><input id="p-anzahlung" name="p-anzahlung" type="text" /></p>
        <p class="kv-field"><label for="p-rest">Restbetrag bei Übergabe in CHF</label><input id="p-rest" name="p-rest" type="text" /></p>
        <p class="kv-field kv-span2">
          <label for="p-ausstattung">Zusätzliche Ausstattung (z. B. Anbauteile, Zubehör-Auspuff, Räder)</label>
          <textarea id="p-ausstattung" name="p-ausstattung" rows="2"></textarea>
        </p>
        <div class="kv-field">
          <span class="kv-label">Zweitschlüssel vorhanden</span>
          <span class="kv-choices kv-choices-pad">
            <span class="kv-choice"><input type="checkbox" id="p-key-ja" name="p-key-ja" /><label for="p-key-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="p-key-nein" name="p-key-nein" /><label for="p-key-nein">nein</label></span>
          </span>
        </div>
        <div class="kv-field">
          <span class="kv-label">Mitgegeben</span>
          <span class="kv-choices kv-choices-pad">
            <span class="kv-choice"><input type="checkbox" id="p-aus" name="p-aus" /><label for="p-aus">Fahrzeugausweis</label></span>
            <span class="kv-choice"><input type="checkbox" id="p-heft" name="p-heft" /><label for="p-heft">Serviceheft</label></span>
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
            <span class="kv-choice"><input type="checkbox" id="w-unfall-ja" name="w-unfall-ja" /><label for="w-unfall-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="w-unfall-nein" name="w-unfall-nein" /><label for="w-unfall-nein">nein</label></span>
          </span>
        </div>
        <div class="kv-qrow">
          <span class="kv-question">Sind Mängel am Fahrzeug bekannt?</span>
          <span class="kv-choices">
            <span class="kv-choice"><input type="checkbox" id="w-maengel-ja" name="w-maengel-ja" /><label for="w-maengel-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="w-maengel-nein" name="w-maengel-nein" /><label for="w-maengel-nein">nein</label></span>
          </span>
        </div>
        <div class="kv-qrow">
          <span class="kv-question">Ist das Serviceheft vorhanden und korrekt nachgeführt?</span>
          <span class="kv-choices">
            <span class="kv-choice"><input type="checkbox" id="w-heft-ja" name="w-heft-ja" /><label for="w-heft-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="w-heft-nein" name="w-heft-nein" /><label for="w-heft-nein">nein</label></span>
          </span>
        </div>
        <div class="kv-qrow">
          <span class="kv-question">Wurde das Fahrzeug getunt oder technisch verändert (Eintrag im Fahrzeugausweis)?</span>
          <span class="kv-choices">
            <span class="kv-choice"><input type="checkbox" id="w-tuning-ja" name="w-tuning-ja" /><label for="w-tuning-ja">ja</label></span>
            <span class="kv-choice"><input type="checkbox" id="w-tuning-nein" name="w-tuning-nein" /><label for="w-tuning-nein">nein</label></span>
          </span>
        </div>
      </div>

      <p class="kv-field kv-remarks">
        <label for="w-bemerkungen">Generelle Bemerkungen</label>
        <textarea id="w-bemerkungen" name="w-bemerkungen" rows="6"></textarea>
      </p>
    </div>

    <div class="kv-section">
      <h2>Allgemeine Bestimmungen</h2>

      <h3>Gewährleistung</h3>
      <div class="kv-opt">
        <input type="checkbox" id="g-aus" name="g-aus" />
        <label for="g-aus">
          Jede Gewährleistung wird, soweit gesetzlich zulässig, wegbedungen; insbesondere sind
          Wandelung und Minderung ausgeschlossen. Das Fahrzeug wird verkauft, wie es steht und liegt.
        </label>
      </div>
      <div class="kv-opt">
        <input type="checkbox" id="g-zwei" name="g-zwei" />
        <label for="g-zwei">Zwei Jahre Gewährleistung gemäss Art. 210 OR.</label>
      </div>
      <div class="kv-opt">
        <input type="checkbox" id="g-andere" name="g-andere" />
        <label for="g-andere" class="kv-nowrap">Andere Bestimmung</label>
        <input type="text" id="g-andere-txt" name="g-andere-txt" class="kv-inline" aria-label="Andere Bestimmung zur Gewährleistung" />
      </div>

      <h3 class="kv-h3-gap">Zahlung</h3>
      <div class="kv-opt">
        <input type="checkbox" id="z-bar" name="z-bar" />
        <label for="z-bar">Bar bei der Übergabe des Fahrzeugs.</label>
      </div>
      <div class="kv-opt">
        <input type="checkbox" id="z-bank" name="z-bank" />
        <label for="z-bank">Banküberweisung.</label>
      </div>
      <div class="kv-opt">
        <input type="checkbox" id="z-sonst" name="z-sonst" />
        <label for="z-sonst" class="kv-nowrap">Sonstige Zahlungsart</label>
        <input type="text" id="z-sonst-txt" name="z-sonst-txt" class="kv-inline" aria-label="Sonstige Zahlungsart" />
      </div>
      <p class="kv-clause">
        Die Übergabe des Fahrzeugs erfolgt in jedem Fall erst, wenn der volle Kaufpreis beim
        Verkäufer eingegangen ist.
      </p>

      <h3 class="kv-h3-gap">Fahrzeugübergabe</h3>
      <div class="kv-grid">
        <p class="kv-field"><label for="u-datum">Übergabedatum</label><input id="u-datum" name="u-datum" type="text" /></p>
        <p class="kv-field"><label for="u-ort">Übergabeort</label><input id="u-ort" name="u-ort" type="text" /></p>
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
          <div class="kv-sigkopf">
            <h3>Verkäufer</h3>
            <p class="kv-field"><label for="s-v-ort">Ort / Datum</label><input id="s-v-ort" name="s-v-ort" type="text" /></p>
          </div>
          <div class="kv-sigline"></div>
          <div class="kv-sigcap">Unterschrift</div>
        </div>
        <div>
          <div class="kv-sigkopf">
            <h3>Käufer</h3>
            <p class="kv-field"><label for="s-k-ort">Ort / Datum</label><input id="s-k-ort" name="s-k-ort" type="text" /></p>
          </div>
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
    margin: -14mm -16mm 6mm;
    padding: 6mm 16mm 5mm;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12mm;
  }
  .kv-masthead img {
    width: 34mm;
    height: auto;
    display: block;
  }
  .kv-slim {
    padding-top: 4mm;
    padding-bottom: 4mm;
  }
  .kv-slim img {
    width: 26mm;
  }

  .kv-doctitle {
    font-family: 'Oswald', 'Arial Narrow', sans-serif;
    font-weight: 500;
    font-size: 15pt;
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
    margin-top: 2mm;
  }

  .kv-section {
    margin-bottom: 3.5mm;
  }
  .kv-sheet h2 {
    font-family: 'Oswald', 'Arial Narrow', sans-serif;
    font-weight: 500;
    font-size: 11pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink);
    margin: 0 0 3mm;
    padding-bottom: 1.2mm;
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
    margin-top: 3.5mm !important;
  }

  .kv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 6mm;
    row-gap: 2.8mm;
  }
  .kv-grid-drei {
    grid-template-columns: repeat(3, 1fr);
  }

  .kv-span2 {
    grid-column: 1 / -1;
  }

  .kv-field {
    display: flex;
    flex-direction: column;
    gap: 0.5mm;
    margin: 0 0 2.8mm;
  }
  .kv-grid .kv-field {
    margin-bottom: 0;
  }
  .kv-field label,
  .kv-label,
  .kv-sigcap {
    font-size: 6pt;
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
    padding: 0.9mm 1.6mm;
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

  /* Gesperrte Felder (Gast-Modus) tragen keine Fuellflaeche mehr */
  .kv-sheet input:read-only,
  .kv-sheet textarea:read-only {
    background: transparent;
  }
  .kv-sheet input[type='checkbox']:disabled {
    cursor: default;
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
    padding: 1.8mm 0;
    border-bottom: 0.6pt solid var(--hairline);
  }
  .kv-remarks textarea {
    min-height: 15mm;
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
    gap: 8mm;
    margin-top: 1mm;
  }
  .kv-signatures h3 {
    font-size: 9pt;
    margin: 0;
    white-space: nowrap;
  }

  /* Rolle und Ort/Datum teilen sich eine Zeile ueber der Unterschriftslinie */
  .kv-sigkopf {
    display: flex;
    align-items: flex-end;
    gap: 5mm;
  }
  .kv-sigkopf .kv-field {
    flex: 1;
    margin: 0;
  }
  .kv-sigline {
    border-bottom: 0.8pt solid var(--ink);
    height: 10mm;
    margin-top: 2mm;
  }
  .kv-sigcap {
    margin-top: 1mm;
  }

  .kv-foot {
    margin-top: auto;
    padding-top: 3mm;
    border-top: 0.6pt solid var(--hairline);
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8mm;
    font-size: 7pt;
    line-height: 1.45;
    color: var(--ink-soft);
  }
  .kv-pageno {
    font-family: 'Oswald', sans-serif;
    font-size: 11pt;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  /* ---------- Schmale Viewports ----------
     Zwingend `screen`: eine A4-Seite ist im Druck rund 794px breit, ohne die
     Einschraenkung wuerde der Druck in dieser Handy-Ansicht landen und alles
     einspaltig untereinander setzen. */
  @media screen and (max-width: 820px) {
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
    .kv-grid-drei,
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

  /* Textabbild eines Eingabefelds — nur im Druck sichtbar, siehe wertSpiegeln().
     Die Elemente entstehen zur Laufzeit und tragen darum keine Svelte-Klasse,
     deshalb :global(). */
  :global(.kv-wert) {
    display: none;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 10pt;
    font-variant-numeric: tabular-nums;
    line-height: 1.35;
    color: var(--ink);
    border-bottom: 0.6pt solid var(--hairline);
    padding: 0.9mm 1.6mm;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  :global(.kv-wert-inline) {
    flex: 1;
    font-size: 9.5pt;
    padding: 0.8mm 1.5mm;
  }

  @media print {
    :global(body) {
      background: #fff !important;
      margin: 0 !important;
    }
    /* Die Layout-Huelle spannt sonst eine volle Bildschirmhoehe auf und
       erzeugt eine leere erste Seite. */
    :global(.app-shell) {
      display: block !important;
      min-height: 0 !important;
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
      /* min-height statt height: laeuft ein Blatt einmal ueber, wird der Rest
         auf eine Folgeseite geschoben statt abgeschnitten. */
      min-height: 296mm;
      height: auto;
      max-width: none;
      box-shadow: none;
      break-after: page;
      page-break-after: always;
    }
    .kv-sheet:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    /* Das Blatt behaelt im Druck exakt die Bildschirmaufteilung */
    .kv-sheet {
      padding: 14mm 16mm 12mm;
    }
    .kv-masthead {
      margin: -14mm -16mm 9mm;
      padding: 9mm 16mm 8mm;
    }
    .kv-slim {
      padding-top: 7mm;
      padding-bottom: 6mm;
    }
    .kv-grid,
    .kv-signatures {
      grid-template-columns: 1fr 1fr;
    }
    .kv-grid-drei {
      grid-template-columns: repeat(3, 1fr);
    }
    .kv-qrow {
      flex-direction: row;
    }
    /* Eingabefelder raus, Textabbild rein */
    .kv-sheet input[type='text'],
    .kv-sheet textarea {
      display: none !important;
    }
    :global(.kv-wert) {
      display: block !important;
    }
    :global(.kv-wert-inline) {
      display: inline-block !important;
    }
    .kv-sheet,
    .kv-sheet * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
