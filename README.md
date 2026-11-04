# SIA1 Final Project: PayMongo Checkout with Cypress E2E Testing

End-to-end testing suite for a microservices-based PayMongo checkout system, built for the System Integration and Architecture final project.

## Team Members

| Member          | Service         |
| --------------- | --------------- |
| Macoy Sambas    | Product Service |
| Cergel Posadas  | Order Service   |
| Vincent Hinacay | Payment Service |

## Project Overview

This project implements a complete e-commerce checkout flow integrated with PayMongo's Checkout API in test mode. The system is composed of four microservices:

1. **Frontend** (port 3000) — Product catalog and shopping cart UI
2. **Product Service** (port 3001) — Product data and pricing
3. **Order Service** (port 3002) — Order management and PayMongo callback handling
4. **Payment Service** (port 3003) — PayMongo Checkout API integration

The final project deliverable is a comprehensive Cypress E2E test suite proving that all services work together correctly.

## Prerequisites

- **Node.js** LTS version (18, 20, or 22 recommended)
- **npm** or **yarn**
- **Internet connection** (for PayMongo sandbox API)
- **PayMongo Test Account** with secret key configured in `payment-service/.env`

## Architecture

```
Frontend (3000)          Product Service (3001)
     ↓                           ↑
     ↓                           |
Order Service (3002) ←→ Payment Service (3003) ←→ PayMongo API
     ↓
     ↓ (success/cancel URLs)
Customer's Browser
```

## Running the E2E Tests

### 1. Install Dependencies

From the project root:

```bash
npm install
```

Then install dependencies for each service:

```bash
cd frontend && npm install && cd ..
cd product-service && npm install && cd ..
cd order-service && npm install && cd ..
cd payment-service && npm install && cd ..
```

### 2. Start All Services

Open **four separate terminal windows** and start each service:

**Terminal 1 — Frontend:**
```bash
cd frontend
npm start
```
The frontend will run on `http://localhost:3000`

**Terminal 2 — Product Service:**
```bash
cd product-service
npm start
```
The product service will run on `http://localhost:3001`

**Terminal 3 — Order Service:**
```bash
cd order-service
ENABLE_TEST_RESET=true npm start
```
The order service will run on `http://localhost:3002`

**Terminal 4 — Payment Service:**
```bash
cd payment-service
npm start
```
The payment service will run on `http://localhost:3003`

> **Note:** Make sure your PayMongo secret key is configured in `payment-service/.env`:
> ```
> PAYMONGO_SECRET_KEY=sk_test_your_key_here
> ```

### 3. Seed Test Data

In a new terminal (from project root):

```bash
npm run seed
```

This creates three test products with fixed names and prices used by the test suite.

### 4. Run the E2E Tests

From the project root:

```bash
npm run test:e2e
```

This runs all tests headlessly. You should see output like:

```
  catalog.cy.js
    ✓ E2E-01 shows the catalog with correct peso prices
    ✓ E2E-09 blocks checkout with an empty cart

  orders.cy.js
    ✓ E2E-02 creates a pending order with the right total
    ✓ E2E-05 updates the order on the success page
    ✓ E2E-06 never marks a cancelled order as paid

  checkout.cy.js
    ✓ E2E-03 gets a checkout URL from PayMongo
    ✓ E2E-04 hands the customer over to PayMongo
    ✓ E2E-07 shows a clear error when checkout fails

  security.cy.js
    ✓ E2E-08 keeps the secret key out of the browser

  9 passing (Xs)
```

### Alternative Test Commands

```bash
# Run tests with browser visible (headed mode)
npm run test:e2e:headed

# Run in specific browser
npm run test:e2e:chrome
npm run test:e2e:firefox

# Open Cypress Test Runner (interactive mode)
npm run cypress:open
```

## Test Coverage

All 9 required E2E scenarios are implemented:

| ID     | Scenario                         | File             |
|--------|----------------------------------|------------------|
| E2E-01 | Catalog with peso prices         | catalog.cy.js    |
| E2E-02 | Order creation                   | orders.cy.js     |
| E2E-03 | Checkout session URL             | checkout.cy.js   |
| E2E-04 | Hand-over to PayMongo            | checkout.cy.js   |
| E2E-05 | Success page updates order       | orders.cy.js     |
| E2E-06 | Cancel page handling             | orders.cy.js     |
| E2E-07 | Checkout failure error           | checkout.cy.js   |
| E2E-08 | No secrets in browser            | security.cy.js   |
| E2E-09 | Empty cart validation            | catalog.cy.js    |

See [TEST_PLAN.md](TEST_PLAN.md) for the complete test plan with authors and detailed scenarios.

## Documentation

- **[TEST_PLAN.md](TEST_PLAN.md)** — Test scenario mapping and team assignments
- **[cypress/README.md](cypress/README.md)** — Detailed Cypress testing documentation, custom commands, troubleshooting, and CI/CD setup

## Troubleshooting

### Tests fail: "baseUrl not reachable"
The frontend service is not running. Start it on port 3000.

### Tests fail: Order creation errors
1. Check that the Order Service is running on port 3002
2. Verify test data is seeded: `npm run seed`
3. Check service health: `curl http://localhost:3002/health`

### Tests timeout on checkout
1. Verify Payment Service is running: `curl http://localhost:3003/health`
2. Check PayMongo credentials in `payment-service/.env`
3. Verify internet connectivity to PayMongo API

### "Secret key exposed" test fails
Ensure the PayMongo secret key is **only** in `payment-service/.env`, never in:
- Frontend code or environment variables
- HTML source
- JavaScript bundles

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/cypress.yml`) that:
- Runs on every push to `main` or `develop`
- Tests across Chrome and Firefox browsers
- Captures videos and screenshots on failure

## Project Structure

```
.
├── frontend/               # Static storefront UI
├── product-service/        # Product catalog API
├── order-service/          # Order management API
├── payment-service/        # PayMongo integration
├── cypress/
│   ├── e2e/               # Test specifications
│   ├── fixtures/          # Test data
│   └── support/           # Custom commands
├── cypress.config.js      # Cypress configuration
├── TEST_PLAN.md          # Test scenario mapping
└── package.json          # Root scripts and Cypress dependency
```

## License

Academic project for System Integration and Architecture (SIA1).
