import { NODE_ENV } from "tools/client-env";

describe("Placeholder test suite", () => {
  test("Placeholder test", () => {
    expect(NODE_ENV).toBe("test");
  });
});
