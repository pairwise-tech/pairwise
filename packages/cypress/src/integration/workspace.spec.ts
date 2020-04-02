import {
  CLIENT_APP_URL,
  TIMEOUT,
  getIframeBody,
  click,
} from "../support/cypress-utils";

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
    cy.contains("Content");

    // Hacky? This ensures the loading overlay is visible and then not. I.e. it finishes loading
    cy.get("#pw-loading-overlay").should("be.visible");
    cy.get("#pw-loading-overlay").should("not.be.visible");

    // These are currently the two courses we have
    cy.contains("Fullstack TypeScript Course");
    cy.contains("Pairwise Library");

    cy.get(".courseLinkContinue").click({ force: true });
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

  it("Sandbox should load when coming from non-workspace challenge", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace/yxZjmD0o`); // The "Welcome to pairwise" challenge (no workspace)
    cy.get("#pairwise-code-editor").should("not.exist");
    click("sandboxButton");
    click("selectChallengeType");
    click("challenge-type-markup");
    cy.get("#pairwise-code-editor").type(
      "<h1 class='just-typed-this'>Testing</h1>",
    );

    cy.wait(TIMEOUT);

    getIframeBody()
      .find(".just-typed-this")
      .should("include.text", `Testing`);
  });
});

describe("Success Modal", () => {
  it("Should show the modal when and only when the run button is clicked", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace/9scykDold`); // The "Add a h1 Tag in HTML"
    cy.contains("Incomplete");
    click("pw-run-code");
    cy.get("#gs-card").should("not.exist");

    cy.get("#pairwise-code-editor").type("<h1>Hello!</h1>");
    cy.get("#gs-card").should("not.exist");

    click("pw-run-code");
    cy.get("#gs-card").should("exist");
  });

  it("Should close when the close button is clicked", () => {
    click("gs-card-close");
    cy.get("#gs-card").should("not.exist");
  });
});
