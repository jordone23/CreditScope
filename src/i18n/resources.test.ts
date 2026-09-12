import { describe, expect, it } from 'vitest';
import { resources } from './resources';

function keysOf(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return typeof child === 'object' && child !== null
      ? keysOf(child as Record<string, unknown>, path)
      : [path];
  });
}

describe('translation resources', () => {
  it('keeps the same translation keys in Polish and English', () => {
    expect(keysOf(resources.pl.translation)).toEqual(keysOf(resources.en.translation));
  });
});
