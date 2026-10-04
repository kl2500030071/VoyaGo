# VoyaGo — Travel Price Comparison Platform

VoyaGo is a pure-frontend college project that helps Indian travellers compare the same trip across multiple travel platforms before clicking through to the real partner website.

## New problem statement

> **Indian travellers check 5+ sites to find the cheapest total price; VoyaGo compares in one place.**

VoyaGo is a comparison layer, not a booking/payment processor. It shows deterministic demo prices, exposes the fee/markup/tax/coupon breakdown, highlights Cheapest / Fastest / Best Value, and opens the partner website in a new tab for final booking.

## Important setup rule

**Always run through VS Code Live Server, never double-click the HTML file.**

Open the project folder in VS Code, install/use the Live Server extension, then open `index.html` with Live Server.

No backend, database, Node.js, Express, API keys, build step, or paid API is required.

## Demo admin account

- Email: `admin@voyago.com`
- Password: `VoyaGoAdmin#2026`

Use the seeded account only for the college-project demo.

## Core workflow

1. Sign up as a user.
2. Log out.
3. Log in again with the same account.
4. Choose a mode: Flights, Trains, Hotels, or Cabs.
5. Pick From / To / City only from the accessible autocomplete list.
6. Search the seeded demo inventory.
7. Open **Compare platforms**.
8. Inspect true totals and expandable breakdowns.
9. Click **Book on <Platform>** to open the partner homepage/search landing page in a new tab.
10. VoyaGo logs the click-through in `localStorage`.
11. Optionally set a price-drop target.
12. Use **Save to My Trips** to attach the option to an existing trip or create `Trip to <city>`.
13. Add a flight, hotel and cab to one trip.
14. In My Trips, simulate a 15/30/60/90/120-minute flight delay. The existing tested itinerary engine shifts the flight arrival, cab pickup and hotel check-in and creates an alert.
15. Admin can broadcast the same flight delay to all affected saved travellers.

## Why prices are demo data

Real-time travel pricing requires commercial access to partner inventory, paid APIs or affiliate feeds, authentication, rate limits, availability handling and usually a backend. VoyaGo intentionally stays **100% static frontend** for the college project, so the project cannot honestly claim to have live partner prices.

Instead, `api-mock.js` provides realistic seeded Indian travel inventory and `compare.js` deterministically calculates stable sample platform prices from:

- base fare
- convenience fee
- partner markup range
- taxes
- deterministic demo coupon
- a seeded ±8% demo price movement per app load

The UI clearly says: **“Sample prices for demo. Final price is confirmed on the partner site.”**

## Architecture

```text
VoyaGo
├── index.html                  Landing + city autocomplete + itinerary USP
├── auth/
│   ├── login.html
│   ├── signup.html
│   └── admin-login.html
├── user/
│   ├── dashboard.html          User comparison dashboard
│   ├── search.html             4-mode search + comparison engine
│   ├── trips.html              Saved trips + self-healing timeline
│   └── profile.html            Profile + wishlist
├── admin/
│   ├── dashboard.html          KPIs + SVG charts + broadcasts
│   ├── inventory.html          CRUD + edit modal + search + pagination
│   ├── users.html              Block/unblock/delete
│   ├── bookings.html           Redirects & Saved Trips audit
│   ├── partners.html           Partner fee/markup/active controls
│   └── reports.html            Redirect filters + CSV export
├── js/
│   ├── storage.js              localStorage keys + granular seed repair
│   ├── auth.js                 hashing + sessions + safeNextPath
│   ├── guard.js                protected-page route guards
│   ├── ui.js                   theme + modal/toast + city combobox
│   ├── api-mock.js             async seeded search APIs
│   ├── pricing.js              base true-total calculation
│   ├── partners.js             single partner configuration
│   ├── compare.js              deterministic platform comparison
│   └── itinerary.js            tested timeline/delay/refund/broadcast engine
└── css/
    ├── tokens.css
    ├── base.css
    ├── components.css
    ├── effects.css
    └── pages.css
```

## localStorage schema

| Key | Purpose |
|---|---|
| `voyago_users` | User/admin accounts and block state |
| `voyago_session` | Remembered user session |
| `voyago_bookings` | Internal saved travel records used by the tested itinerary engine; **not payment bookings** |
| `voyago_trips` | User trips and unified timeline |
| `voyago_inventory` | Flights, trains, hotels and cabs |
| `voyago_alerts` | Personal and broadcast alerts |
| `voyago_wishlist` | User wishlist |
| `voyago_settings` | Theme/preferences |
| `voyago_selected` | Reserved compatibility key for selected records |
| `voyago_redirects` | Partner click-through audit log |
| `voyago_searches` | Search events for admin analytics |
| `voyago_price_alerts` | User target-price watchers |
| `voyago_partners` | Admin-editable partner fee/markup/active configuration |

### Redirect record

```text
id
userId
itemId
item
platformId
platform
mode
price
time
```

### Saved-trip record

The project retains the internal `voyago_bookings` name because the existing tested `itinerary.js` engine is deliberately preserved. In the UI this is called **Saved Travel**, **Saved Item**, or **My Trips**. There is no card/UPI/wallet checkout screen and no VoyaGo payment processing.

## City autocomplete

`ui.js` exposes one reusable accessible city combobox. It:

- derives cities from seeded inventory
- filters as the user types
- supports Arrow Up / Arrow Down
- supports Enter and Escape
- uses `role="combobox"` and `role="listbox"`
- rejects free text that is not in the seeded city list
- provides a reusable swap action for From / To

## Seeded demo inventory

### Flights

Real airline brands are used in the seeded examples:

- IndiGo
- Air India
- Akasa Air
- SpiceJet

Flight numbers use realistic formats such as `6E 203`, `AI 101`, `QP 1345`, and `SG 8169`.

International fares are intentionally higher and realistic-looking rather than multiplying a domestic fare into implausible values.

### Trains

Examples include:

- 12951 Mumbai Rajdhani
- 12301 Howrah Rajdhani
- 12627 Karnataka Express
- 12723 Telangana Express
- 12009 Mumbai Central–Ahmedabad Shatabdi
- 12621 Tamil Nadu Express

Classes: SL, 3A, 2A, 1A. Timings are explicitly labelled approximate.

### Hotels

Recognisable seeded properties/brands include Taj, ITC, Marriott, Lemon Tree, Novotel, Hyatt, Oberoi, Shangri-La, Cinnamon and OYO-style inventory.

Each hotel has rating, amenities, city and a realistic-looking base nightly price.

### Cabs

Seeded providers include Uber, Ola, Rapido and BluSmart where relevant, with vehicle type, ETA and base fare.

## Partner comparison configuration

`js/partners.js` is the single configuration source. It includes active partner lists for:

- Flights: MakeMyTrip, Goibibo, Cleartrip, EaseMyTrip, Ixigo, Yatra, Airline site
- Trains: IRCTC, ConfirmTkt, Ixigo Trains, MakeMyTrip Trains
- Hotels: Booking.com, MakeMyTrip, Goibibo, Agoda, Cleartrip, OYO
- Cabs: Uber, Ola, Rapido

Only official homepage/search landing URLs are used. If a deep-link pattern is uncertain, VoyaGo uses the platform homepage.

Admins can change fee text, minimum/maximum markup and active state from **Admin → Partners**. The comparison engine reads the persisted configuration.

## Self-healing itinerary USP

`js/itinerary.js` is intentionally preserved from the tested implementation.

It handles:

- flight departure and arrival
- cab pickup = flight arrival + 30 minutes
- hotel check-in baseline = 14:00
- downstream hotel/cab repair after flight delay
- 15 / 30 / 60 / 90 / 120-minute simulations
- per-user alerts
- admin broadcast delay
- cancellation/refund tiers
- old-time → new-time animation with reduced-motion support

Do not replace this engine with a second timeline implementation.

## Admin module

### Dashboard

- Users
- Searches
- Redirects
- Saved Trips
- count-up KPI animation
- SVG redirects-per-platform chart
- SVG searches-per-day chart
- Broadcast Alert
- Broadcast Delay

### Inventory

- Flights / Trains / Hotels / Cabs tabs
- Add
- Edit with prefilled modal
- Delete with confirmation
- Search
- 20 rows per page
- city autocomplete for city fields

### Users

- Block / unblock
- Delete with confirmation
- Delete removes related saved travel, trips, alerts, wishlist, price alerts and redirect audit rows

### Redirects & Saved Trips

The old bookings-management screen has been replaced with:

- click-through audit table
- date filter
- platform filter
- mode filter
- user filter
- pagination
- per-platform redirect counts
- saved-trip audit

### Reports

Filters match the redirect audit and export the filtered rows to `voyago-redirects.csv`.

## Viva notes — 10 faculty questions

### 1. What problem does VoyaGo solve?
Indian travellers often compare the same trip across many sites. VoyaGo puts those demo comparisons in one place and sends the traveller to the real partner for final booking.

### 2. Why is VoyaGo not booking the ticket itself?
Because the project is intentionally a price-comparison platform. It avoids storing payment information and avoids pretending to be a travel inventory provider.

### 3. Why are prices not live?
Live prices require partner APIs/affiliate feeds, commercial agreements, backend infrastructure and real-time availability. This project must remain pure frontend, so it uses seeded mock data.

### 4. How are comparison prices calculated?
`compare()` combines base fare, convenience fee, deterministic partner markup, taxes and a deterministic demo coupon. The result is stable for the current app load.

### 5. How do you prevent random prices changing every time a button is clicked?
The comparison uses a seeded pseudo-random calculation derived from the item ID, partner ID and app-load seed. The same item/partner stays stable during that app load.

### 6. How do you protect users from free-text city mistakes?
The reusable `ui.js` combobox validates against the city set derived from inventory. Invalid free text gets a custom validity error and cannot be submitted.

### 7. Why use localStorage?
The project must run as static files without a backend. localStorage gives persistence for users, inventory, trips, redirects, alerts, searches and settings inside the browser.

### 8. How does the self-healing itinerary work?
The flight is the timing anchor. When its arrival moves, the tested itinerary engine recalculates cab pickup and hotel check-in and writes a user alert.

### 9. How does the admin broadcast delay work with multiple users?
The admin selects a flight number and delay. Every confirmed saved flight with that number is updated, downstream trip times are rebuilt, and each affected user receives a separate alert.

### 10. What would you build next for production?
A backend service, secure authentication, real partner/affiliate APIs, real availability, server-side price caching, rate limiting, consent/privacy controls, monitoring and secure redirect attribution.

## Quality checklist

Validated during the final build:

- [x] `safeNextPath()` is in `auth.js`, so login/signup/admin-login do not depend on `guard.js`.
- [x] Signup → logout → login uses the same account/session flow.
- [x] City comboboxes support filtering, keyboard selection, ARIA roles, swap and free-text rejection.
- [x] Four user search tabs exist: Flights, Trains, Hotels, Cabs.
- [x] Comparison panel calculates deterministic platform totals and shows breakdowns/badges.
- [x] Partner click-through is logged in `voyago_redirects` and opens a new tab with `noopener noreferrer`.
- [x] Save to My Trips works without payment/checkout.
- [x] Price-alert records and seeded price-drop checks exist.
- [x] Existing `itinerary.js` timeline/delay/refund/broadcast logic is retained exactly.
- [x] Admin inventory has add/edit/delete/search/type tabs/pagination.
- [x] Admin partner configuration feeds comparison pricing.
- [x] Redirect audit has filters and per-platform counts.
- [x] Reports export filtered redirect rows to CSV.
- [x] Dashboard KPIs/charts use real localStorage activity.
- [x] User block/unblock/delete has confirmation for destructive deletion.
- [x] Broadcast Alert and Broadcast Delay are available to admins.
- [x] No payment form, card/UPI/wallet flow or Luhn validation remains in the user UI.
- [x] Project uses relative local script/style paths and no backend.

For a college demonstration, use Live Server and keep the browser console open while walking through the quality-gate flow.
