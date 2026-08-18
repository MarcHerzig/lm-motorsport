<script>
  import { page } from '$app/stores';
  import { nav, site } from '$lib/content.js';

  let open = false;
</script>

<header class="border-b border-border sticky top-0 z-30 bg-bg/95 backdrop-blur">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-heading text-xl tracking-wide">
      <span class="inline-block w-3 h-6 bg-accent -skew-x-12"></span>
      {site.name}
    </a>

    <nav class="hidden md:flex items-center gap-8 font-heading uppercase text-sm tracking-wide">
      {#each nav as item}
        <a
          href={item.href}
          class="hover:text-accent transition-colors"
          class:text-accent={$page.url.pathname === item.href}
        >
          {item.label}
        </a>
      {/each}
      <a href="/kontakt" class="btn-primary !py-2 !px-5 text-sm">Anfrage stellen</a>
    </nav>

    <button
      class="md:hidden text-ink"
      aria-label="Menü öffnen"
      on:click={() => (open = !open)}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>

  {#if open}
    <nav class="md:hidden border-t border-border bg-bg px-6 py-4 flex flex-col gap-4 font-heading uppercase text-sm tracking-wide">
      {#each nav as item}
        <a href={item.href} on:click={() => (open = false)} class="hover:text-accent transition-colors">
          {item.label}
        </a>
      {/each}
      <a href="/kontakt" on:click={() => (open = false)} class="btn-primary text-center text-sm">
        Anfrage stellen
      </a>
    </nav>
  {/if}
</header>
