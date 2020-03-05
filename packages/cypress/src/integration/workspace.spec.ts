import { CLIENT_APP_URL, TIMEOUT } from "../support/cypress-utils";

/** ===========================================================================
 * Workspace Tests
 * ----------------------------------------------------------------------------
 * Test various features of the workspace.
 * ============================================================================
 */

describe("Workspace and Challenge Navigation Works", () => {
  it("Workspace loads and contains title Pairwise", () => {
    cy.visit(CLIENT_APP_URL);
    cy.get("#product-title").contains("Pairwise");
  });

  it("Home route includes courses list", () => {
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.url().should("include", "home");
    cy.contains("Welcome to Pairwise!");
    cy.contains("Courses");
    cy.get("#course-link-0").contains("Fullstack TypeScript");
    cy.get("#course-link-0-start").click({ force: true });
    cy.url().should("include", "workspace");
  });

  it("Workspace navigation next|prev controls work", () => {
    const getChallengeId = (url: string) => {
      const index = url.indexOf("workspace/");
      const id = url.slice(index + 10);
      return id;
    };

    cy.visit(`${CLIENT_APP_URL}/workspace`);

    cy.wait(TIMEOUT);
    cy.url().should("include", "workspace");

    /* Open the navigation menu and navigate to the first programming challenge: */
    cy.get("#navigation-menu-button").click({ force: true });
    cy.get("#module-navigation-1").click({ force: true });
    cy.get("#challenge-navigation-0").click({ force: true });

    let challengeId = "";

    const checkPrev = () => {
      cy.wait(TIMEOUT);
      cy.get("#prevButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
    };

    const checkNext = () => {
      cy.wait(TIMEOUT);
      cy.get("#nextButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
    };

    checkNext();
    checkNext();
    checkNext();
    checkNext();
    checkNext();

    checkPrev();
    checkPrev();
    checkPrev();
    checkPrev();
    checkPrev();
  });
});

describe("Sandbox", () => {
  it("Sandbox should exist", () => {
    cy.visit(CLIENT_APP_URL);
    cy.get("#sandboxButton").click();
    cy.url().should("include", "/sandbox");

    cy.get("#sandboxButton").should("have.attr", "disabled");
    cy.get("#selectChallengeType").click();

    cy.contains("HTML/CSS");
    cy.contains("TypeScript");
    cy.contains("React");
  });
});
