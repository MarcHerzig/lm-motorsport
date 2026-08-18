<script>
  import { services } from '$lib/content.js';
  const s = services.find((x) => x.key === 'finder');
</script>

<svelte:head>
  <title>LM Car Finder — Auto suchen lassen | LM Motorsport</title>
  <meta
    name="description"
    content="LM Car Finder: Wir suchen im Auftrag das passende Fahrzeug – Marktrecherche, Händlerabklärung und Vorauswahl, damit du nicht selbst suchen musst."
  />
</svelte:head>

<section class="relative">
  <img src={s.image} alt={s.name} class="w-full h-72 object-cover opacity-50" />
  <div class="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10"></div>
  <div class="absolute inset-0 flex items-end">
    <div class="section !py-10">
      <span class="eyebrow">LM Car Finder</span>
      <h1 class="text-4xl md:text-5xl mt-2">Wir finden das richtige Auto für dich</h1>
    </div>
  </div>
</section>

<section class="section grid gap-12 md:grid-cols-3">
  <div class="md:col-span-2 space-y-10">
    <p class="text-lg text-muted leading-relaxed">
      Die Suche nach dem passenden Auto kostet Zeit, Nerven und Fachwissen. Genau das nehmen wir dir
      ab. Du sagst uns, was du suchst – wir durchforsten den Markt, sortieren die Spreu vom Weizen und
      legen dir eine Vorauswahl vor, die wirklich passt.
    </p>

    <div>
      <h2 class="text-2xl mb-2 normal-case">Für wen?</h2>
      <p class="text-muted leading-relaxed">
        Für alle, die ein bestimmtes Auto (Occasion oder Neuwagen) suchen, aber keine Zeit oder Lust
        haben, sich selbst durch endlose Inserate zu wühlen – oder die einfach ein geschultes Auge an
        ihrer Seite wollen.
      </p>
    </div>

    <div>
      <h2 class="text-2xl mb-6 normal-case">So läuft's ab</h2>
      <ol class="space-y-6">
        {#each s.steps as step, i}
          <li class="flex gap-4">
            <span class="font-heading text-2xl text-accent shrink-0">{i + 1}</span>
            <div>
              <h3 class="text-base normal-case font-semibold">{step.title}</h3>
              <p class="text-muted text-sm leading-relaxed">{step.text}</p>
            </div>
          </li>
        {/each}
      </ol>
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
    <h2 class="text-xl mb-2 normal-case">Suchauftrag</h2>
    <p class="font-heading text-accent text-lg mb-1">{s.priceFrom}</p>
    <p class="text-muted text-xs mb-6">Richtwert, Entwurf — Preis final auf Anfrage.</p>
    <a href={`/kontakt?service=${s.slug}`} class="btn-primary w-full text-center">Suchauftrag anfragen</a>
  </aside>
</section>
