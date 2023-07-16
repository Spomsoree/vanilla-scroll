import { defineConfig } from "cypress";

export default defineConfig({

  setupNodeEvents: (on, config) => {
    on("task", {
      log(message) {
        console.log(message);

        return null;
      },
      table(message) {
        console.table(message);

        return null;
      },
    });
  },

  e2e: {
    baseUrl: "http://localhost:1337",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
