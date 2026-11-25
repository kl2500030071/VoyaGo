# VoyaGo — React + Vite

VoyaGo is a frontend travel comparison application built with **React + Vite**. It lets travellers search and compare flights, trains, hotels, and cabs across seeded demo inventory, save trips, set price alerts, and continue to external booking partners, alongside a dedicated Admin module.

**Live Demo:** [https://voya-go.vercel.app/](https://voya-cpgg6zatb-rookie-rebels.vercel.app/)

## Features

- **Public:** Landing page with quick search, category overview, theme toggle (light/dark), and authentication (`/login`, `/signup`, `/admin-login`).
- **User Module (`/user/*`):**
  - **Dashboard:** Saved trip count, category shortcuts, and active price alert count.
  - **Compare Travel:** Mode-aware `From` / `To` / `City` dropdowns, swap route button, popular quick-pick chips, sorting (lowest price, highest rating, fastest/shortest), text filtering, interactive train class selector (`SL`, `3A`, `2A`, `1A`), expandable fare breakdown, price alerts, and external partner booking links.
  - **My Trips:** Manage saved travel options and active price alerts.
  - **Profile:** Account details, appearance toggle, and logout.
- **Admin Module (`/admin/*`):**
  - **Dashboard:** Overview of registered users, inventory items, saved records, and partner redirects.
  - **Inventory Management:** Add, filter, browse, and delete flights, trains, hotels, and cabs.
  - **User Management:** View registered users and block/unblock non-admin accounts.
  - **Partners:** Enable/disable external booking providers per travel category.
  - **Bookings & Reports:** Audit saved travel records and export `voyago-report.csv`.

## Seeded Demo Data

Initialised automatically in the browser via `public/legacy-storage.js`:
- **Flights:** 632 seeded routes across domestic Indian carriers and international airlines.
- **Trains:** 330 seeded rail options with class-wise fares (`SL`, `3A`, `2A`, `1A`).
- **Hotels:** 80 seeded properties across 20 cities.
- **Cabs:** 200 seeded cab options across 20 cities.

## Demo Admin Credentials

- **Login URL:** `/admin-login`
- **Email:** `admin@voyago.com`
- **Password:** `VoyaGoAdmin#2026` (seeded SHA-256 demo credential)

> **Note on Browser Storage:** VoyaGo is a frontend-only demo with no backend server. All users, trips, price alerts, and inventory changes are stored in each browser's `localStorage`, so accounts created on one device or browser are not visible from another device. Passwords are SHA-256 hashed in the browser for demo purposes only.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run Locally

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Deployment

Import this repository into Vercel with framework preset **Vite**, build command `npm run build`, and output directory `dist`. `vercel.json` handles SPA route rewrites.
