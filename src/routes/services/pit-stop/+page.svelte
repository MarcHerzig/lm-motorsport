<script>
  import { services } from '$lib/content.js';
  const s = services.find((x) => x.key === 'pitstop');
</script>

<svelte:head>
  <title>LM Pit Stop — Reifenwechsel & kleine Arbeiten | LM Motorsport</title>
  <meta
    name="description"
    content="LM Pit Stop: Reifenwechsel, Ölwechsel und kleine Wartungsarbeiten – schnell, sauber und zu fairen Preisen."
  />
</svelte:head>

<section class="relative">
  <img src={s.image} alt={s.name} class="w-full h-72 object-cover opacity-50" />
  <div class="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10"></div>
  <div class="absolute inset-0 flex items-end">
    <div class="section !py-10">
      <span class="eyebrow">LM Pit Stop</span>
      <h1 class="text-4xl md:text-5xl mt-2">Reifenwechsel & kleine Arbeiten – schnell und sauber</h1>
    </div>
  </div>
</section>

<section class="section grid gap-12 md:grid-cols-3">
  <div class="md:col-span-2 space-y-10">
    <p class="text-lg text-muted leading-relaxed">
      Nicht jeder Werkstattbesuch muss ein Grossprojekt sein. Für Reifenwechsel, Ölwechsel und kleine
      Wartungsarbeiten bist du bei uns richtig – fair, unkompliziert und ohne lange Wartezeiten.
    </p>

    <div>
      <h2 class="text-2xl mb-3 normal-case">Unsere Leistungen</h2>
      <ul class="space-y-2">
        {#each s.offerings as item}
          <li class="flex gap-2 text-muted">
            <span class="text-accent">✓</span>
            <span>{item}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <aside class="card h-fit sticky top-24">
    <h2 class="text-xl mb-2 normal-case">Preise (Richtwerte)</h2>
    <ul class="text-sm text-muted space-y-1 mb-1">
      <li>Reifenwechsel: ab CHF 40</li>
      <li>Ölwechsel: ab CHF 90</li>
      <li>Weitere Arbeiten auf Anfrage</li>
    </ul>
    <p class="text-muted text-xs mb-6">Richtwerte, Entwurf — Preis final auf Anfrage.</p>
    <a href={`/kontakt?service=${s.slug}`} class="btn-primary w-full text-center">Termin anfragen</a>
  </aside>
</section>
