import { HOST } from "../support/utils";

describe("Workspace and Challenge Navigation Works", () => {
  it("Workspace loads and contains title Prototype X", () => {
    cy.visit(HOST);
    cy.contains("Prototype X");
  });

  it("Workspace navigation next|prev controls work", () => {
    const getChallengeId = (url: string) => {
      const index = url.indexOf("workspace/");
      const id = url.slice(index + 10);
      return id;
    };

    cy.visit(HOST);

    /**
     * Wait for the workspace to load.
     *
     * For some reason this takes WAY longer when running cypress:run.
     *
     * TODO: Create some programmatic way to determine if the workspace
     * has loaded or not.
     */
    cy.wait(10000);
    cy.url().should("include", "workspace");

    let challengeId = "";

    const checkPrev = () => {
      cy.get("#prevButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
      cy.wait(50);
    };

    const checkNext = () => {
      cy.get("#nextButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
      cy.wait(50);
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
