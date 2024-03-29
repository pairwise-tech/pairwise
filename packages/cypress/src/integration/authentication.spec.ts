import { CLIENT_APP_URL, TIMEOUT, click, type } from "../support/cypress-utils";

/** ===========================================================================
 * Auth Tests
 * ----------------------------------------------------------------------------
 * Test the authentication flows in the app.
 * ============================================================================
 */

describe("Authentication Flows: signin, profile, and logout", () => {
  beforeEach(() => {
    cy.visit(CLIENT_APP_URL);
    cy.wait(TIMEOUT);
    click("login-signup-button");
  });

  it("Facebook Authentication", () => {
    click("facebook-login");
    assertAuthenticatedFlowWorks();
  });

  it("GitHub Authentication", () => {
    click("github-login");
    assertAuthenticatedFlowWorks();
  });

  it("Google Authentication", () => {
    click("google-login");
    assertAuthenticatedFlowWorks();
  });

  it("Account page works", () => {
    click("github-login");
    cy.get("#account-menu-dropdown").trigger("mouseover");
    click("account-link");
    cy.contains("Account");

    // Generate a unique username
    const username = String(Math.random()).replace(".", "").slice(0, 12);

    /* Don't ask */
    cy.wait(TIMEOUT);

    click("edit-profile-button");
    type("edit-input-given-name", "Linus");
    type("edit-input-family-name", "Torvalds");
    type("edit-input-username", username);
    click("save-profile-button");

    /* Let the updates occur */
    cy.wait(TIMEOUT);

    cy.get("#profile-given-name").contains("Linus");
    cy.get("#profile-family-name").contains("Torvalds");
    cy.get("#profile-username").contains(username);

    /* Check the updates persist after page reload */
    cy.reload();
    cy.get("#profile-given-name").contains("Linus");
    cy.get("#profile-family-name").contains("Torvalds");
    cy.get("#profile-username").contains(username);
  });
});

/**
 * Helper to test the authentication features work after login occurs.
 */
const assertAuthenticatedFlowWorks = () => {
  const WELCOME_REGEX = /Welcome, |Welcome!/g;

  cy.wait(TIMEOUT);
  cy.contains(WELCOME_REGEX);

  cy.get("#account-menu-dropdown").trigger("mouseover");
  click("account-link");
  cy.contains("Account");

  cy.reload();
  cy.wait(TIMEOUT);
  cy.contains(WELCOME_REGEX);

  cy.get("#account-menu-dropdown").trigger("mouseover");
  click("logout-link");

  // Wait to allow the logout process to fully complete
  cy.wait(500);

  cy.contains("Login or Signup");
  cy.url().should("include", "home");

  cy.reload();
  cy.contains("Login or Signup");
  cy.url().should("include", "home");
};
