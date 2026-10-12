import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoanSimulatorPage } from './features/loan-simulator/LoanSimulatorPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <header className="header">
        <h1>Loan Eligibility Simulator</h1>
        <p>See what you could qualify for and what it would cost each month.</p>
      </header>
      <main>
        <LoanSimulatorPage />
      </main>
    </QueryClientProvider>
  );
}
