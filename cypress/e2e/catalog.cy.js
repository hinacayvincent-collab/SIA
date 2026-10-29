describe("Catalog", () => {
  let products;
  let ordersUrl;

  before(() => {
    products = Cypress.env("products").products;
    ordersUrl = Cypress.env("ORDER_SERVICE_URL");
  });

  beforeEach(() => {
    cy.resetOrders();
  });

  it("E2E-01: shows the catalog with correct peso prices", () => {
    cy.visit("/");

    // Verify each product from fixtures
    products.forEach((product) => {
      cy.contains("[data-cy=product-card]", product.name)
        .find("[data-cy=product-price]")
        .should("have.text", product.priceFormatted);
    });
  });

  it("E2E-09: blocks checkout with an empty cart", () => {
    cy.intercept("POST", `${ordersUrl}/orders`).as("createOrder");
    cy.intercept("POST", "**/checkout").as("checkout");

    cy.visit("/");
    cy.get("[data-cy=place-order-button]").click();

    // Verify specific error message about empty cart
    cy.get("[data-cy=checkout-error]")
      .should("be.visible")
      .and("contain.text", "empty")
      .and("contain.text", "cart");

    // Ensure no API calls were made
    cy.get("@createOrder.all").should("have.length", 0);
    cy.get("@checkout.all").should("have.length", 0);

    // Verify order service is still healthy
    cy.request(`${ordersUrl}/health`).its("status").should("eq", 200);
  });
});
