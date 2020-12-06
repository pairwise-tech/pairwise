type Nullable<T> = T | null;

declare module "swipyjs";

declare module "string-quote-x" {
  const quote: (str: string) => string;
  export default quote;
}

declare module "strip-comments" {
  export default function stripComments(s: string): string;
}

declare module "*.png" {
  const value: string;
  export default value;
}
