import { HOST } from "../support/utils";

describe("Authentication Flows", () => {
  it("GitHub Account Creation, Profile, and Logout Work", () => {
    cy.visit(HOST);
    cy.wait(500);

    cy.get("#login-signup-button").click();
    cy.get("#github-login").click();

    cy.wait(500);
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
