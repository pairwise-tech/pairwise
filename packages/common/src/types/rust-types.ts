import { assertUnreachable } from "../tools/utils";

/** ===========================================================================
 * Option Type
 * ============================================================================
 */

export type Option<T> = { some: true; value: T } | { some: false };

export const Some = <T>(value: T): Option<T> => ({
  some: true,
  value,
});

export const None = (): Option<never> => ({
  some: false,
});

export interface OptionMatcher<T, R1, R2> {
  some: (value: T) => R1;
  none: () => R2;
}

export const matchOption = <T, R1, R2>(
  x: Option<T>,
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

export const unwrapOption = <T>(option: Option<T>): T => {
  if (option.some === false) {
    throw new Error("Unwrapped option was actually empty!");
  }

  return option.value;
};

/** ===========================================================================
 * Result Type
 * ============================================================================
 */

export type IOk<T> = { ok: true; value: T };
export type IErr<E> = { ok: false; error: E };
export type Result<T, E> = IOk<T> | IErr<E>;

export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export interface ResultMatcher<T, E, R1, R2> {
  ok: (value: T) => R1;
  err: (error: E) => R2;
}

export const matchResult = <T, E, R1, R2>(
  x: Result<T, E>,
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

export const unwrapResult = <T, E>(result: Result<T, E>): T => {
  if (result.ok === false) {
    throw new Error("Unwrapped result was actually an error variant!");
  }

  return result.value;
};
