describe("Orders", () => {
  let ordersUrl;
  let orderFixtures;
  let products;

  before(() => {
    ordersUrl = Cypress.env("ORDER_SERVICE_URL");
    orderFixtures = Cypress.env("orders");
    products = Cypress.env("products").products;
  });

  beforeEach(() => {
    cy.resetOrders();
  });

  it("E2E-02: creates a pending order with the right total", () => {
    cy.intercept("POST", `${ordersUrl}/orders`).as("createOrder");

    cy.visit("/");

    // Add product from fixtures
    const testProduct = products.find(p => p.id === "prod_001");
    cy.addProductToCart(testProduct.name);
    cy.get("[data-cy=place-order-button]").click();

    cy.wait("@createOrder").then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      const order = response.body.data;

      // Verify order status and total
      expect(order.status).to.eq(orderFixtures.orderStatuses.pending);
      expect(order.total).to.eq(testProduct.price);

      // Verify via API that order persists correctly
      cy.request(`${ordersUrl}/orders/${order.id}`)
        .its("body.data")
        .should((data) => {
          expect(data.status).to.eq(orderFixtures.orderStatuses.pending);
          expect(data.total).to.eq(testProduct.price);
        });
    });
  });

  it("E2E-05: updates the order on the success page", () => {
    const sampleOrder = orderFixtures.sampleOrder;

    cy.request("POST", `${ordersUrl}/orders`, {
      items: sampleOrder.items,
    }).then((res) => {
      const id = res.body.data.id;

      // Visit success page
      cy.visit(`${ordersUrl}/orders/${id}/success`);

      // Verify UI shows paid status
      cy.get("[data-cy=order-status]")
        .should("be.visible")
        .and("have.text", orderFixtures.orderStatuses.paid);

      // Verify API reflects paid status
      cy.request(`${ordersUrl}/orders/${id}`)
        .its("body.data.status")
        .should("eq", orderFixtures.orderStatuses.paid);
    });
  });

  it("E2E-06: never marks a cancelled order as paid", () => {
    const sampleOrder = orderFixtures.sampleOrder;

    cy.request("POST", `${ordersUrl}/orders`, {
      items: sampleOrder.items,
    }).then((res) => {
      const id = res.body.data.id;

      // Visit cancel page
      cy.visit(`${ordersUrl}/orders/${id}/cancel`);

      // Verify UI shows cancelled status
      cy.get("[data-cy=order-status]")
        .should("be.visible")
        .and("have.text", orderFixtures.orderStatuses.cancelled);

      // Ensure it does NOT show paid
      cy.get("[data-cy=order-status]").should("not.have.text", orderFixtures.orderStatuses.paid);

      // Verify API reflects cancelled status
      cy.request(`${ordersUrl}/orders/${id}`)
        .its("body.data.status")
        .should("eq", orderFixtures.orderStatuses.cancelled)
        .and("not.eq", orderFixtures.orderStatuses.paid);
    });
  });
});
