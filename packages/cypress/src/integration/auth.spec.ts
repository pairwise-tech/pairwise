import { CLIENT_APP_URL } from "../support/utils";

describe("Authentication Flows", () => {
  it("GitHub Account Creation, Profile, and Logout Work", () => {
    cy.visit(CLIENT_APP_URL);
    cy.wait(2500);

    cy.get("#login-signup-button").click({ force: true });
    cy.get("#github-login").click({ force: true });

    cy.wait(2500);
    cy.contains("Welcome, ");

    cy.get("#account-menu-dropdown").trigger("mouseover");
    cy.get("#profile-link").click({ force: true });
    cy.contains("User Profile:");

    cy.get("#account-menu-dropdown").trigger("mouseover");
    cy.get("#logout-link").click({ force: true });
    cy.contains("Prototype X Home");

    cy.contains("Login or Signup");
    cy.url().should("include", "home");
  });
});
