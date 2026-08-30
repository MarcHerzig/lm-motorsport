<script>
  import { onMount } from 'svelte';

  let visible = false;

  onMount(() => {
    visible = !localStorage.getItem('lm-cookie-consent');
  });

  function accept() {
    localStorage.setItem('lm-cookie-consent', 'accepted');
    visible = false;
  }
</script>

{#if visible}
  <div class="cookie-banner fixed bottom-0 inset-x-0 z-50 border-t border-border bg-surface">
    <div class="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center gap-4 text-sm">
      <p class="text-muted grow">
        Diese Website verwendet nur technisch notwendige Daten. Details in unserer
        <a href="/datenschutz" class="text-accent hover:text-accent-hover">Datenschutzerklärung</a>.
      </p>
      <button class="btn-primary !py-2 !px-5 text-sm shrink-0" on:click={accept}>Verstanden</button>
    </div>
  </div>
{/if}
