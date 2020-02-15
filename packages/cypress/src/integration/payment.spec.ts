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
    // Open the app
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.wait(TIMEOUT);

    // Try to navigate to a locked challenge
    click("navigation-menu-button");
    click("module-navigation-7");
    click("challenge-navigation-0");
    cy.wait(TIMEOUT);

    // Prompted to login, login
    click("github-login");
    cy.wait(TIMEOUT);

    // Check that the post-login payment modal is visible
    cy.contains("Purchase Course");
    cy.contains("Start Checkout");
    cy.get("body").type("{esc}");

    // Go to the account page
    cy.get("#account-menu-dropdown").trigger("mouseover");
    cy.get("#account-link").click({ force: true });

    // Find the user email and dispatch a request to the admin API to
    // purchase a course for this user. See the above comments for an
    // explanation of this egregious fact.
    let dispatchedAdminRequest = false;
    cy.get("#user-email").should(async $div => {
      const email = $div.text();

      if (!dispatchedAdminRequest) {
        axios.post("http://localhost:7000/admin-purchase-course", { email });
        dispatchedAdminRequest = true;
      }
    });

    // Wait and reload the page.
    cy.wait(TIMEOUT);
    cy.reload();

    // Confirm that the user account now shows the purchased course
    elementContains("account-payment-details-0", "Fullstack TypeScript");
    cy.contains("• Duration: Lifetime Access.");

    // Navigate back to the original locked challenge
    navigateToLockedChallenge();
    cy.wait(TIMEOUT);

    // Perform some simple checks that the previously locked intro
    // challenges loaded and are now accessible:
    cy.contains("databases");
    click("workspace-next-challenge-button");
    cy.contains("mobile app");
  });
});

// Helper to navigate to challenge which requires course payment to access.
const navigateToLockedChallenge = () => {
  click("navigation-menu-button");
  click("module-navigation-7");
  click("challenge-navigation-0");
};
