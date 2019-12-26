import { someUtil } from "../tools/utils";

describe("Tools > Utils", () => {
  test("someUtil", () => {
    const result = someUtil("hi!");
    expect(result).toBe("hi!");
  });
});
