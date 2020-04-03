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

const MONACO_TEXT_ELEMENT_IDENTIFIER = ".view-lines";

/**
 * Enter text in the code editor, targeting it with a specific
 * class.
 */
export const typeTextInCodeEditor = (text: string) => {
  cy.get(MONACO_TEXT_ELEMENT_IDENTIFIER).type(text);
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
