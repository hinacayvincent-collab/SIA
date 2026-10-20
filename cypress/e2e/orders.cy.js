const ORDERS = "http://localhost:3002";

describe("Orders", () => {
  it("E2E-02: creates a pending order with the right total", () => {
    cy.intercept("POST", /^http:\/\/localhost:3002\/orders$/).as("createOrder");

    cy.visit("/");
    cy.addProductToCart("SIA1 T-Shirt");
    cy.get("[data-cy=place-order-button]").click();

    cy.wait("@createOrder").then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      const order = response.body.data;
      expect(order.status).to.eq("pending");
      expect(order.total).to.eq(35000);

      cy.request(`${ORDERS}/orders/${order.id}`)
        .its("body.data")
        .should((data) => {
          expect(data.status).to.eq("pending");
          expect(data.total).to.eq(35000);
        });
    });
  });

  it("E2E-05: updates the order on the success page", () => {
    cy.request("POST", `${ORDERS}/orders`, {
      items: [{ productId: "prod_001", quantity: 1 }],
    }).then((res) => {
      const id = res.body.data.id;

      cy.visit(`${ORDERS}/orders/${id}/success`);
      cy.get("[data-cy=order-status]").should("have.text", "paid");
      cy.request(`${ORDERS}/orders/${id}`)
        .its("body.data.status")
        .should("eq", "paid");
    });
  });

  it("E2E-06: never marks a cancelled order as paid", () => {
    cy.request("POST", `${ORDERS}/orders`, {
      items: [{ productId: "prod_001", quantity: 1 }],
    }).then((res) => {
      const id = res.body.data.id;

      cy.visit(`${ORDERS}/orders/${id}/cancel`);
      cy.get("[data-cy=order-status]").should("have.text", "cancelled");
      cy.get("[data-cy=order-status]").should("not.have.text", "paid");
      cy.request(`${ORDERS}/orders/${id}`)
        .its("body.data.status")
        .should("eq", "cancelled")
        .and("not.eq", "paid");
    });
  });
});
