const ORDERS = "http://localhost:3002";

Cypress.Commands.add("addProductToCart", (name = "SIA1 T-Shirt") => {
  cy.contains("[data-cy=product-card]", name)
    .find("[data-cy=add-to-cart]")
    .click();
});

Cypress.Commands.add("resetOrders", () => {
  cy.request({
    method: "POST",
    url: `${ORDERS}/test/reset`,
    failOnStatusCode: false,
  });
});
