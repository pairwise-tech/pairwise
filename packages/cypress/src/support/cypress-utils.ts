/** ===========================================================================
 * Shared utils and constants for Cypress tests
 * ============================================================================
 */

export const CLIENT_APP_URL = Cypress.env("CLIENT_APP_URL");

export const EXTERNAL_SERVICES_URL = Cypress.env("EXTERNAL_SERVICES_URL");

export const TIMEOUT = Cypress.env("TIMEOUT");

/**
 * Convert an id string to an id identifier which includes a #.
 *
 * NOTE: We have decided to exclusively use HTML `id` attributes
 * to identify Cypress test elements. We realize this is not
 * exactly a standard practice, but we chose to for 2 reasons:
 *
 * 1) id is a very short and easy attribute to add in JSX.
 * 2) id should not change, and we should very rarely need it
 * for other reasons, e.g. targeting or manipulating DOM elements
 * directly. This means it should be stable for use in tests.
 *
 * Because of this, we can assume the majority of selectors in
 * Cypress tests are using HTML ids.
 */
const toId = (id: string) => `#${id}`;

// Click an element by it's id. Pass in an id without the #.
export const click = (id: string) => {
  cy.get(toId(id)).click({ force: true });
};

// Find an element by id and type some text into it.
export const type = (id: string, text: string) => {
  cy.get(toId(id)).type(text);
};

/**
 * Enter text in the code editor, targeting it with a specific
 * class.
 *
 * It's really hard to type into the Monaco editor correctly!
 *
 * https://stackoverflow.com/questions/56617522/testing-monaco-editor-with-cypress
 *
 * We first select all of the editor content and then clear it in a platform
 * agnostic way. Then, we update the input value to be the provided text
 * content. Typing the content directly, e.g. with .type, will cause Monaco
 * to start to add auto-completions which disrupt the intended text result. To
 * avoid this we just update the entire value one time.
 */
export const typeTextInCodeEditor = (text: string, shouldClear = true) => {
  if (shouldClear) {
    const clearEditorCommand =
      Cypress.platform === "darwin"
        ? "{cmd}a{backspace}"
        : "{ctrl}a{backspace}";

    cy.get(".monaco-editor textarea:first")
      .type(clearEditorCommand)
      .invoke("val", text)
      .trigger("input");
  } else {
    cy.get(".monaco-editor textarea:first").type("text");
  }
};

// Asset some element with an id contains some text.
export const elementContains = (id: string, text: string) => {
  cy.get(toId(id)).contains(text);
};

// https://www.cypress.io/blog/2020/02/12/working-with-iframes-in-cypress/
export const getIframeBody = () => {
  const WORKSPACE_IFRAME_ID = "#iframe";

  return (
    cy
      .get(WORKSPACE_IFRAME_ID)
      // Cypress yields jQuery element, which has the real DOM element under
      // property "0".  From the real DOM iframe element we can get the
      // "document" element, it is stored in "contentDocument" property Cypress
      // "its" command can access deep properties using dot notation
      // https://on.cypress.io/its
      // @ts-ignore TS Doesn't understand this one, but it's valid
      .its("0.contentDocument")
      .should("exist")
      .its("body") // Get the document. Automatically retries until body is loaded
      .should("not.be.undefined") // wraps "body" DOM element to allow chaining more Cypress commands, like .find(...)
      .then(cy.wrap)
  );
};

/**
 * Helper to go to the next challenge.
 */
export const goToNextChallenge = () => {
  cy.wait(TIMEOUT);
  cy.get("#nextButton").click({ force: true });
  cy.wait(TIMEOUT);
};

type TestStatus = "Success!" | "Incomplete..." | string;

/**
 * Helper to check test status.
 */
export const checkTestStatus = (status: TestStatus, index: number) => {
  const id = `#test-result-status-${index}`;
  cy.get(id).contains(status);
};

/**
 * Check the status of the test results.
 */
export const checkTestResultStatus = (
  expectedStatus: TestStatus,
  numberOfResults: number = 1,
) => {
  for (let i = 0; i < numberOfResults; i++) {
    checkTestStatus(expectedStatus, i);
  }
};

/**
 * Handle the process of purchasing a course for a user. This function
 * visits the account page (user must be logged in), gets the user email,
 * and then dispatches a request to the admin API to purchase the course
 * for this user. This unfortunately occurs instead of walking through
 * the actual checkout process because:
 *
 * -> https://github.com/cypress-io/cypress/issues/944
 * Cypress does not support running tests which visit different domains,
 * therefore we cannot actually walk through the entire payments flow and
 * submit the payment to Stripe. This would be possible using the Stripe CLI
 * in test mode, however, Cypress makes this impossible. Instead of this,
 * The test relies on an admin API to actually generate the course payment
 * for the user (that's damn right!). This occurs by calling an
 * external-services API which then handles the admin operation. Aside from
 * that, the test does guarantee that Pairwise handles the correct behavior
 * for course payments and locked content.
 */
export const purchaseCourseForUser = () => {
  // Go to the account page
  cy.get("#account-menu-dropdown").trigger("mouseover");
  click("account-link");

  // Find the user email and dispatch a request to the admin API to
  // purchase a course for this user. See the above comments for an
  // explanation of this egregiousness.
  let dispatchedAdminRequest = false;
  cy.get("#user-email")
    .invoke("text")
    .then(email => {
      // Only dispatch a single request
      if (!dispatchedAdminRequest) {
        dispatchedAdminRequest = true;
        const body = { email };
        const EXTERNAL_SERVICES_ADMIN_PAYMENT_URL = `${EXTERNAL_SERVICES_URL}/admin/purchase-course`;

        // You better use cy.request for this and not any other HTTP library
        cy.request("POST", EXTERNAL_SERVICES_ADMIN_PAYMENT_URL, body).should(
          response => {
            // Fail immediately if the response is bad so it's clear why
            // the test failed
            if (response.body !== "OK") {
              throw new Error(
                `Invalid response received from external-services request, url used: ${EXTERNAL_SERVICES_ADMIN_PAYMENT_URL}`,
              );
            }
          },
        );
      }
    });

  // Wait!
  cy.wait(TIMEOUT);

  // Reload the page.
  cy.reload();
};
