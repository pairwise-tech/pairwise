import {
  click,
  TIMEOUT,
  CLIENT_APP_URL,
  elementContains,
  EXTERNAL_SERVICES_URL,
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
// for the user (that's damn right!). This occurs by calling an
// external-services API which then handles the admin operation. Aside from
// that, the test does guarantee that Pairwise handles the correct behavior
// for course payments and locked content.
describe("Payment Course Flow: A user can purchase a course and unlock it's content", () => {
  it("Purchase the Fullstack TypeScript Course", () => {
    // Open the app
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.wait(TIMEOUT);

    // // Try to navigate to a locked challenge
    navigateToLockedChallenge();

    // // Prompted to login, login
    click("github-login");

    cy.wait(TIMEOUT);

    // Check that the post-login payment modal is visible
    cy.contains("Purchase Course");
    cy.contains("Start Checkout");
    cy.get("body").type("{esc}");

    // Go to the account page
    cy.get("#account-menu-dropdown").trigger("mouseover");
    click("account-link");

    // Find the user email and dispatch a request to the admin API to
    // purchase a course for this user. See the above comments for an
    // explanation of this egregiousness.
    let dispatchedAdminRequest = false;
    cy.get("#user-email")
      .invoke("text")
      .then(email => {
        // Only dispatch a single request
        if (!dispatchedAdminRequest) {
          dispatchedAdminRequest = true;
          const body = { email };
          const EXTERNAL_SERVICES_ADMIN_PAYMENT_URL = `${EXTERNAL_SERVICES_URL}/admin/purchase-course`;

          // You better use cy.request for this and not any other HTTP library
          cy.request("POST", EXTERNAL_SERVICES_ADMIN_PAYMENT_URL, body).should(
            response => {
              // Fail immediately if the response is bad so it's clear why
              // the test failed
              if (response.body !== "OK") {
                throw new Error(
                  `Invalid response received from external-services request, url used: ${EXTERNAL_SERVICES_ADMIN_PAYMENT_URL}`,
                );
              }
            },
          );
        }
      });

    // Wait!
    cy.wait(TIMEOUT);

    // Reload the page.
    cy.reload();

    // Confirm that the user account now shows the purchased course
    elementContains("account-payment-details-0", "Fullstack TypeScript");
    cy.contains("• Duration: Lifetime Access.");

    // Navigate back to the original locked challenge
    navigateToLockedChallenge();
    cy.wait(TIMEOUT);

    // Perform some simple checks that the previously locked intro
    // challenges loaded and are now accessible:
    // NOTE: This relies on fixed text and the existing challenge list,
    // it will need to be updated if/when these challenges change (which
    // they will).
    cy.contains("It's time to start using some real databases!");
    click("workspace-next-challenge-button");
    cy.contains(
      "Here we will see some examples of projects which use databases.",
    );
  });
});

// Helper to navigate to challenge which requires course payment to access.
const navigateToLockedChallenge = () => {
  click("navigation-menu-button");
  click("module-navigation-7");
  click("challenge-navigation-1");
};
