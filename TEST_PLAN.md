# E2E test plan

One author per service, matching the midterm split.

| Member | Service |
| --- | --- |
| Macoy Sambas | Product Service |
| Cergel Posadas | Order Service |
| Vincent Hinacay | Payment Service |

| ID | Scenario | Spec file | Test name | Author |
| --- | --- | --- | --- | --- |
| E2E-01 | Catalog lists seeded products with peso prices from centavos | `cypress/e2e/catalog.cy.js` | `E2E-01: shows the catalog with correct peso prices` | Angela Reyes (Product) |
| E2E-02 | Checkout creates a pending order with the correct total (API + UI) | `cypress/e2e/orders.cy.js` | `E2E-02: creates a pending order with the right total` | Marco Dela Cruz (Order) |
| E2E-03 | UI checkout call succeeds and returns a PayMongo `checkoutUrl` | `cypress/e2e/checkout.cy.js` | `E2E-03: gets a checkout URL from PayMongo` | Paolo Santos (Payment) |
| E2E-04 | Browser lands on `checkout.paymongo.com` (hostname only) | `cypress/e2e/checkout.cy.js` | `E2E-04: hands the customer over to PayMongo` | Paolo Santos (Payment) |
| E2E-05 | Success URL shows paid in the UI and Order Service API | `cypress/e2e/orders.cy.js` | `E2E-05: updates the order on the success page` | Marco Dela Cruz (Order) |
| E2E-06 | Cancel URL never marks the order paid | `cypress/e2e/orders.cy.js` | `E2E-06: never marks a cancelled order as paid` | Marco Dela Cruz (Order) |
| E2E-07 | Stubbed checkout 500 shows an error, no redirect, order stays pending | `cypress/e2e/checkout.cy.js` | `E2E-07: shows a clear error when checkout fails` | Paolo Santos (Payment) |
| E2E-08 | Browser never calls `api.paymongo.com` and never receives `sk_test_` / `sk_live_` | `cypress/e2e/security.cy.js` | `E2E-08: keeps the secret key out of the browser` | Angela Reyes (Product) |
| E2E-09 | Empty cart is blocked with a message; no order or checkout session | `cypress/e2e/catalog.cy.js` | `E2E-09: blocks checkout with an empty cart` | Angela Reyes (Product) |
