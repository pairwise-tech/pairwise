import { HOST } from "../support/utils";

describe("Workspace Loads", () => {
  it("Workspace loads and contains title Prototype X", () => {
    cy.visit(HOST);
    cy.contains("Prototype X");
  });

  it("Workspace navigation next|prev controls works", () => {
    const getChallengeId = (url: string) => {
      const index = url.indexOf("workspace/");
      const id = url.slice(index + 10);
      return id;
    };

    cy.visit(HOST);

    cy.wait(500); /* Wait for the workspace to load */
    cy.url().should("include", "workspace");

    let challengeId = "";

    const checkPrev = () => {
      cy.get("#prevButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
    };

    const checkNext = () => {
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
