import { CLIENT_APP_URL } from "../support/utils";

describe("Workspace and Challenge Navigation Works", () => {
  it("Workspace loads and contains title Prototype X", () => {
    cy.visit(CLIENT_APP_URL);
    cy.get("#product-title").contains("Pairwise");
  });

  it("Workspace navigation next|prev controls work", () => {
    const getChallengeId = (url: string) => {
      const index = url.indexOf("workspace/");
      const id = url.slice(index + 10);
      return id;
    };

    cy.visit(CLIENT_APP_URL);

    cy.wait(2500);
    cy.url().should("include", "workspace");

    let challengeId = "";

    const checkPrev = () => {
      cy.get("#prevButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
      cy.wait(250);
    };

    const checkNext = () => {
      cy.get("#nextButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
      cy.wait(250);
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
