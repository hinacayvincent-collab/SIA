describe("Checkout", () => {
  let ordersUrl;
  let paymongo;
  let products;

  before(() => {
    ordersUrl = Cypress.env("ORDER_SERVICE_URL");
    paymongo = Cypress.env("paymongo");
    products = Cypress.env("products").products;
  });

  beforeEach(() => {
    cy.resetOrders();
  });

  it("E2E-03: gets a checkout URL from PayMongo", () => {
    cy.intercept("POST", "**/checkout").as("checkout");

    cy.visit("/");

    const testProduct = products.find(p => p.id === "prod_001");
    cy.addProductToCart(testProduct.name);
    cy.get("[data-cy=place-order-button]").click();

    // Wait for checkout button to be enabled
    cy.get("[data-cy=checkout-button]")
      .should("be.visible")
      .and("not.be.disabled")
      .click();

    cy.wait("@checkout").then(({ response }) => {
      expect(response.statusCode).to.eq(200);

      // Verify checkout URL matches PayMongo pattern from fixture
      const checkoutUrlPattern = new RegExp(paymongo.checkoutUrlPattern);
      expect(response.body.data.checkoutUrl).to.match(checkoutUrlPattern);
    });

    // Verify redirect to PayMongo domain
    cy.origin(`https://${paymongo.checkoutDomain}`, { args: { domain: paymongo.checkoutDomain } }, ({ domain }) => {
      cy.location("hostname").should("eq", domain);
    });
  });

  it("E2E-04: hands the customer over to PayMongo", () => {
    cy.intercept("POST", "**/checkout").as("checkout");

    cy.visit("/");

    const testProduct = products.find(p => p.id === "prod_001");
    cy.addProductToCart(testProduct.name);
    cy.get("[data-cy=place-order-button]").click();

    cy.get("[data-cy=checkout-button]")
      .should("be.visible")
      .and("not.be.disabled")
      .click();

    cy.wait("@checkout").its("response.statusCode").should("eq", 200);

    // Verify browser lands on PayMongo checkout domain (hostname only)
    cy.origin(`https://${paymongo.checkoutDomain}`, { args: { domain: paymongo.checkoutDomain } }, ({ domain }) => {
      cy.location("hostname").should("eq", domain);
    });
  });

  it("E2E-07: shows a clear error when checkout fails", () => {
    cy.intercept("POST", `${ordersUrl}/orders`).as("createOrder");
    cy.intercept("POST", "**/checkout", {
      statusCode: 500,
      body: paymongo.mockErrorResponse,
    }).as("checkout");

    cy.visit("/");

    const testProduct = products.find(p => p.id === "prod_001");
    cy.addProductToCart(testProduct.name);
    cy.get("[data-cy=place-order-button]").click();

    cy.wait("@createOrder").then(({ response }) => {
      const id = response.body.data.id;

      cy.get("[data-cy=checkout-button]")
        .should("be.visible")
        .and("not.be.disabled")
        .click();

      cy.wait("@checkout");

      // Verify error is shown with specific message
      cy.get("[data-cy=checkout-error]")
        .should("be.visible")
        .and("contain.text", "error")
        .and("not.be.empty");

      // Verify no redirect to success page occurred
      cy.location("pathname").should("not.include", "success");

      // Verify order remains pending
      cy.request(`${ordersUrl}/orders/${id}`)
        .its("body.data.status")
        .should("eq", "pending")
        .and("not.eq", "paid");
    });
  });
});
