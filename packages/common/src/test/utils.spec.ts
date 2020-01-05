import { assertUnreachable } from "../tools/utils";

describe("Tools > Utils", () => {
  test("assertUnreachable", () => {
    expect(() => {
      // @ts-ignore
      assertUnreachable({ value: "some value " });
    }).toThrow();
  });
});
