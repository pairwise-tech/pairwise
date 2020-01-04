import { HOST } from "../support/utils";

describe("GitHub Account Creation Works", () => {
  it("Workspace navigation next|prev controls works", () => {
    cy.visit(HOST);
    cy.wait(500);

    cy.get("#login-signup-button").click();
    cy.get("#github-login").click();

    cy.wait(500);
    cy.contains("Welcome, ");
  });
});
