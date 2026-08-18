# LM Motorsport — Website

SvelteKit-Website für LM Motorsport GmbH (Car Finder, Car Checker, Pit Stop). Entwurf 1 — Texte, Preise, Design und Bilder sind Platzhalter zur Abstimmung, siehe Kommentare/Markierungen in den jeweiligen Seiten.

## Entwicklung

```bash
npm install
npm run dev
```

## Deployment

Wird als Container gebaut (`Dockerfile`) und über GitHub Actions nach `ghcr.io/marcherzig/lm-motorsport:latest` gepusht (`.github/workflows/build.yml`). Läuft im k3s-Homelab über ArgoCD (Repo `argo-homelab`, App `lm-motorsport`) auf `https://lm-motorsport.maegu.be`.

## Kontaktformular / SMTP

Das Formular unter `/kontakt` verschickt E-Mails über SMTP (nodemailer). Die Zugangsdaten kommen zur Laufzeit aus dem Kubernetes-Secret `lm-motorsport-secret` (Namespace `applications`), **nicht** aus diesem Repo. Einmalig anlegen:

```bash
kubectl create secret generic lm-motorsport-secret -n applications \
  --from-literal=SMTP_HOST=<smtp-host> \
  --from-literal=SMTP_PORT=587 \
  --from-literal=SMTP_USER=<smtp-user> \
  --from-literal=SMTP_PASSWORD=<smtp-passwort> \
  --from-literal=CONTACT_TO_EMAIL=info@lm-motorsport.ch
```

Solange das Secret fehlt, zeigt das Formular eine freundliche Fehlermeldung statt zu senden.
