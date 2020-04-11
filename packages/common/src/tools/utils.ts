/**
 * Assert a condition cannot occur. Used for writing exhaustive switch
 * blocks guarantee every value is handled.
 */
export const assertUnreachable = (x: never): never => {
  throw new Error(
    `Panic! Received a value which should not exist: ${JSON.stringify(x)}`,
  );
};

const URL_TERM_BLACKLIST = new Set(["the", "of", "and", "a", "an"]);

// NOTE: We leave spaces in initially so that we can split on them
// NOTE: The alphanumeric logic DOES NOT necessarily work outside of English
// (this would demolish Chinese URLs). Just a consideration.
export const sluggify = (s: string) => {
  return s
    .toLowerCase()
    .split(" ")
    .map(x => x.replace(/[^A-Za-z0-9]/g, "").trim()) //  Replace non alphanumeric chars except space. See NOTE
    .filter(Boolean)
    .filter(x => !URL_TERM_BLACKLIST.has(x)) // Remove common filler words like "the", "of", "an"
    .join("-");
};

// NOTE: I'm not using the challenge type because I don't care about the other
// props. It doesn't actually need to be a challenge
export const getChallengeSlug = ({
  id,
  title,
}: {
  id: string;
  title: string;
}) => {
  return `${id}/${sluggify(title)}`;
};
