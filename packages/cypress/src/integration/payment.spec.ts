import { click, TIMEOUT, CLIENT_APP_URL, type } from "../support/cypress-utils";

/** ===========================================================================
 * Auth Tests
 * ----------------------------------------------------------------------------
 * Test the authentication flows in the app.
 * ============================================================================
 */

// Garbage! https://github.com/cypress-io/cypress/issues/944
describe("Payment Course Flow: A user can purchase a course and unlock it's content", () => {
  it("Fullstack TypeScript Course Payment", () => {
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.wait(TIMEOUT);

    click("course-link-0-purchase");
    click("github-login");
    cy.wait(TIMEOUT);
  });
});
