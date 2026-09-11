import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  footer: ReactNode;
  header: ReactNode;
}

export function AppShell({ children, footer, header }: AppShellProps) {
  return (
    <div className="page-shell">
      {header}
      <main className="content-container main-content">{children}</main>
      {footer}
    </div>
  );
}
