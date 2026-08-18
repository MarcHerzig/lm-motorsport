<script>
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import CookieBanner from '$lib/components/CookieBanner.svelte';
</script>

<div class="flex flex-col min-h-screen">
  <Header />
  <main class="grow">
    <slot />
  </main>
  <Footer />
  <CookieBanner />
</div>
