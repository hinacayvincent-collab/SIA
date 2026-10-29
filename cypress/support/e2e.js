// Custom commands for E2E tests

Cypress.Commands.add("addProductToCart", (productName, quantity = 1) => {
  cy.contains("[data-cy=product-card]", productName)
    .find("[data-cy=add-to-cart]")
    .click();

  // If quantity > 1, click add button additional times
  if (quantity > 1) {
    for (let i = 1; i < quantity; i++) {
      cy.contains("[data-cy=product-card]", productName)
        .find("[data-cy=add-to-cart]")
        .click();
    }
  }
});

Cypress.Commands.add("resetOrders", () => {
  const ordersUrl = Cypress.env("ORDER_SERVICE_URL");
  cy.request({
    method: "POST",
    url: `${ordersUrl}/test/reset`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add("getOrdersServiceUrl", () => {
  return Cypress.env("ORDER_SERVICE_URL");
});

// Load fixtures into Cypress.env for easy access
before(() => {
  cy.fixture("products").then((products) => {
    Cypress.env("products", products);
  });

  cy.fixture("orders").then((orders) => {
    Cypress.env("orders", orders);
  });

  cy.fixture("paymongo").then((paymongo) => {
    Cypress.env("paymongo", paymongo);
  });
});
