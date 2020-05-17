// Store the Jest-provided expect here since it's about to get overwritten.
//
// NOTE Because of the require file below and the global definitions TS thinks that
// `expect` has _already_ been overwitten, which is not true so we can just
// ignore and force the defintion as seen below.
// @ts-ignore See NOTE
const presume: jest.Expect = expect;

// Will overwrite a number of globals including `expect`. Using require becuase
// using `import` seems to hoist this causing presume to be defined after expect
// is already overwritten
require("./browser-test-lib");

test("Browser lib should define expect globally", () => {
  presume(expect).not.toBe(presume); // Function was overwritten
});

describe("Expectation matchers", () => {
  test("toBe", () => {
    presume(() => {
      expect("a").toBe("b");
      expect(1).toBe("1");
    }).toThrow();

    // When we expect something not to throw we can just use it directly in place of jest
    expect("a").toBe("a");
    expect(1).toBe(1);
    expect(null).toBe(null);
  });

  test("toEqual", () => {
    const can1 = {
      flavor: "grapefruit",
      ounces: 12,
    };
    const can2 = {
      flavor: "grapefruit",
      ounces: 12,
    };
    const nested1 = [{ a: "yes", b: { c: "maybe" } }, [[["deep"]]]];
    const nested2 = [{ a: "yes", b: { c: "maybe" } }, [[["deep"]]]];

    expect(can1).toEqual(can2);
    expect(can1).not.toBe(can2);
    expect(nested1).toEqual(nested2);
  });

  test("toBeGreaterThan", () => {
    expect(1).toBeGreaterThan(0);
    expect(1).not.toBeGreaterThan(2);
  });

  test("toBeGreaterThanOrEqual", () => {
    expect(1).toBeGreaterThanOrEqual(1);
    expect(1).toBeGreaterThanOrEqual(0);
    expect(1).not.toBeGreaterThanOrEqual(2);
  });

  test("toBeLessThan", () => {
    expect(1).toBeLessThan(2);
    expect(1).not.toBeLessThan(0);
  });

  test("toBeLessThanOrEqual", () => {
    expect(1).toBeLessThanOrEqual(1);
    expect(1).toBeLessThanOrEqual(2);
    expect(1).not.toBeLessThanOrEqual(0);
  });

  test("toMatch", () => {
    expect("grapefruits").not.toMatch(/^fruit/); // Regex
    expect("grapefruits").toMatch("fruit"); // String
  });

  test("toHaveProperty", () => {
    const nested = [{ a: "hi", b: { c: "maybe" } }, [[["deep"]]]];
    expect({ a: "yup" }).toHaveProperty("a"); // Simple
    expect({ a: "yup" }).toHaveProperty(["a"]); // Keypath
    expect({ a: "yup" }).toHaveProperty(["a"], "yup");
    expect(nested).toHaveProperty([0, "a"]);
    expect(nested).toHaveProperty([0, "a"], "hi");
    expect(nested).toHaveProperty([0, "b", "c"], "maybe");
  });

  test("toBeTruthy", () => {
    expect("1").toBeTruthy();
    expect({}).toBeTruthy();
    expect(1).toBeTruthy();
    expect([]).toBeTruthy();
    expect(true).toBeTruthy();
    expect(null).not.toBeTruthy();
    expect(false).not.toBeTruthy();
    expect("").not.toBeTruthy();
    expect(0).not.toBeTruthy();
  });

  test("toBeFalsy", () => {
    expect("1").not.toBeFalsy();
    expect({}).not.toBeFalsy();
    expect(1).not.toBeFalsy();
    expect([]).not.toBeFalsy();
    expect(true).not.toBeFalsy();
    expect(null).toBeFalsy();
    expect(false).toBeFalsy();
    expect("").toBeFalsy();
    expect(0).toBeFalsy();
  });

  test("toBeDefined", () => {
    expect("").toBeDefined();
    expect(false).toBeDefined();
    expect(0).toBeDefined();
    expect("hey").toBeDefined();
    expect(undefined).not.toBeDefined();
  });

  test("toContain", () => {
    const arr = ["a", "b", "c"];
    expect(arr).toContain("a");
    expect(arr).toContain("b");
    expect(arr).toContain("c");
    expect(arr).not.toContain("d");
    expect("hey you there").toContain("you");
  });

  test("toBeCloseTo", () => {
    // Should work with floats
    expect(0.2 + 0.1).toBeCloseTo(0.3, 5);
    expect(0.2 + 0.1).not.toBe(3);

    // Should of course work fine with ints
    expect(1 + 2).toBeCloseTo(3);
  });
});
