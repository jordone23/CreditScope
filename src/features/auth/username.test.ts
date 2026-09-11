import { describe, expect, it } from 'vitest';
import { getUsernameValidationError, normalizeUsername } from './username';

describe('username', () => {
  it('normalizuje nazwę do małych liter', () => {
    expect(normalizeUsername('  CreditScope.User  ')).toBe('creditscope.user');
  });

  it.each(['abc', 'user-name', 'User.Name_12'])('akceptuje poprawną nazwę %s', (value) => {
    expect(getUsernameValidationError(value)).toBeNull();
  });

  it.each(['ab', 'nazwa użytkownika', 'u!', 'a'.repeat(51)])(
    'odrzuca niepoprawną nazwę %s',
    (value) => {
      expect(getUsernameValidationError(value)).toMatch(/użyj/i);
    },
  );
});
