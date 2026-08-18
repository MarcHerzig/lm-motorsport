<script>
  import { images } from '$lib/content.js';
</script>

<svelte:head>
  <title>Über uns — LM Motorsport</title>
  <meta
    name="description"
    content="Zwei Kollegen, eine Leidenschaft: die Geschichte hinter LM Motorsport und unser Bezug zum Motorsport."
  />
</svelte:head>

<section class="relative">
  <img src={images.hero} alt="LM Motorsport Garage" class="w-full h-72 object-cover opacity-50" />
  <div class="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10"></div>
  <div class="absolute inset-0 flex items-end">
    <div class="section !py-10">
      <span class="eyebrow">Über uns</span>
      <h1 class="text-4xl md:text-5xl mt-2">Zwei Kollegen, eine Leidenschaft</h1>
    </div>
  </div>
</section>

<section class="section max-w-3xl space-y-6 text-lg text-muted leading-relaxed">
  <p>
    Angefangen hat alles in unserer Hobbygarage – mit Schraubenschlüssel in der Hand und Motorsport im
    Kopf. Aus der Leidenschaft fürs Auto ist die LM Motorsport GmbH entstanden: ein persönlicher
    Service für alle, die ein Auto suchen, prüfen oder warten lassen wollen.
  </p>
  <p>
    Was uns antreibt? Ehrlichkeit. Wir sagen dir, was Sache ist – auch wenn's mal bedeutet, dass ein
    Auto sein Geld nicht wert ist. Bei uns bekommst du kein Verkaufsgerede, sondern eine echte Meinung
    von Leuten, die wissen, worauf es ankommt.
  </p>

  <div class="card !bg-transparent border-dashed">
    <h2 class="text-xl mb-2 normal-case">Das sind wir</h2>
    <p class="text-muted text-base">
      Kurzvorstellung der beiden Gründer – Namen, Hintergrund, Motorsport-Bezug. Text und Fotos
      liefert ihr, das ist hier nur ein Platzhalter.
    </p>
  </div>

  <div class="text-center pt-6">
    <a href="/kontakt" class="btn-primary">Jetzt Kontakt aufnehmen</a>
  </div>
</section>
