import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './app/styles.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Nie znaleziono elementu głównego aplikacji.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
