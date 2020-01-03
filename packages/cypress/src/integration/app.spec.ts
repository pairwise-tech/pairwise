import { HOST } from "../support/utils";

describe("Workspace Loads", () => {
  it("tests our example site", () => {
    cy.visit(HOST);
    cy.contains("Prototype X");
  });
});
