import {
  click,
  TIMEOUT,
  CLIENT_APP_URL,
  elementContains,
  purchaseCourseForUser,
} from "../support/cypress-utils";

/** ===========================================================================
 * Course Payments
 * ----------------------------------------------------------------------------
 * Test that course payments work
 * ============================================================================
 */

describe("Payment Course Flow: A user can purchase a course and unlock it's content", () => {
  it("Purchase the Fullstack TypeScript Course", () => {
    // Open the app
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.wait(TIMEOUT);

    // // Try to navigate to a locked challenge
    navigateToLockedChallenge();

    // NOTE: The challenge will load. Click the paid content label to initiate
    // the payment workflow. This can be removed when paid course access is
    // restored to work normally again.
    click("paid-content-label");

    // // Prompted to login, login
    click("github-login");
    cy.wait(TIMEOUT);

    // Check that the post-login payment modal is visible
    cy.contains("Purchase Course");
    cy.contains("Start Checkout");
    cy.get("body").type("{esc}");

    // Purchase the course
    purchaseCourseForUser();

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
    cy.contains("Getting Started with SQL");
    // Paid content label should not exist anymore
    cy.get("#paid-content-label").should("not.exist");
    click("nextButton");
    cy.contains(
      "It's time to start using some real databases! In these projects you will build simple applications which interact with a real, live database!",
    );
  });
});

// Helper to navigate to challenge which requires course payment to access.
const navigateToLockedChallenge = () => {
  click("navigation-menu-button");
  click("module-navigation-7");
  click("challenge-navigation-1");
};
