const add = (a: number, b: number) => a + b;

describe("Demo Cypress Tests", () => {
  it("works", () => {
    const x: number = 42;
    expect(x).to.equal(42);
  });

  it("checks shape of an object", () => {
    const object = {
      age: 21,
      name: "Joe",
    };
    expect(object).to.have.all.keys("name", "age");
  });

  it("uses cy commands", () => {
    cy.wrap({}).should("deep.eq", {});
  });

  it("has Cypress object type definition", () => {
    expect(Cypress.version).to.be.a("string");
  });

  it("adds numbers", () => {
    expect(add(2, 3)).to.equal(5);
  });

  it("uses custom command cy.foo()", () => {
    cy.foo().should("be.equal", "foo");
  });
});
