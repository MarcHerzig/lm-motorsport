<script>
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { site } from '$lib/content.js';

  export let form;

  const serviceOptions = [
    { value: 'car-finder', label: 'LM Car Finder' },
    { value: 'car-checker', label: 'LM Car Checker' },
    { value: 'kombi', label: 'Kombi-Paket (Finder + Checker)' },
    { value: 'pit-stop', label: 'LM Pit Stop' },
    { value: 'sonstiges', label: 'Sonstiges' }
  ];

  $: preselected = form?.service ?? $page.url.searchParams.get('service') ?? 'sonstiges';
  let submitting = false;
</script>

<svelte:head>
  <title>Kontakt — LM Motorsport</title>
  <meta
    name="description"
    content="Melde dich bei LM Motorsport – für Autosuche, Besichtigung oder Reifenwechsel."
  />
</svelte:head>

<section class="section grid gap-12 md:grid-cols-3 max-w-5xl">
  <div class="md:col-span-2">
    <span class="eyebrow">Kontakt</span>
    <h1 class="text-4xl mt-2 mb-4">Melde dich – wir freuen uns auf dein Anliegen</h1>
    <p class="text-muted mb-8">
      Egal ob Autosuche, Besichtigung oder Reifenwechsel: Schreib uns oder ruf an, und wir melden uns
      schnellstmöglich zurück.
    </p>

    {#if form?.success}
      <div class="card border-accent">
        <p>Danke für deine Anfrage! Wir melden uns schnellstmöglich bei dir.</p>
      </div>
    {:else}
      <form
        method="POST"
        class="space-y-5"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
      >
        {#if form?.error}
          <div class="card border-accent text-sm">{form.error}</div>
        {/if}

        <div class="grid sm:grid-cols-2 gap-5">
          <div>
            <label for="name" class="block text-sm mb-1 text-muted">Name</label>
            <input
              id="name"
              name="name"
              required
              value={form?.name ?? ''}
              class="w-full bg-surface border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label for="email" class="block text-sm mb-1 text-muted">E-Mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form?.email ?? ''}
              class="w-full bg-surface border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-5">
          <div>
            <label for="phone" class="block text-sm mb-1 text-muted">Telefon (optional)</label>
            <input
              id="phone"
              name="phone"
              value={form?.phone ?? ''}
              class="w-full bg-surface border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label for="service" class="block text-sm mb-1 text-muted">Betrifft</label>
            <select
              id="service"
              name="service"
              class="w-full bg-surface border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-accent"
            >
              {#each serviceOptions as opt}
                <option value={opt.value} selected={opt.value === preselected}>{opt.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div>
          <label for="vehicle" class="block text-sm mb-1 text-muted">Fahrzeug-Wunsch / Link (optional)</label>
          <input
            id="vehicle"
            name="vehicle"
            value={form?.vehicle ?? ''}
            class="w-full bg-surface border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label for="message" class="block text-sm mb-1 text-muted">Deine Nachricht</label>
          <textarea
            id="message"
            name="message"
            rows="5"
            required
            class="w-full bg-surface border border-border rounded-sm px-4 py-3 focus:outline-none focus:border-accent"
            >{form?.message ?? ''}</textarea
          >
        </div>

        <button type="submit" class="btn-primary" disabled={submitting}>
          {submitting ? 'Wird gesendet…' : 'Anfrage absenden'}
        </button>
      </form>
    {/if}
  </div>

  <aside class="card h-fit">
    <h2 class="text-xl mb-4 normal-case">Direkter Kontakt</h2>
    <ul class="space-y-3 text-sm">
      <li><span class="text-muted block">E-Mail</span><a href={`mailto:${site.email}`} class="hover:text-accent">{site.email}</a></li>
      <li><span class="text-muted block">Telefon</span>{site.phone}</li>
      <li><span class="text-muted block">Standort</span>{site.location}</li>
    </ul>
  </aside>
</section>
