import getenv from "getenv";

/**
 * Hard-coded list of administrators emails.
 */
const WHITELISTED_ADMIN_EMAILS = getenv.array(
  "WHITELISTED_ADMIN_EMAILS",
  "string",
  [],
);

const ADMIN_EMAILS = new Set(WHITELISTED_ADMIN_EMAILS);

/**
 * Returns true is the provided email is whitelisted as an admin user.
 */
export const isAdminEmail = (email: string) => {
  return ADMIN_EMAILS.has(email);
};
