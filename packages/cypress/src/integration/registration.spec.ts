import {
  CLIENT_APP_URL,
  TIMEOUT,
  goToNextChallenge,
  typeTextInCodeEditor,
  elementContains,
  click,
  checkTestResultStatus,
  checkTestStatus,
} from "../support/cypress-utils";

/** ===========================================================================
 * Account Creation Tests
 * ----------------------------------------------------------------------------
 * This just covers basic functionality, but the test works! It tests that
 * a user can work on challenges, then sign up and create an account, and
 * their updates are persisted successfully to their new account, including
 * after page reload.
 * ============================================================================
 */

describe("Account Creation Flow", () => {
  it("Creating an account persists last active challenge ids correctly", () => {
    // Visit a challenge in one course
    cy.visit(`${CLIENT_APP_URL}/workspace/6INEtFAT7`);
    cy.wait(TIMEOUT);

    // Helper to check both of the above challenges are saved correctly
    const checkTheHomeChallengeLinks = () => {
      // Return to the home route
      click("header-home-link");
      click("course-link-0-start");
      cy.url().should("include", "workspace/6INEtFAT7");
    };

    cy.reload();

    // Check the links prior to login
    checkTheHomeChallengeLinks();

    click("login-signup-button");
    click("facebook-login");

    // Allow some time for updates to sync
    cy.wait(5000);

    // Check the links again after login
    checkTheHomeChallengeLinks();

    // Visit a different challenge
    cy.visit(`${CLIENT_APP_URL}/workspace/30f72918U`);
    cy.wait(TIMEOUT);

    cy.visit(`${CLIENT_APP_URL}/workspace/@lFys5akJ`);
    cy.wait(TIMEOUT);

    // Return home and reload
    click("header-home-link");
    cy.reload();
    cy.wait(TIMEOUT);

    // Check the id updated
    click("course-link-0-start");
    cy.url().should("include", "workspace/@lFys5akJ");
  });

  it("Creating an account persists pre-login updates correctly", () => {
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.wait(TIMEOUT);
    cy.url().should("include", "home");

    /* Open the navigation menu and navigate to the first programming challenge: */
    click("navigation-menu-button");
    click("module-navigation-0");
    click("challenge-navigation-4");

    checkTestResultStatus("Incomplete...");
    typeTextInCodeEditor(SOLUTIONS["4"]);
    checkTestResultStatus("Success!");

    goToNextChallenge();

    click("pw-run-code");
    checkTestStatus("Success!", 0);
    checkTestStatus("Incomplete...", 1);
    typeTextInCodeEditor(SOLUTIONS["5"]);
    click("pw-run-code");
    checkTestResultStatus("Success!", 2);

    goToNextChallenge();
    checkTestResultStatus("Incomplete...", 1);
    typeTextInCodeEditor(SOLUTIONS["6"]);
    click("pw-run-code");
    checkTestResultStatus("Success!", 1);
    goToNextChallenge();

    checkNavigationOverlay();

    click("login-signup-button");
    click("facebook-login");

    // Wait!
    cy.wait(5000);

    checkCourseState();
    checkNavigationOverlay();
    cy.reload();
    cy.wait(TIMEOUT);
    checkCourseState();
    checkNavigationOverlay();
  });

  /**
   * This test+behavior fails when running in Cypress (the correct url is
   * not passed along as the referer) but works in a normal browser
   * situation. I couldn't figure out why. :(
   */
  it.skip("Creating an account redirects to the original workspace URL after registration success", () => {
    // Use Facebook signin
    checkUrlDuringUserRegistrationProcess("facebook", randomChallengeIndex());
    // Use Google signin
    checkUrlDuringUserRegistrationProcess("google", randomChallengeIndex());
    // Use GitHub signin
    checkUrlDuringUserRegistrationProcess("github", randomChallengeIndex());
  });

  it("User registration with no email shows a prompt to add email, but only after reload and only one time", () => {
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.wait(TIMEOUT);
    cy.url().should("include", "home");

    // Login with Facebook (defaults to { email: null })
    click("login-signup-button");
    click(`facebook-login`);

    // Let the login process complete
    cy.wait(500);

    // Check that the toast does not exist yet
    cy.get("Setup Email").should("not.exist");
    cy.reload();

    // Click the toast and visit the account page
    cy.contains("Setup Email").click({ force: true });
    cy.contains(
      "• Please enter your email to receive course and product updates.",
    );
    cy.reload();

    // Verify that the warning toast is gone, but email is still null
    cy.get("Setup Email").should("not.exist");
    cy.contains(
      "• Please enter your email to receive course and product updates.",
    );
  });
});

/** ===========================================================================
 * Test Helpers
 * ============================================================================
 */

/**
 * Check that the challenges appear complete in the navigation overlay.
 */
const checkNavigationOverlay = () => {
  click("navigation-menu-button");
  cy.get("#challenge-4-icon-COMPLETE").should("exist");
  cy.get("#challenge-5-icon-COMPLETE").should("exist");
  cy.get("#challenge-6-icon-COMPLETE").should("exist");
};

/**
 * Check the expected challenges are complete.
 */
const checkCourseState = () => {
  const WELCOME_REGEX = /Welcome, |Welcome!/g;
  cy.contains(WELCOME_REGEX);
  click("navigation-menu-button");
  click("module-navigation-0");
  click("challenge-navigation-3");

  goToNextChallenge();
  click("pw-run-code");
  cy.get("body").type("esc");
  checkTestResultStatus("Success!", 1);
  goToNextChallenge();
  click("pw-run-code");
  cy.get("body").type("esc");
  checkTestResultStatus("Success!", 2);
  click("pw-run-code");
  cy.get("body").type("esc");
  goToNextChallenge();
  checkTestResultStatus("Success!", 1);
};

/**
 * Helper to produce a random challenge index.
 */
const randomChallengeIndex = () => Math.round(Math.random() * 15);

/**
 * Helper to check the app URL remains unchanged after user signin.
 */
const checkUrlDuringUserRegistrationProcess = (
  sso: "facebook" | "google" | "github",
  challengeIndex: number,
) => {
  cy.visit(`${CLIENT_APP_URL}/home`);
  cy.wait(TIMEOUT);
  cy.url().should("include", "home");

  // Open the navigation menu and navigate to the first programming challenge:
  click("navigation-menu-button");
  click("module-navigation-2");
  click(`challenge-navigation-${challengeIndex}`);

  cy.wait(TIMEOUT);

  // Get url and check it is the same after reload
  cy.url().then((url) => {
    // Login
    click("login-signup-button");
    click(`${sso}-login`);

    cy.wait(TIMEOUT);
    cy.url().should("eq", url);

    cy.get("#account-menu-dropdown").trigger("mouseover");
    click("logout-link");
  });
};

const SOLUTIONS = {
  4: `
    let smaller: number = 500;
    let larger: number = 1000;
  `,
  5: `
    function addTwoNumbers(a: number, b: number) {
      return a + b;
    }

    function subtractTwoNumbers(a: number, b: number) {
      // Your code here
      return a - b;
    }
  `,
  6: `
    const list: number[] = [6, 8, 91, 17, 18, 22, 5, 3, 7];    
    let sum: number = 0;
    for (const n of list) {
      sum = sum + n;
    }
  `,
};
