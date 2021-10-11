import {
  Ok,
  Err,
  Some,
  None,
  unwrapOption,
  unwrapResult,
  IOption,
  IResult,
  matchResult,
  matchOption,
} from "../types/rust-types";

interface SomeData {
  flag: boolean;
  data: number[];
  description: string;
}

const SOME_DATA: SomeData = {
  flag: true,
  data: [1, 2, 3, 4, 5],
  description: "This is the data...",
};

const getResult = (value?: SomeData): IResult<SomeData, void> => {
  if (value !== undefined) {
    return Ok(value);
  } else {
    return Err(null);
  }
};

const getOption = (value?: SomeData): IOption<SomeData> => {
  if (value !== undefined) {
    return Some(value);
  } else {
    return None();
  }
};

describe("Rust Types", () => {
  test("unwrapResult function ok variant", () => {
    const result = getResult(SOME_DATA);
    const unwrapped = unwrapResult(result);
    expect(unwrapped).toEqual(SOME_DATA);
  });

  test("unwrapResult function error variant", () => {
    expect(() => unwrapResult(getResult())).toThrow();
  });

  test("unwrapOption function some variant", () => {
    const result = getOption(SOME_DATA);
    const unwrapped = unwrapOption(result);
    expect(unwrapped).toEqual(SOME_DATA);
  });

  test("unwrapOption function none variant", () => {
    expect(() => unwrapOption(getOption())).toThrow();
  });

  test("matchResult function ok variant", () => {
    const result = matchResult(getResult(SOME_DATA), {
      ok: (x) => {
        expect(x).toEqual(SOME_DATA);
        return x;
      },
      err: () => {
        throw new Error("Should not happen!");
      },
    });

    expect(result).toEqual(SOME_DATA);
  });

  test("matchResult function err variant", () => {
    const result = matchResult(getResult(), {
      ok: () => {
        throw new Error("Should not happen!");
      },
      err: () => "[expected-value]",
    });

    expect(result).toBe("[expected-value]");
  });

  test("matchOption function some variant", () => {
    const result = matchOption(getOption(SOME_DATA), {
      some: (x) => {
        expect(x).toEqual(SOME_DATA);
        return x;
      },
      none: () => {
        throw new Error("Should not happen!");
      },
    });

    expect(result).toEqual(SOME_DATA);
  });

  test("matchOption function none variant", () => {
    const result = matchOption(getOption(), {
      some: () => {
        throw new Error("Should not happen!");
      },
      none: () => "[expected-value]",
    });

    expect(result).toBe("[expected-value]");
  });
});
