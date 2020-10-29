/* eslint-disable */
import { buildPreviewTestResultsFromCode } from "tools/test-utils";

describe("test test-utils.ts functions", () => {
  test("buildPreviewTestResultsFromCode successfully builds preview test cases for synchronous test code", () => {
    const testCode =
      // tslint:disable-next-line
      'test("A function `everyNth` should be defined.", () => {\n  expect(everyNth).toBeDefined();\n  expect(typeof everyNth === "function").toBe(true);\n});\n\ntest("`everyNth` should return `[]` given the input `[1,2,3,4]` and `7`.", () => {\n  expect(everyNth([1, 2, 3, 4], 7)).toEqual([]);\n});\n\ntest("`everyNth` should return `[]` given the input `[]` and `7`.", () => {\n  expect(everyNth([], 1)).toEqual([]);\n});\n\ntest("`everyNth` should return `[3,6,9]` given the input `[1,2,3,4,5,6,7,8,9,10]` and `3`.", () => {\n  expect(everyNth([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)).toEqual([3, 6, 9]);\n});\n\ntest("`everyNth` should return `[5]` given the input `[1,2,3,4,5]` and `5`.", () => {\n  expect(everyNth([1, 2, 3, 4, 5], 5)).toEqual([5]);\n});\n\ntest("`everyNth` should return `[1,2,3,4,5,6,7,8]` given the input `[1,2,3,4,5,6,7,8]` and `1`.", () => {\n  expect(everyNth([1, 2, 3, 4, 5, 6, 7, 8], 1)).toEqual([\n    1,\n    2,\n    3,\n    4,\n    5,\n    6,\n    7,\n    8,\n  ]);\n});\n\ntest("`everyNth` should return `[10]` given the input `[1,2,3,4,5,6,7,8,9,10]` and `10`.", () => {\n  expect(everyNth([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10)).toEqual([10]);\n});\n';
    const result = buildPreviewTestResultsFromCode(testCode);
    expect(result).toMatchSnapshot();
  });

  test("buildPreviewTestResultsFromCode successfully builds preview test cases for asynchronous test code", () => {
    const testCode =
      // tslint:disable-next-line
      'test("The `SpaceX` class should be defined.", () => {\n  const x = new SpaceX();\n  expect(x).toBeDefined();\n});\n\ntest("The `SpaceX` class should implement the `SpaceXClass` interface and contain all of its methods.", () => {\n  const x = new SpaceX();\n  expect(typeof x.getCrew).toBe("function");\n  expect(typeof x.getLaunchpads).toBe("function");\n  expect(typeof x.getLandpads).toBe("function");\n  expect(typeof x.getRockets).toBe("function");\n  expect(typeof x.getShips).toBe("function");\n  expect(typeof x.getStarlink).toBe("function");\n});\n\nconst __fetchHelper = async (path) => {\n  const response = await fetch(`https://api.spacexdata.com/v4/${path}`);\n  const data = await response.json();\n  return data;\n};\n\nconst __compareHelper = (a, b) => {\n  expect(Object.keys(a)).toEqual(Object.keys(b));\n}\n\ntest("The `getCrew` method should return the data from call the `/crew` endpoint.", async () => {\n  const expected = await __fetchHelper("crew");\n  const x = new SpaceX();\n  const result = await x.getCrew();\n  __compareHelper(expected, result);\n});\n\ntest("The `getLaunchpads` method should return the data from call the `/launchpads` endpoint.", async () => {\n  const expected = await __fetchHelper("launchpads");\n  const x = new SpaceX();\n  const result = await x.getLaunchpads();\n  __compareHelper(expected, result);\n});\n\ntest("The `getLandpads` method should return the data from call the `/landpads` endpoint.", async () => {\n  const expected = await __fetchHelper("landpads");\n  const x = new SpaceX();\n  const result = await x.getLandpads();\n  __compareHelper(expected, result);\n});\n\ntest("The `getRockets` method should return the data from call the `/rockets` endpoint.", async () => {\n  const expected = await __fetchHelper("rockets");\n  const x = new SpaceX();\n  const result = await x.getRockets();\n  __compareHelper(expected, result);\n});\n\ntest("The `getShips` method should return the data from call the `/ships` endpoint.", async () => {\n  const expected = await __fetchHelper("ships");\n  const x = new SpaceX();\n  const result = await x.getShips();\n  __compareHelper(expected, result);\n});\n\ntest("The `getStarlink` method should return the data from call the `/starlink` endpoint.", async () => {\n  const expected = await __fetchHelper("starlink");\n  const x = new SpaceX();\n  const result = await x.getStarlink();\n  __compareHelper(expected, result);\n});\n';
    const result = buildPreviewTestResultsFromCode(testCode);
    expect(result).toMatchSnapshot();
  });

  test("buildPreviewTestResultsFromCode successfully builds preview test cases for one-liner tests", () => {
    const testCode =
      // tslint:disable-next-line
      'test("The log message text in the `setTimeout` should change `1` to `3`.", async () => { const result = await checkBoxAsync(__secret_log_box, `["You will see me after a 3 second delay!"]`, 3500); expect(result).toBeTruthy();});\n\ntest("The `setTimeout` delay should be changed from `1000` milliseconds to `3000` milliseconds.", async () => { expect(__user_code_string__.includes(3000)).toBeTruthy(); const result = await checkBoxAsync(__secret_log_box, `["You will see me after a 3 second delay!"]`, 2000); expect(result).toBeFalsy(); });';
    const result = buildPreviewTestResultsFromCode(testCode);
    expect(result).toMatchSnapshot();
  });

  test("buildPreviewTestResultsFromCode returns an error if testCode does not match regex", () => {
    const testCode = "notest";
    const result = buildPreviewTestResultsFromCode(testCode);
    expect(result).toMatchSnapshot();
  });

  test("buildPreviewTestResultsFromCode handles escaped quotes correctly", () => {
    // tslint:disable-next-line
    const testCode = 'test("Hey there \\" you are amazing", () => {...})';
    const result = buildPreviewTestResultsFromCode(testCode);
    expect(result).toMatchSnapshot();
  });

  test("buildPreviewTestResultsFromCode handles single quotes correctly", () => {
    // tslint:disable-next-line
    const testCode =
      "test('This test case uses single quotes...', () => {...})'";
    const result = buildPreviewTestResultsFromCode(testCode);
    expect(result).toMatchSnapshot();
  });
});
