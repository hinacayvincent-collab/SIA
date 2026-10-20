describe("Security", () => {
  it("E2E-08: keeps the secret key out of the browser", () => {
    cy.intercept("https://api.paymongo.com/**", cy.spy().as("browserToPayMongo"));
    cy.intercept("POST", "**/checkout").as("checkout");

    cy.visit("/");

    cy.document().then((doc) => {
      const html = doc.documentElement.outerHTML;
      expect(html).to.not.include("sk_test_");
      expect(html).to.not.include("sk_live_");
    });

    cy.request("/app.js").then((res) => {
      expect(res.body).to.not.include("sk_test_");
      expect(res.body).to.not.include("sk_live_");
    });

    cy.addProductToCart("SIA1 T-Shirt");
    cy.get("[data-cy=place-order-button]").click();
    cy.get("[data-cy=checkout-button]").should("be.visible").click();
    cy.wait("@checkout");

    cy.get("@browserToPayMongo").should("not.have.been.called");

    cy.origin("https://checkout.paymongo.com", () => {
      cy.location("hostname").should("eq", "checkout.paymongo.com");
    });
  });
});
