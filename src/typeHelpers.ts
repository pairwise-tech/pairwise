/**
 * A predicate function that checks a value is neither null nor undefined.
 *
 * @param value - A value that might be null or undefined
 */
export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function notUndefined<T>(value: T | undefined): value is T {
  return value !== undefined
}
