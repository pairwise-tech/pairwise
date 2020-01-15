import { CLIENT_APP_URL, TIMEOUT } from "../support/utils";

/**
 * This just covers basic functionality, but the test works! It tests that
 * a user can work on challenges, then sign up and create an account, and
 * their updates are persisted successfully to their new account, including
 * after page reload.
 */
describe("Account Creation Flow", () => {
  type TestStatus = "Success!" | "Incomplete..." | string;
  const checkTestStatus = (status: TestStatus, index: number) => {
    const id = `#test-result-status-${index}`;
    cy.get(id).contains(status);
  };

  const checkTestResultStatus = (
    expectedStatus: TestStatus,
    numberOfResults: number = 1,
  ) => {
    /* Whatever! */
    for (let i = 0; i < numberOfResults; i++) {
      checkTestStatus(expectedStatus, i);
    }
  };

  const goToNext = () => {
    cy.wait(TIMEOUT);
    cy.get("#nextButton").click({ force: true });
    cy.wait(TIMEOUT);
  };

  it("Creating an account persists pre-login updates correctly", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace`);
    cy.wait(TIMEOUT);
    cy.url().should("include", "workspace");

    /* Open the navigation menu and navigate to the first programming challenge: */
    cy.get("#navigation-menu-button").click({ force: true });
    cy.get("#module-navigation-1").click({ force: true });
    cy.get("#challenge-navigation-2").click({ force: true });

    checkTestResultStatus("Incomplete...");
    cy.get(".view-lines").type("<h1>Hello!</h1>");
    checkTestResultStatus("Success!");

    goToNext();

    checkTestStatus("Success!", 0);
    checkTestStatus("Incomplete...", 1);
    checkTestStatus("Incomplete...", 2);
    checkTestStatus("Incomplete...", 3);
    checkTestStatus("Incomplete...", 4);
    checkTestStatus("Incomplete...", 5);
    cy.get(".view-lines").type(
      "<h2>2</h2><h3>3</h3><h4>4</h4><h5>5</h5><h6>6</h6>",
    );
    checkTestResultStatus("Success!", 6);

    goToNext();
    checkTestResultStatus("Incomplete...", 3);
    cy.get(".view-lines").type("<p>This text is: <b>bold!</b></p>");
    checkTestResultStatus("Success!", 3);
    goToNext();

    cy.get("#login-signup-button").click({ force: true });
    cy.get("#facebook-login").click({ force: true });

    cy.wait(5000); /* Wait! */

    const checkCourseState = () => {
      cy.contains("Welcome, ");
      cy.get("#navigation-menu-button").click({ force: true });
      cy.get("#module-navigation-1").click({ force: true });
      cy.get("#challenge-navigation-1").click({ force: true });

      goToNext();
      cy.get("#test-result-status-0").contains("Success!");
      goToNext();
      checkTestResultStatus("Success!", 6);
      goToNext();
      checkTestResultStatus("Success!", 3);
    };

    checkCourseState();
    cy.reload();
    cy.wait(TIMEOUT);
    checkCourseState();
  });
});
