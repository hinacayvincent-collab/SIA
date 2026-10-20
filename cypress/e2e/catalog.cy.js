const ORDERS = "http://localhost:3002";

describe("Catalog", () => {
  it("E2E-01: shows the catalog with correct peso prices", () => {
    cy.visit("/");

    cy.contains("[data-cy=product-card]", "SIA1 T-Shirt")
      .find("[data-cy=product-price]")
      .should("have.text", "₱350.00");

    cy.contains("[data-cy=product-card]", "SIA1 Tote Bag")
      .find("[data-cy=product-price]")
      .should("have.text", "₱150.00");

    cy.contains("[data-cy=product-card]", "SIA1 Sticker Pack")
      .find("[data-cy=product-price]")
      .should("have.text", "₱50.00");
  });

  it("E2E-09: blocks checkout with an empty cart", () => {
    cy.intercept("POST", /^http:\/\/localhost:3002\/orders$/).as("createOrder");
    cy.intercept("POST", "**/checkout").as("checkout");

    cy.visit("/");
    cy.get("[data-cy=place-order-button]").click();

    cy.get("[data-cy=checkout-error]")
      .should("be.visible")
      .and("contain", "empty");

    cy.get("@createOrder.all").should("have.length", 0);
    cy.get("@checkout.all").should("have.length", 0);

    cy.request(`${ORDERS}/health`).its("status").should("eq", 200);
  });
});
