<script>
  export let service;
</script>

<a
  href={`/services/${service.slug}`}
  class="card group flex flex-col overflow-hidden !p-0 hover:border-accent transition-colors"
>
  <div class="h-44 overflow-hidden">
    <img
      src={service.image}
      alt={service.name}
      loading="lazy"
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  </div>
  <div class="p-6 flex flex-col gap-3 grow">
    <h3 class="text-xl">{service.name}</h3>
    <p class="text-muted text-sm leading-relaxed grow">{service.teaser}</p>
    <span class="text-accent font-heading uppercase text-sm tracking-wide">Mehr erfahren →</span>
  </div>
</a>
