import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { LoanSimulatorPage } from './LoanSimulatorPage';

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LoanSimulatorPage />
    </QueryClientProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Age'), '35');
  await user.selectOptions(screen.getByLabelText('Employment status'), 'employed');
  await user.type(screen.getByLabelText(/time in current employment/i), '24');
  await user.type(screen.getByLabelText('Monthly income (R)'), '25000');
  await user.type(screen.getByLabelText('Monthly expenses (R)'), '10000');
  await user.type(screen.getByLabelText('Monthly debt repayments (R)'), '2000');
  await user.type(screen.getByLabelText('Loan amount (R)'), '100000');
  await user.type(screen.getByLabelText('Loan term (months)'), '24');
  await user.selectOptions(screen.getByLabelText('Loan purpose'), 'home_improvement');
}

describe('LoanSimulatorPage', () => {
  it('shows validation messages from the rules endpoint when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /check my eligibility/i }));

    expect(await screen.findByText('Age must be between 18 and 65')).toBeInTheDocument();
    expect(screen.getByText('Please select your employment status')).toBeInTheDocument();
    expect(screen.getByText('Minimum monthly income of R5,000 required')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toHaveAttribute('aria-invalid', 'true');
  });

  it('submits a valid form and shows the result and repayment schedule', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('button', { name: /check my eligibility/i });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /check my eligibility/i }));

    const result = await screen.findByRole('region', { name: /your estimate/i });
    expect(within(result).getByText('Likely to qualify')).toBeInTheDocument();

    await user.click(within(result).getByRole('button', { name: /view repayment schedule/i }));
    expect(await within(result).findByRole('table')).toBeInTheDocument();
    expect(within(result).getAllByRole('row')).toHaveLength(25);
  });

  it('shows an error with a retry option when the simulator cannot load', async () => {
    server.use(
      http.get('*/api/loans/validation-rules', () => HttpResponse.json({}, { status: 500 })),
    );
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load the simulator/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('surfaces a server error when the eligibility check fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/api/loans/eligibility', () =>
        HttpResponse.json({ message: 'Service unavailable.' }, { status: 503 }),
      ),
    );
    renderPage();
    await screen.findByRole('button', { name: /check my eligibility/i });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /check my eligibility/i }));

    expect(await screen.findByText('Service unavailable.')).toBeInTheDocument();
  });
});
