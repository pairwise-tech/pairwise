import axios from "axios";
import { click, TIMEOUT, CLIENT_APP_URL } from "../support/cypress-utils";

/** ===========================================================================
 * Auth Tests
 * ----------------------------------------------------------------------------
 * Test the authentication flows in the app.
 * ============================================================================
 */

// Garbage! https://github.com/cypress-io/cypress/issues/944
describe("Payment Course Flow: A user can purchase a course and unlock it's content", () => {
  it("Fullstack TypeScript Course Payment", () => {
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.wait(TIMEOUT);

    click("course-link-0-purchase");
    click("github-login");
    cy.wait(TIMEOUT);

    cy.contains("Purchase Course");
    cy.contains("Start Checkout");
    cy.get("body").type("{esc}");

    cy.get("#account-menu-dropdown").trigger("mouseover");
    cy.get("#account-link").click({ force: true });

    let dispatchedAdminRequest = false;
    cy.get("#user-email").should(async $div => {
      const email = $div.text();

      if (!dispatchedAdminRequest) {
        console.log("Dispatching admin request!");
        axios.post("http://localhost:7000/admin-purchase-course", { email });
        dispatchedAdminRequest = true;
      }
    });

    cy.wait(TIMEOUT);
    cy.reload();
  });
});
