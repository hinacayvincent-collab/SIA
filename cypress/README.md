# Cypress E2E Testing Guide

## Overview

This directory contains end-to-end (E2E) tests for the PayMongo Checkout microservices system. The tests validate the complete user flow from product catalog browsing through checkout and payment processing.

## Test Coverage

All 9 required test scenarios are implemented:

| Test ID | Description | File | Author |
|---------|-------------|------|--------|
| E2E-01 | Catalog displays with correct peso prices | `catalog.cy.js` | Macoy Sambas (Product) |
| E2E-02 | Creates pending order with correct total | `orders.cy.js` | Cergel Posadas (Order) |
| E2E-03 | Gets checkout URL from PayMongo | `checkout.cy.js` | Vincent Hinacay (Payment) |
| E2E-04 | Redirects to PayMongo checkout | `checkout.cy.js` | Vincent Hinacay (Payment) |
| E2E-05 | Success page updates order to paid | `orders.cy.js` | Cergel Posadas (Order) |
| E2E-06 | Cancel never marks order as paid | `orders.cy.js` | Cergel Posadas (Order) |
| E2E-07 | Shows error when checkout fails | `checkout.cy.js` | Vincent Hinacay (Payment) |
| E2E-08 | Keeps secret key out of browser | `security.cy.js` | Macoy Sambas (Product) |
| E2E-09 | Blocks checkout with empty cart | `catalog.cy.js` | Macoy Sambas (Product) |

## Prerequisites

### Required Services

All microservices must be running before executing tests:

1. **Frontend Service** - `http://localhost:3000`
2. **Product Service** - `http://localhost:3001`
3. **Order Service** - `http://localhost:3002`
4. **Payment Service** - `http://localhost:3003`

### Environment Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   
   Copy the example environment file:
   ```bash
   cp cypress.env.example.json cypress.env.json
   ```
   
   Update `cypress.env.json` with your service URLs if different from defaults:
   ```json
   {
     "FRONTEND_URL": "http://localhost:3000",
     "PRODUCT_SERVICE_URL": "http://localhost:3001",
     "ORDER_SERVICE_URL": "http://localhost:3002",
     "PAYMENT_SERVICE_URL": "http://localhost:3003"
   }
   ```
   
   **Note:** `cypress.env.json` is gitignored to prevent committing local configuration.

3. **Seed Test Data**
   
   Before running tests, seed the database with test products:
   ```bash
   npm run seed
   ```

## Running Tests

### Interactive Mode (Development)

Open Cypress Test Runner for interactive testing:

```bash
npm run cypress:open
```

This launches the Cypress UI where you can:
- Select and run individual tests
- Watch tests execute in real-time
- Debug with Chrome DevTools
- See detailed error messages

### Headless Mode (CI/Production)

Run all tests in headless mode:

```bash
npm run test:e2e
```

This is the command used in CI/CD pipelines.

### Additional Test Commands

```bash
# Run tests with browser visible (headed mode)
npm run test:e2e:headed

# Run tests in specific browser
npm run test:e2e:chrome
npm run test:e2e:firefox

# Run tests in CI mode with retries
npm run test:e2e:ci
```

## Project Structure

```
cypress/
├── e2e/                    # Test specifications
│   ├── catalog.cy.js      # Product catalog tests (E2E-01, E2E-09)
│   ├── checkout.cy.js     # Checkout flow tests (E2E-03, E2E-04, E2E-07)
│   ├── orders.cy.js       # Order management tests (E2E-02, E2E-05, E2E-06)
│   └── security.cy.js     # Security tests (E2E-08)
├── fixtures/               # Test data
│   ├── products.json      # Product catalog data
│   ├── orders.json        # Order test data
│   └── paymongo.json      # PayMongo configuration
├── support/                # Custom commands and configuration
│   └── e2e.js            # Custom Cypress commands
├── screenshots/            # Auto-captured on test failure
└── videos/                 # Recorded test runs
```

## Test Data (Fixtures)

Test data is stored in `cypress/fixtures/` for maintainability:

### products.json
Contains product catalog with IDs, names, prices (in centavos), and formatted peso prices.

### orders.json
Defines sample orders and order status constants used across tests.

### paymongo.json
Contains PayMongo-specific configuration including checkout URLs, domain patterns, and mock responses.

## Custom Commands

Located in `cypress/support/e2e.js`:

### `cy.addProductToCart(productName, quantity)`
Adds a product to the cart.

**Parameters:**
- `productName` (string): The name of the product (e.g., "SIA1 T-Shirt")
- `quantity` (number, optional): Number of items to add (default: 1)

**Example:**
```javascript
cy.addProductToCart("SIA1 T-Shirt");
cy.addProductToCart("SIA1 Tote Bag", 2);
```

### `cy.resetOrders()`
Resets order data between tests to ensure clean state.

**Usage:**
```javascript
beforeEach(() => {
  cy.resetOrders();
});
```

### `cy.getOrdersServiceUrl()`
Returns the configured Order Service URL from environment variables.

## Configuration

### cypress.config.js

Key configuration settings:

```javascript
{
  baseUrl: "http://localhost:3000",      // Frontend URL
  viewportWidth: 1280,                   // Desktop viewport
  viewportHeight: 720,
  video: true,                           // Record videos
  screenshotOnRunFailure: true,          // Capture screenshots on failure
  retries: {
    runMode: 2,                          // Retry failed tests in CI
    openMode: 0                          // No retries in interactive mode
  },
  defaultCommandTimeout: 10000,          // Command timeout (10s)
  requestTimeout: 15000,                 // API request timeout (15s)
  pageLoadTimeout: 60000                 // Page load timeout (60s)
}
```

## Best Practices

### 1. State Management
All tests use `beforeEach` hooks to reset state:

```javascript
beforeEach(() => {
  cy.resetOrders();
});
```

### 2. Using Fixtures
Tests reference fixture data instead of hardcoding:

```javascript
before(() => {
  products = Cypress.env("products").products;
});

it("test", () => {
  const testProduct = products.find(p => p.id === "prod_001");
  cy.addProductToCart(testProduct.name);
});
```

### 3. Network Interception
Use `cy.intercept()` to stub or spy on API calls:

```javascript
cy.intercept("POST", `${ordersUrl}/orders`).as("createOrder");
cy.wait("@createOrder").then(({ response }) => {
  expect(response.statusCode).to.eq(201);
});
```

### 4. Cross-Origin Testing
For PayMongo redirect tests, use `cy.origin()`:

```javascript
cy.origin("https://checkout.paymongo.com", () => {
  cy.location("hostname").should("eq", "checkout.paymongo.com");
});
```

## Troubleshooting

### Tests Fail: "baseUrl not reachable"
**Problem:** Frontend service not running.

**Solution:** Start the frontend service on port 3000:
```bash
cd frontend && npm start
```

### Tests Fail: Order creation errors
**Problem:** Order service not running or not seeded.

**Solution:**
1. Start Order Service: `cd order-service && npm start`
2. Seed database: `npm run seed`
3. Verify service health: `curl http://localhost:3002/health`

### Tests Timeout on Checkout
**Problem:** Payment service not responding.

**Solution:** 
1. Check Payment Service is running: `curl http://localhost:3003/health`
2. Verify PayMongo API credentials in Payment Service `.env`
3. Check network connectivity

### "Secret key exposed" Test Fails
**Problem:** PayMongo secret key in frontend code or environment.

**Solution:** Ensure secret keys are only in backend services, never in:
- Frontend JavaScript bundles
- HTML source
- Client-side environment variables

### Screenshot/Video Issues
**Problem:** Videos not recording or screenshots not captured.

**Solution:**
1. Check disk space
2. Verify write permissions on `cypress/videos` and `cypress/screenshots`
3. Clear old artifacts: `rm -rf cypress/videos/* cypress/screenshots/*`

### Fixture Loading Errors
**Problem:** Cannot load fixture files.

**Solution:**
1. Verify fixture files exist in `cypress/fixtures/`
2. Check JSON syntax is valid
3. Ensure `support/e2e.js` loads fixtures in `before()` hook

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/cypress.yml`:

```yaml
name: Cypress E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start services
        run: |
          npm run start:services &
          sleep 10
      
      - name: Seed test data
        run: npm run seed
      
      - name: Run Cypress tests
        run: npm run test:e2e:ci
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-artifacts
          path: |
            cypress/videos
            cypress/screenshots
```

## Test Maintenance

### Adding New Tests

1. Create test file in `cypress/e2e/`
2. Import required fixtures in `before()` hook
3. Add `beforeEach()` hook for state cleanup
4. Use custom commands for repeated actions
5. Add test data to appropriate fixture file
6. Update this README with new test documentation

### Updating Test Data

1. Edit fixture files in `cypress/fixtures/`
2. Maintain backwards compatibility if possible
3. Update seed script if database schema changes
4. Run tests to verify changes

### Performance Optimization

- Use `cy.intercept()` to mock slow external APIs
- Avoid unnecessary `cy.wait()` calls
- Use `cy.session()` for authentication state (if applicable)
- Run tests in parallel on CI

## Support

For questions or issues:

1. Check this README first
2. Review test logs in `cypress/videos/` and `cypress/screenshots/`
3. Contact your team member responsible for the failing service:
   - Product issues: Macoy Sambas
   - Order issues: Cergel Posadas  
   - Payment issues: Vincent Hinacay

## Additional Resources

- [Cypress Documentation](https://docs.cypress.io)
- [PayMongo API Documentation](https://developers.paymongo.com)
- [Project Repository](https://github.com/your-org/sia1-paymongo-checkout)
- [TEST_PLAN.md](../TEST_PLAN.md) - Detailed test plan and scenarios
