// Store the Jest-provided expect here since it's about to get overwritten
const presume = expect;

// Will overwrite a number of globals including `expect`. Using require becuase
// using `import` seems to hoist this causing presume to be defined after expect
// is already overwritten
require("./browser-test-lib");

test("Browser lib should define expect globally", () => {
  presume(expect).not.toBe(presume); // Function was overwritten
});

test("toBe", () => {
  presume(() => {
    expect("a").toBe("b");
    expect(1).toBe("1");
  }).toThrow();
  presume(() => {
    expect("a").toBe("a");
    expect(1).toBe(1);
    expect(null).toBe(null);
  }).not.toThrow();
});

test.todo("toEqual");
test.todo("toBeGreaterThan");
test.todo("toBeGreaterThanOrEqual");
test.todo("toBeLessThan");
test.todo("toBeLessThanOrEqual");
test.todo("toMatch");
test.todo("toHaveProperty");
test.todo("toHaveProperty");
test.todo("toBeTruthy");
test.todo("toBeFalsy");
test.todo("toBeDefined");
test.todo("toContain");
