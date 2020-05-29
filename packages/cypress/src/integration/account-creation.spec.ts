import {
  CLIENT_APP_URL,
  TIMEOUT,
  goToNextChallenge,
  typeTextInCodeEditor,
  elementContains,
  click,
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
  it("Creating an account persists pre-login updates correctly", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace`);
    cy.wait(TIMEOUT);
    cy.url().should("include", "workspace");

    /* Open the navigation menu and navigate to the first programming challenge: */
    click("navigation-menu-button");
    click("module-navigation-1");
    click("challenge-navigation-2");

    checkTestResultStatus("Incomplete...");
    typeTextInCodeEditor("<h1>Hello!</h1>");
    checkTestResultStatus("Success!");

    goToNextChallenge();

    checkTestStatus("Success!", 0);
    checkTestStatus("Incomplete...", 1);
    checkTestStatus("Incomplete...", 2);
    checkTestStatus("Incomplete...", 3);
    checkTestStatus("Incomplete...", 4);
    checkTestStatus("Incomplete...", 5);
    typeTextInCodeEditor("<h2>2</h2><h3>3</h3><h4>4</h4><h5>5</h5><h6>6</h6>");
    checkTestResultStatus("Success!", 6);

    goToNextChallenge();
    checkTestResultStatus("Incomplete...", 3);
    typeTextInCodeEditor("<p>This text is: <b>bold!</b></p>");
    checkTestResultStatus("Success!", 3);
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

  it("Creating an account redirects to the original workspace URL after registration success", () => {
    // Use Facebook signin
    checkUrlDuringUserRegistrationProcess("facebook", randomChallengeIndex());
    // Use Google signin
    checkUrlDuringUserRegistrationProcess("google", randomChallengeIndex());
    // Use GitHub signin
    checkUrlDuringUserRegistrationProcess("github", randomChallengeIndex());
  });

  it("User registration with no email shows a prompt to add email, but only after reload and only one time", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace`);
    cy.wait(TIMEOUT);
    cy.url().should("include", "workspace");

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
      "* Please enter your email to receive course and product updates.",
    );
    cy.reload();

    // Verify that the warning toast is gone, but email is still null
    cy.get("Setup Email").should("not.exist");
    cy.contains(
      "* Please enter your email to receive course and product updates.",
    );
  });
});

/** ===========================================================================
 * Test Helpers
 * ============================================================================
 */

type TestStatus = "Success!" | "Incomplete..." | string;

/**
 * Helper to check test status.
 */
const checkTestStatus = (status: TestStatus, index: number) => {
  const id = `#test-result-status-${index}`;
  cy.get(id).contains(status);
};

/**
 * Check the status of the test results.
 */
const checkTestResultStatus = (
  expectedStatus: TestStatus,
  numberOfResults: number = 1,
) => {
  for (let i = 0; i < numberOfResults; i++) {
    checkTestStatus(expectedStatus, i);
  }
};

/**
 * Check that the challenges appear complete in the navigation overlay.
 */
const checkNavigationOverlay = () => {
  click("navigation-menu-button");
  cy.get("#challenge-2-icon-COMPLETE").should("exist");
  cy.get("#challenge-3-icon-COMPLETE").should("exist");
  cy.get("#challenge-4-icon-COMPLETE").should("exist");
};

/**
 * Check the expected challenges are complete.
 */
const checkCourseState = () => {
  const WELCOME_REGEX = /Welcome, |Welcome!/g;
  cy.contains(WELCOME_REGEX);
  click("navigation-menu-button");
  click("module-navigation-1");
  click("challenge-navigation-1");

  goToNextChallenge();
  elementContains("test-result-status-0", "Success!");
  goToNextChallenge();
  checkTestResultStatus("Success!", 6);
  goToNextChallenge();
  checkTestResultStatus("Success!", 3);
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
  cy.visit(`${CLIENT_APP_URL}/workspace`);
  cy.wait(TIMEOUT);
  cy.url().should("include", "workspace");

  // Open the navigation menu and navigate to the first programming challenge:
  click("navigation-menu-button");
  click("module-navigation-2");
  click(`challenge-navigation-${challengeIndex}`);

  // Get url and check it is the same after reload
  const url = cy.url();

  // Login
  click("login-signup-button");
  click(`${sso}-login`);

  cy.wait(1500);
  cy.url().should("be", url);

  cy.get("#account-menu-dropdown").trigger("mouseover");
  click("logout-link");
};
