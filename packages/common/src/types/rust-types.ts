import { assertUnreachable } from "../tools/utils";

/** ===========================================================================
 * Option Type
 * ============================================================================
 */

export type IOption<T> = { some: true; value: T } | { some: false };

export const Some = <T>(value: T): IOption<T> => ({
  some: true,
  value,
});

export const None = (): IOption<never> => ({
  some: false,
});

export interface OptionMatcher<T, R1, R2> {
  some: (value: T) => R1;
  none: () => R2;
}

export const matchOption = <T, R1, R2>(
  x: IOption<T>,
  matcher: OptionMatcher<T, R1, R2>,
) => {
  if (x.some === true) {
    return matcher.some(x.value);
  } else if (x.some === false) {
    return matcher.none();
  } else {
    return assertUnreachable(x);
  }
};

export const unwrapOption = <T>(option: IOption<T>): T => {
  if (option.some === false) {
    throw new Error("Unwrapped option was actually empty!");
  }

  return option.value;
};

/** ===========================================================================
 * Result Type
 * ============================================================================
 */

export type IResult<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): IResult<T, never> => ({
  ok: true,
  value,
});

export const Err = <E>(error: E): IResult<never, E> => ({
  ok: false,
  error,
});

export interface ResultMatcher<T, E, R1, R2> {
  ok: (value: T) => R1;
  err: (error: E) => R2;
}

export const matchResult = <T, E, R1, R2>(
  x: IResult<T, E>,
  matcher: ResultMatcher<T, E, R1, R2>,
) => {
  if (x.ok === true) {
    return matcher.ok(x.value);
  } else if (x.ok === false) {
    return matcher.err(x.error);
  } else {
    return assertUnreachable(x);
  }
};

export const unwrapResult = <T, E>(result: IResult<T, E>): T => {
  if (result.ok === false) {
    throw new Error("Unwrapped result was actually an error variant!");
  }

  return result.value;
};
