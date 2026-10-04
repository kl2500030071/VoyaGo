# VoyaGo Viva Notes

## 30-second pitch

VoyaGo is a browser-only travel price comparison platform for Indian travellers. Instead of opening five or more sites to compare one trip, a user searches flights, trains, hotels or cabs once, sees deterministic demo true totals across major partner platforms, and clicks through to the real partner website for final booking. Users can save options to My Trips, where the existing self-healing itinerary can repair downstream timings after a flight delay.

## 10 faculty questions

1. **What problem are you solving?**
   Indian travellers compare the same trip across many websites. VoyaGo centralises that comparison.

2. **Why not make VoyaGo itself the booking website?**
   The new product decision is comparison-first. The partner remains responsible for final availability, price confirmation and payment.

3. **Why not use live prices?**
   Live prices require paid/commercial APIs or affiliate feeds, backend infrastructure, authentication and real-time inventory handling. This project must remain pure frontend.

4. **How are demo prices calculated?**
   Base fare + convenience fee + partner markup + taxes − deterministic coupon.

5. **Why are prices stable?**
   A seeded calculation based on item and partner IDs produces stable values during an app load. A separate seeded ±8% movement models a price-drop demo.

6. **Why localStorage?**
   It provides browser persistence without a backend and is sufficient for a college prototype.

7. **How is authentication handled?**
   Passwords are SHA-256 hashed when Web Crypto is available, with a small fallback for unsupported browsers. Sessions can use localStorage or sessionStorage through Remember me.

8. **How does the city autocomplete work?**
   One reusable `createCityCombobox()` component derives valid cities from inventory, supports keyboard navigation and ARIA listbox semantics, and rejects values not in the list.

9. **How does the self-healing itinerary work?**
   The existing tested `itinerary.js` treats flight arrival as the timing anchor. A delay shifts cab pickup and hotel check-in and writes an alert.

10. **What is the production roadmap?**
    Add a secure backend, real partner/affiliate APIs, live availability, server-side caching, secure auth, rate limiting, attribution, monitoring and privacy controls.

## Demo sequence

1. Open `index.html` with VS Code Live Server.
2. Create a user account.
3. Logout.
4. Login again using the same account.
5. Open Compare.
6. Search Delhi → Mumbai flights.
7. Open Compare platforms.
8. Expand a price breakdown.
9. Click Book on a platform; show the partner opens in a new tab.
10. Save the flight to My Trips.
11. Add a Mumbai hotel and cab to the same trip.
12. Open My Trips.
13. Simulate a 60-minute delay.
14. Show the old arrival crossed out, new arrival, shifted cab, shifted hotel and notification.
15. Open Admin login.
16. Show dashboard KPIs/charts.
17. Edit an inventory flight, then delete it with confirmation.
18. Change a partner markup/fee setting.
19. Open Redirects & Saved Trips.
20. Open Reports and export redirect CSV.

## Key design decision

The internal `voyago_bookings` key is retained only because the already-tested `itinerary.js` engine uses that record shape. The UI no longer presents payment checkout or ticket booking. In the product language it is **Saved Travel** / **Saved Items**.
