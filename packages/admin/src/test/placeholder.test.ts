import { NODE_ENV } from "tools/admin-env";

describe("Placeholder test suite", () => {
  test("Placeholder test", () => {
    expect(NODE_ENV).toBe("test");
  });
});
