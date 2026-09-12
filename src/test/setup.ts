import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import i18n from '../i18n/config';

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage('pl');
  document.documentElement.lang = 'pl-PL';
});

afterEach(cleanup);
