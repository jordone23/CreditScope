import { AuthPanel } from '../../features/auth/AuthPanel';

export function Header() {
  return (
    <header className="site-header">
      <div className="content-container site-header__content">
        <div>
          <a className="brand" href="/" aria-label="CreditScope — strona główna">
            CreditScope
          </a>
          <p className="brand-description">
            Symulacja kredytu i orientacyjna analiza obciążenia budżetu
          </p>
        </div>
        <AuthPanel />
      </div>
    </header>
  );
}
