import { CLIENT_APP_URL } from "../support/utils";

describe("Authentication Flows: signin, profile, and logout", () => {
  it("Facebook Authentication", () => {
    cy.visit(CLIENT_APP_URL);
    cy.wait(2500);

    cy.get("#login-signup-button").click({ force: true });
    cy.get("#facebook-login").click({ force: true });

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
  });

  it("GitHub Authentication", () => {
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
    cy.contains("Pairwise Home");

    cy.contains("Login or Signup");
    cy.url().should("include", "home");
  });

  it("Google Authentication", () => {
    cy.visit(CLIENT_APP_URL);
    cy.wait(2500);

    cy.get("#login-signup-button").click({ force: true });
    cy.get("#google-login").click({ force: true });

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
  });
});
