<script>
  import { services, combo } from '$lib/content.js';
  const s = services.find((x) => x.key === 'checker');
</script>

<svelte:head>
  <title>LM Car Checker — Fahrzeugprüfung vor Kauf | LM Motorsport</title>
  <meta
    name="description"
    content="LM Car Checker: Wir prüfen dein Wunschauto fachmännisch vor Ort – Technik, Karosserie, Historie, Probefahrt – inklusive Zustandsbericht."
  />
</svelte:head>

<section class="relative">
  <img src={s.image} alt={s.name} class="w-full h-72 object-cover opacity-50" />
  <div class="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10"></div>
  <div class="absolute inset-0 flex items-end">
    <div class="section !py-10">
      <span class="eyebrow">LM Car Checker</span>
      <h1 class="text-4xl md:text-5xl mt-2">Wir prüfen dein Wunschauto – bevor du kaufst</h1>
    </div>
  </div>
</section>

<section class="section grid gap-12 md:grid-cols-3">
  <div class="md:col-span-2 space-y-10">
    <p class="text-lg text-muted leading-relaxed">
      Ein Auto gefunden, aber unsicher, ob es sein Geld wert ist? Wir besichtigen es für dich vor Ort
      und prüfen es fachmännisch – von der Technik über die Optik bis zur Probefahrt. Am Ende weisst
      du genau, worauf du dich einlässt.
    </p>

    <div>
      <h2 class="text-2xl mb-2 normal-case">Für wen?</h2>
      <p class="text-muted leading-relaxed">
        Für alle, die vor dem Kauf eine neutrale, fachkundige Zweitmeinung wollen – egal ob
        Privatverkauf oder Händler.
      </p>
    </div>

    <div>
      <h2 class="text-2xl mb-6 normal-case">Was wir prüfen</h2>
      <div class="grid sm:grid-cols-2 gap-6">
        {#each s.checks as check}
          <div class="card">
            <h3 class="text-base normal-case font-semibold mb-1">{check.title}</h3>
            <p class="text-muted text-sm leading-relaxed">{check.text}</p>
          </div>
        {/each}
      </div>
    </div>

    <div>
      <h2 class="text-2xl mb-3 normal-case">Was du bekommst</h2>
      <ul class="space-y-2">
        {#each s.includes as item}
          <li class="flex gap-2 text-muted">
            <span class="text-accent">✓</span>
            <span>{item}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <aside class="card h-fit sticky top-24">
    <h2 class="text-xl mb-2 normal-case">Besichtigung</h2>
    <p class="font-heading text-accent text-lg mb-1">{s.priceFrom}</p>
    <p class="text-muted text-xs mb-6">Richtwert, Entwurf — Preis final auf Anfrage.</p>
    <a href={`/kontakt?service=${s.slug}`} class="btn-primary w-full text-center">Besichtigung anfragen</a>
  </aside>
</section>

<section id="kombi" class="section !pt-0">
  <div class="card text-center max-w-3xl mx-auto scroll-mt-24">
    <h2 class="text-2xl mb-3">{combo.name}</h2>
    <p class="text-muted mb-4">{combo.teaser}</p>
    <p class="font-heading text-accent mb-6">{combo.priceFrom}</p>
    <a href="/kontakt?service=kombi" class="btn-primary">Kombi-Paket anfragen</a>
  </div>
</section>
