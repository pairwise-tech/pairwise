const assertUnreachable = (x: never) => {
  throw new Error(`Should never receive this value: ${JSON.stringify(x)}`);
};

type IOption<T> = { some: true; value: T } | { some: false };

const Some = <T>(value: T): IOption<T> => ({
  some: true,
  value,
});

const None = (): IOption<never> => ({
  some: false,
});

interface OptionMatcher<T> {
  some: (value: T) => void;
  none: () => void;
}

const matchOption = <T>(x: IOption<T>, matcher: OptionMatcher<T>) => {
  if (x.some === true) {
    return matcher.some(x.value);
  } else if (x.some === false) {
    return matcher.none();
  } else {
    return assertUnreachable(x);
  }
};

export type IResult<T, E> = { ok: true; value: T } | { ok: false; error: E };

const Ok = <T>(value: T): IResult<T, never> => {
  const result: IResult<T, never> = {
    ok: true,
    value,
  };

  return result;
};

const Err = <E>(error: E): IResult<never, E> => {
  const err: IResult<never, E> = {
    ok: false,
    error,
  };

  return err;
};

interface Matcher<T, E> {
  ok: (value: T) => void;
  err: (error: E) => void;
}

const match = <T, E>(x: IResult<T, E>, matcher: Matcher<T, E>) => {
  if (x.ok === true) {
    return matcher.ok(x.value);
  } else if (x.ok === false) {
    return matcher.err(x.error);
  } else {
    return assertUnreachable(x);
  }
};

const matchResult = <T, E>(
  x: IResult<T, E>,
  ok: (value: T) => void,
  err: (error: E) => void,
) => {
  if (x.ok === true) {
    return ok(x.value);
  } else if (x.ok === false) {
    return err(x.error);
  } else {
    return assertUnreachable(x);
  }
};

const checkResult = <T, E>(x: IResult<T, E>) => {
  if (x.ok === true) {
    console.log("Is Ok!");
    return;
  } else if (x.ok === false) {
    console.log("Is Err!");
    return;
  } else {
    return assertUnreachable(x);
  }
};

// Might throw an error
const fetchAPI = async () => {
  try {
    return Ok({ data: [1, 2, 3] });
  } catch (err) {
    return Err("Failed to fetch.");
  }
};

const handleResult = async () => {
  const result = await fetchAPI();
  match(result, {
    ok: (v) => console.log(v),
    err: (e) => console.log(e),
  });
};
