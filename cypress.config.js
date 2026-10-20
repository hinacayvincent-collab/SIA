const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    video: true,
    retries: 0,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    pageLoadTimeout: 60000,
    allowCypressEnv: false,
  },
});
