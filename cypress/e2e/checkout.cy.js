const ORDERS = "http://localhost:3002";

describe("Checkout", () => {
  it("E2E-03: gets a checkout URL from PayMongo", () => {
    cy.intercept("POST", "**/checkout").as("checkout");

    cy.visit("/");
    cy.addProductToCart("SIA1 T-Shirt");
    cy.get("[data-cy=place-order-button]").click();
    cy.get("[data-cy=checkout-button]").should("be.visible").click();

    cy.wait("@checkout").then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.data.checkoutUrl).to.match(
        /^https:\/\/checkout\.paymongo\.com\//,
      );
    });

    cy.origin("https://checkout.paymongo.com", () => {
      cy.location("hostname").should("eq", "checkout.paymongo.com");
    });
  });

  it("E2E-04: hands the customer over to PayMongo", () => {
    cy.intercept("POST", "**/checkout").as("checkout");

    cy.visit("/");
    cy.addProductToCart("SIA1 T-Shirt");
    cy.get("[data-cy=place-order-button]").click();
    cy.get("[data-cy=checkout-button]").should("be.visible").click();

    cy.wait("@checkout").its("response.statusCode").should("eq", 200);

    cy.origin("https://checkout.paymongo.com", () => {
      cy.location("hostname").should("eq", "checkout.paymongo.com");
    });
  });

  it("E2E-07: shows a clear error when checkout fails", () => {
    cy.intercept("POST", /^http:\/\/localhost:3002\/orders$/).as("createOrder");
    cy.intercept("POST", "**/checkout", {
      statusCode: 500,
      body: { error: "Payment unavailable" },
    }).as("checkout");

    cy.visit("/");
    cy.addProductToCart("SIA1 T-Shirt");
    cy.get("[data-cy=place-order-button]").click();

    cy.wait("@createOrder").then(({ response }) => {
      const id = response.body.data.id;

      cy.get("[data-cy=checkout-button]").should("be.visible").click();
      cy.wait("@checkout");

      cy.get("[data-cy=checkout-error]").should("be.visible");
      cy.location("pathname").should("not.include", "success");
      cy.request(`${ORDERS}/orders/${id}`)
        .its("body.data.status")
        .should("eq", "pending")
        .and("not.eq", "paid");
    });
  });
});
