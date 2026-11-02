# VoyaGo — React + Vite

VoyaGo is a travel comparison application upgraded from the original vanilla JavaScript project to **React + Vite**. It includes separate User and Admin modules, Local Storage authentication, seeded demo travel inventory, trip saving, theme preferences and an administrative overview.

## Requirements
- Node.js 20.19+ or 22.12+
- npm

## Run locally
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

## Modules
**Public:** landing page, travel category selection and signup/login.
**User:** dashboard, search and compare, My Trips, profile.
**Admin:** dashboard, inventory overview, user management, saved-record audit and CSV reports.

## Demo admin
Email: `admin@voyago.com`
Password: `VoyaGoAdmin#2026` (seeded SHA-256 demo credential)

The original VoyaGo seed engine is retained to initialise demo inventory and the admin account. Data is stored in the browser. This is an academic frontend demo: prices and inventory are sample data, not live partner availability. Passwords are SHA-256 hashed in the browser; this is not production-grade authentication and must not be used for real credentials.

## Deployment
Import this repository into Vercel. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`. `vercel.json` includes SPA route rewrites.
