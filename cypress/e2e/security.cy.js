describe("Security", () => {
  let paymongo;
  let products;

  before(() => {
    paymongo = Cypress.env("paymongo");
    products = Cypress.env("products").products;
  });

  beforeEach(() => {
    cy.resetOrders();
  });

  it("E2E-08: keeps the secret key out of the browser", () => {
    // Intercept any direct browser calls to PayMongo API
    cy.intercept(`https://${paymongo.apiDomain}/**`, cy.spy().as("browserToPayMongo"));
    cy.intercept("POST", "**/checkout").as("checkout");

    cy.visit("/");

    // Check that secret keys are not in the HTML source
    cy.document().then((doc) => {
      const html = doc.documentElement.outerHTML;
      paymongo.secretKeyPatterns.forEach((pattern) => {
        expect(html).to.not.include(pattern);
      });
    });

    // Check that secret keys are not in bundled JavaScript
    cy.request("/app.js").then((res) => {
      paymongo.secretKeyPatterns.forEach((pattern) => {
        expect(res.body).to.not.include(pattern);
      });
    });

    // Perform checkout flow
    const testProduct = products.find(p => p.id === "prod_001");
    cy.addProductToCart(testProduct.name);
    cy.get("[data-cy=place-order-button]").click();
    cy.get("[data-cy=checkout-button]")
      .should("be.visible")
      .and("not.be.disabled")
      .click();

    cy.wait("@checkout");

    // Verify browser never called PayMongo API directly
    cy.get("@browserToPayMongo").should("not.have.been.called");

    // Verify redirect to PayMongo checkout (hostname verification only)
    cy.origin(`https://${paymongo.checkoutDomain}`, { args: { domain: paymongo.checkoutDomain } }, ({ domain }) => {
      cy.location("hostname").should("eq", domain);
    });
  });
});
