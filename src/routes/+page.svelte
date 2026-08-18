<script>
  import ServiceCard from '$lib/components/ServiceCard.svelte';
  import { services, howItWorks, images, site } from '$lib/content.js';
</script>

<svelte:head>
  <title>LM Motorsport — Auto suchen, prüfen, warten</title>
  <meta
    name="description"
    content="LM Motorsport: Wir suchen dein Auto, prüfen es fachmännisch vor Ort und halten es in Schuss. Persönlich, ehrlich, mit Benzin im Blut."
  />
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden">
  <img
    src={images.hero}
    alt="Porsche 911 in der Garage"
    class="absolute inset-0 w-full h-full object-cover opacity-40"
  />
  <div class="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/20"></div>
  <div class="relative section !py-28 md:!py-40 text-center flex flex-col items-center gap-6">
    <span class="eyebrow">LM Motorsport GmbH</span>
    <h1 class="text-4xl md:text-6xl leading-tight max-w-3xl">{site.claim}</h1>
    <p class="text-muted max-w-xl text-lg">
      Wir suchen für dich das richtige Auto, prüfen es fachmännisch vor Ort und halten es in Schuss –
      persönlich, ehrlich und mit Benzin im Blut.
    </p>
    <div class="flex flex-wrap gap-4 justify-center mt-4">
      <a href="/kontakt" class="btn-primary">Anfrage stellen</a>
      <a href="/services" class="btn-ghost">Services ansehen</a>
    </div>
  </div>
</section>

<!-- Services -->
<section class="section">
  <div class="text-center max-w-2xl mx-auto mb-12">
    <span class="eyebrow">Was wir bieten</span>
    <h2 class="text-3xl md:text-4xl mt-2">Drei Services, ein Ziel</h2>
  </div>
  <div class="grid gap-6 md:grid-cols-3">
    {#each services as service}
      <ServiceCard {service} />
    {/each}
  </div>
</section>

<!-- So funktioniert's -->
<section class="section bg-surface/40 border-y border-border">
  <div class="text-center max-w-2xl mx-auto mb-12">
    <span class="eyebrow">Ablauf</span>
    <h2 class="text-3xl md:text-4xl mt-2">So funktioniert's</h2>
  </div>
  <div class="grid gap-8 md:grid-cols-4">
    {#each howItWorks as step, i}
      <div class="text-center md:text-left">
        <div class="font-heading text-5xl text-accent mb-3">{i + 1}</div>
        <h3 class="text-lg mb-2 normal-case">{step.title}</h3>
        <p class="text-muted text-sm leading-relaxed">{step.text}</p>
      </div>
    {/each}
  </div>
  <div class="text-center mt-12">
    <a href="/kontakt" class="btn-primary">Jetzt Anfrage stellen</a>
  </div>
</section>

<!-- Warum LM Motorsport -->
<section class="section text-center">
  <span class="eyebrow">Warum LM Motorsport?</span>
  <p class="text-xl md:text-2xl max-w-3xl mx-auto mt-4 leading-relaxed">
    Wir sind keine anonyme Grossgarage, sondern zwei Spezialisten mit echtem Fachwissen und
    Motorsport im Blut. Bei uns bekommst du eine ehrliche Meinung – auch wenn sie mal lautet:
    „Finger weg von diesem Auto." Genau das ist der Punkt.
  </p>
  <a href="/ueber-uns" class="inline-block mt-6 text-accent font-heading uppercase tracking-wide hover:text-accent-hover">
    Über uns →
  </a>
</section>

<!-- Marken -->
<section class="section !py-12">
  <p class="text-center text-muted text-sm mb-6 eyebrow !text-muted">Wir kennen alle Marken</p>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    {#each Object.entries(images.brands) as [brand, src]}
      <div class="relative h-28 rounded-md overflow-hidden border border-border">
        <img {src} alt={brand} class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
      </div>
    {/each}
  </div>
</section>
