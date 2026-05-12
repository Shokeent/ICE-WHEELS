# Ice & Wheels

A guide to skating in Toronto — ice rinks and roller spots, all in one place. Bilingual (EN/FR), works offline, installable as a PWA.

**[Live site →](https://ice-wheels.vercel.app/)**

## What's in it

- **Locations directory** — browse and filter skating spots across the city
- **Interactive map** — all locations plotted with Leaflet
- **Favourites** — save spots locally, no account needed
- **Check-ins / Visit log** — track rinks you've been to
- **Live rink status** — open/closed info pulled from live data
- **Contact form** — powered by Formspree
- **Bilingual** — full English and French support
- **Dark mode** — respects system preference, togglable
- **Offline support** — service worker caches the shell, falls back gracefully

## Stack

Plain HTML, CSS, and JavaScript — no framework. Deployed on Vercel.

- [Leaflet](https://leafletjs.com/) for maps
- [Font Awesome](https://fontawesome.com/) for icons
- [Formspree](https://formspree.io/) for the contact form
- Service worker for PWA / offline support

## Local dev

No build step needed. Just open `index.html` in a browser, or serve it locally:

```bash
npx serve .
```
