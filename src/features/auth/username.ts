export const usernamePattern = /^[a-zA-Z0-9_.-]{3,50}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function getUsernameValidationError(value: string) {
  if (usernamePattern.test(value.trim())) {
    return null;
  }

  return 'Użyj 3–50 liter, cyfr, _, - lub . bez spacji.';
}
