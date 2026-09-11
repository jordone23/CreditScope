import { AppShell } from '../components/layout/AppShell';
import { EducationalDisclaimer } from '../components/layout/EducationalDisclaimer';
import { Header } from '../components/layout/Header';
import { LoanCalculator } from '../features/calculator/components/LoanCalculator';
import { AuthProvider } from '../features/auth/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <AppShell header={<Header />} footer={<EducationalDisclaimer />}>
        <LoanCalculator />
      </AppShell>
    </AuthProvider>
  );
}

export default App;
