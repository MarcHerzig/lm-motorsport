<script>
  import ServiceCard from '$lib/components/ServiceCard.svelte';
  import { services, combo } from '$lib/content.js';
</script>

<svelte:head>
  <title>Services — LM Motorsport</title>
  <meta
    name="description"
    content="LM Car Finder, LM Car Checker und LM Pit Stop – die drei Services von LM Motorsport im Überblick."
  />
</svelte:head>

<section class="section">
  <div class="text-center max-w-2xl mx-auto mb-12">
    <span class="eyebrow">Services</span>
    <h1 class="text-4xl md:text-5xl mt-2">Alles rund ums Auto</h1>
    <p class="text-muted mt-4">
      Drei eigenständige Services, eine gemeinsame Haltung: ehrlich, fachkundig, persönlich.
    </p>
  </div>

  <div class="grid gap-6 md:grid-cols-3 mb-16">
    {#each services as service}
      <ServiceCard {service} />
    {/each}
  </div>

  <div class="card text-center max-w-3xl mx-auto">
    <h2 class="text-2xl mb-3">{combo.name}</h2>
    <p class="text-muted mb-4">{combo.teaser}</p>
    <p class="font-heading text-accent mb-6">{combo.priceFrom}</p>
    <a href="/services/car-checker#kombi" class="btn-primary">Kombi-Paket anfragen</a>
  </div>
</section>
