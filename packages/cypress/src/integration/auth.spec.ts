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

  it("Account page works", () => {
    loginByLinkId("#facebook-login");
    cy.get("#account-menu-dropdown").trigger("mouseover");
    cy.get("#account-link").click({ force: true });
    cy.contains("Account");

    cy.get("#edit-profile-button").click({ force: true });
    cy.get("#edit-input-given-name").type("Linus");
    cy.get("#edit-input-family-name").type("Torvalds");
    cy.get("#edit-input-display-name").type("Linus Torvalds");
    cy.get("#save-profile-button").click({ force: true });

    /* Let the updates occur */
    cy.wait(2000);

    cy.get("#profile-given-name").contains("Linus");
    cy.get("#profile-family-name").contains("Torvalds");
    cy.get("#profile-display-name").contains("Linus Torvalds");

    /* Check the updates persist after page reload */
    cy.reload();
    cy.get("#profile-given-name").contains("Linus");
    cy.get("#profile-family-name").contains("Torvalds");
    cy.get("#profile-display-name").contains("Linus Torvalds");
  });
});

/**
 * Helper to test the authentication features work after login occurs.
 */
const assertAuthenticatedFlowWorks = () => {
  cy.wait(2500);
  cy.contains("Welcome, ");

  cy.get("#account-menu-dropdown").trigger("mouseover");
  cy.get("#account-link").click({ force: true });
  cy.contains("Account");

  cy.reload();
  cy.wait(500);
  cy.contains("Welcome, ");

  cy.get("#account-menu-dropdown").trigger("mouseover");
  cy.get("#logout-link").click({ force: true });

  cy.contains("Login or Signup");
  cy.url().should("include", "home");

  cy.reload();
  cy.contains("Login or Signup");
  cy.url().should("include", "home");
};

/**
 * Helper to click the appropriate SSO login link.
 */
const loginByLinkId = (id: string) => {
  cy.get(id).click({ force: true });
};
