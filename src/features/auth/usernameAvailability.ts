import { getSupabaseClient } from '../../lib/supabase/client';
import { getUsernameValidationError, normalizeUsername } from './username';

export type UsernameAvailability =
  | { state: 'available' }
  | { state: 'invalid'; message: string }
  | { state: 'unavailable' }
  | { state: 'unavailable-service' };

interface UsernameAvailabilityRow {
  is_available: boolean;
  normalized_username: string;
}

export async function checkUsernameAvailability(value: string): Promise<UsernameAvailability> {
  const validationError = getUsernameValidationError(value);
  if (validationError !== null) {
    return { state: 'invalid', message: validationError };
  }

  const supabase = getSupabaseClient();
  if (supabase === null) {
    return { state: 'unavailable-service' };
  }

  const { data, error } = await supabase.rpc('check_username_availability', {
    p_username: normalizeUsername(value),
  });

  if (error !== null || !Array.isArray(data) || data.length !== 1) {
    return { state: 'unavailable-service' };
  }

  const row = data[0] as UsernameAvailabilityRow;
  return row.is_available ? { state: 'available' } : { state: 'unavailable' };
}
