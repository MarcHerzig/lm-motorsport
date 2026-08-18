<script>
  import { site } from '$lib/content.js';
  const year = new Date().getFullYear();
</script>

<footer class="border-t border-border mt-24">
  <div class="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-3">
    <div>
      <div class="font-heading text-lg tracking-wide mb-3">{site.legalName}</div>
      <p class="text-muted text-sm leading-relaxed">
        Auto suchen, prüfen, warten – alles aus einer Hand. Persönlich, ehrlich und mit Benzin im Blut.
      </p>
    </div>

    <div>
      <div class="eyebrow mb-3">Services</div>
      <ul class="space-y-2 text-sm">
        <li><a href="/services/car-finder" class="hover:text-accent">LM Car Finder</a></li>
        <li><a href="/services/car-checker" class="hover:text-accent">LM Car Checker</a></li>
        <li><a href="/services/pit-stop" class="hover:text-accent">LM Pit Stop</a></li>
      </ul>
    </div>

    <div>
      <div class="eyebrow mb-3">Kontakt</div>
      <ul class="space-y-2 text-sm text-muted">
        <li><a href={`mailto:${site.email}`} class="hover:text-accent">{site.email}</a></li>
        <li>{site.phone}</li>
        <li>{site.location}</li>
      </ul>
    </div>
  </div>

  <div class="border-t border-border">
    <div class="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-3 justify-between text-xs text-muted">
      <span>&copy; {year} {site.legalName}</span>
      <div class="flex gap-5">
        <a href="/impressum" class="hover:text-accent">Impressum</a>
        <a href="/datenschutz" class="hover:text-accent">Datenschutz</a>
        <a href="/agb" class="hover:text-accent">AGB</a>
      </div>
    </div>
  </div>
</footer>
