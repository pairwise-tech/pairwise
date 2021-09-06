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

    // // Prompted to login, login
    click("github-login");
    cy.wait(TIMEOUT);

    // Check that the post-login payment modal is visible
    cy.contains("Purchase Course");
    cy.contains("Choose Member");
    cy.contains("Choose Premium");
    cy.get("body").type("{esc}");

    // Purchase the course
    purchaseCourseForUser("REGULAR");

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
    // they will). We could update it to read from the courses file directly
    // to determine the challenge ids and titles to test.
    cy.contains("The SQL SELECT Statement");
    click("nextButton");
    cy.contains("The SQL INSERT INTO Statement");
  });

  it("Purchase the Fullstack TypeScript Course (PREMIUM)", () => {
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
    cy.contains("Choose Member");
    cy.contains("Choose Premium");
    cy.get("body").type("{esc}");

    // Purchase the course
    purchaseCourseForUser("PREMIUM");

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
    // they will). We could update it to read from the courses file directly
    // to determine the challenge ids and titles to test.
    cy.contains("The SQL SELECT Statement");
    click("nextButton");
    cy.contains("The SQL INSERT INTO Statement");

    cy.get("#account-menu-dropdown").trigger("mouseover");
    click("account-link");
    cy.url().should("include", "account");

    // Check that they have the premium plan
    cy.contains("• Payment Plan: PREMIUM.");
    // Check that they have 3 coaching sessions available
    cy.contains("You currently have 3 career coaching sessions");
  });
});

// Helper to navigate to challenge which requires course payment to access.
const navigateToLockedChallenge = () => {
  click("navigation-menu-button");
  click("module-navigation-7");
  click("challenge-navigation-2");
};
