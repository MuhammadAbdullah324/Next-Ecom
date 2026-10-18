// Messages raised by our database functions are written for shoppers; pass those through.
// Anything else (network, unexpected SQL errors) gets a generic message and is logged.
const USER_FACING_CODES = new Set(["P0001", "P0002", "22023", "28000"]);

export function userMessage(error: { code?: string; message: string } | null, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.code && USER_FACING_CODES.has(error.code)) return error.message;
  console.error(error);
  return fallback;
}
