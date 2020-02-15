import axios from "axios";
import {
  click,
  TIMEOUT,
  CLIENT_APP_URL,
  elementContains,
} from "../support/cypress-utils";

/** ===========================================================================
 * Course Payments
 * ----------------------------------------------------------------------------
 * Test that course payments work
 * ============================================================================
 */

// Garbage! https://github.com/cypress-io/cypress/issues/944
// Cypress does not support running tests which visit different domains,
// therefore we cannot actually walk through the entire payments flow and
// submit the payment to Stripe. This would be possible using the Stripe CLI
// in test mode, however, Cypress makes this impossible. Instead of this,
// The test relies on an admin API to actually generate the course payment
// for the user (that's damn right!). Aside from that, the test does
// guarantee that Pairwise handles the correct behavior for course payments
// and locked content.
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

    elementContains("account-payment-details-0", "Fullstack TypeScript");
    cy.contains("• Duration: Lifetime Access.");
  });
});
