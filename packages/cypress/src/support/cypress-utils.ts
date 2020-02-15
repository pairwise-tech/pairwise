/** ===========================================================================
 * Shared utils and constants for Cypress tests
 * ============================================================================
 */

export const CLIENT_APP_URL = Cypress.env("CLIENT_APP_URL");

export const TIMEOUT = Cypress.env("TIMEOUT");

const toId = (id: string) => `#${id}`;

// Click an element by it's id. Pass in an id without the #.
export const click = (id: string) => {
  cy.get(toId(id)).click({ force: true });
};

// Find an element by id and type some text into it.
export const type = (id: string, text: string) => {
  cy.get(toId(id)).type(text);
};

// Asset some element with an id contains some text.
export const elementContains = (id: string, text: string) => {
  cy.get(toId(id)).contains(text);
};
