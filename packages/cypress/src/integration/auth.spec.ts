import { CLIENT_APP_URL } from "../support/utils";

describe("Authentication Flows: signin, profile, and logout", () => {
  beforeEach(() => {
    cy.visit(CLIENT_APP_URL);
    cy.wait(2500);
    cy.get("#login-signup-button").click({ force: true });
  });

  it("Facebook Authentication", () => {
    loginByLinkId("#facebook-login");
    assertAuthenticatedFlowWorks();
  });

  it("GitHub Authentication", () => {
    loginByLinkId("#github-login");
    assertAuthenticatedFlowWorks();
  });

  it("Google Authentication", () => {
    loginByLinkId("#google-login");
    assertAuthenticatedFlowWorks();
  });
});

/**
 * Helper to test the authentication features work after login occurs.
 */
const assertAuthenticatedFlowWorks = () => {
  cy.wait(2500);
  cy.contains("Welcome, ");

  cy.get("#account-menu-dropdown").trigger("mouseover");
  cy.get("#profile-link").click({ force: true });
  cy.contains("User Profile:");

  cy.get("#account-menu-dropdown").trigger("mouseover");
  cy.get("#logout-link").click({ force: true });
  cy.contains("Pairwise Home");

  cy.contains("Login or Signup");
  cy.url().should("include", "home");
};

/**
 * Helper to click the appropriate SSO login link.
 */
const loginByLinkId = (id: string) => {
  cy.get(id).click({ force: true });
};
