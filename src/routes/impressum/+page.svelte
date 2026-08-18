<script>
  import { site } from '$lib/content.js';
</script>

<svelte:head>
  <title>Impressum — LM Motorsport</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="section max-w-3xl">
  <span class="eyebrow">Rechtliches</span>
  <h1 class="text-4xl mt-2 mb-8">Impressum</h1>

  <div class="card !bg-transparent border-dashed mb-8 text-sm text-muted">
    Entwurf/Platzhalter — bitte durch die tatsächlichen Firmenangaben ersetzen und juristisch prüfen
    lassen, bevor die Seite live geht.
  </div>

  <div class="space-y-8 text-muted leading-relaxed">
    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Firma</h2>
      <p>
        {site.legalName}<br />
        {site.location}<br />
        Schweiz
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Kontakt</h2>
      <p>
        E-Mail: <a href={`mailto:${site.email}`} class="hover:text-accent">{site.email}</a><br />
        Telefon: {site.phone}
      </p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Handelsregister</h2>
      <p>UID / Handelsregister-Nummer: (Platzhalter, bitte ergänzen)</p>
    </div>

    <div>
      <h2 class="text-xl mb-2 normal-case text-ink">Haftungsausschluss</h2>
      <p>
        Alle Angaben auf dieser Website erfolgen ohne Gewähr. {site.legalName} übernimmt keine
        Haftung für die Aktualität, Richtigkeit und Vollständigkeit der bereitgestellten
        Informationen. Für Schäden materieller oder ideeller Art, die durch die Nutzung der
        veröffentlichten Informationen verursacht werden, wird keine Haftung übernommen.
      </p>
    </div>
  </div>
</section>
