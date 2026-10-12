# Loan Eligibility Simulator

A responsive React + TypeScript app where a customer enters their income, expenses and desired loan, and sees an estimated eligibility result, affordability analysis and full repayment schedule. All data is mocked.

## Features

- Form driven by the API's `validation-rules` endpoint, so validation messages and limits come from one source of truth.
- Eligibility result: approval likelihood, risk category, recommended and maximum amount, interest rate, monthly payment, total repayment.
- Affordability analysis: disposable income, debt-to-income, loan-to-annual-income.
- Month-by-month repayment schedule (amortization table).
- Loading, error and retry states for every request.
- Accessible: labelled controls, errors announced via `role="alert"`, `aria-invalid` / `aria-describedby`, keyboard-friendly, visible focus, semantic tables and lists.
- Responsive: single column on mobile, two columns on desktop.

## Tech stack

| Concern    | Choice                                         |
| ---------- | ---------------------------------------------- |
| UI         | React 19, TypeScript (strict), Vite            |
| Forms      | React Hook Form + Zod                          |
| Server state | TanStack Query                               |
| Mock API   | Mock Service Worker (MSW)                      |
| Tests      | Vitest, React Testing Library, user-event, MSW |
| Quality    | ESLint, Prettier, GitHub Actions CI            |
| Delivery   | Multi-stage Dockerfile (Node build, unprivileged nginx runtime) |

## Requirements

- Node.js 20.19 or newer (22 recommended) and npm
- Docker (optional, to run the container)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Test and verify

```bash
npm test              # unit and component tests
npm run test:coverage # with coverage
npm run lint
npm run typecheck
npm run format:check
```

## Build and run with Docker

```bash
docker build -t loan-eligibility-simulator .
docker run --rm -p 8080:8080 loan-eligibility-simulator
```

Open http://localhost:8080. A health check is available at `/healthz`.

The container serves the static build with the in-browser mock API enabled, so it needs no backend. To point a build at a real API instead:

```bash
docker build --build-arg VITE_USE_MOCKS=false --build-arg VITE_API_BASE_URL=https://api.example.com -t loan-eligibility-simulator .
```

## API contract

The app implements the following endpoints (mocked with MSW in `src/mocks`):

| Method | Path                           | Purpose                                      |
| ------ | ------------------------------ | -------------------------------------------- |
| POST   | `/api/loans/eligibility`       | Eligibility, recommended loan, affordability |
| GET    | `/api/loans/products`          | Loan products and their purposes             |
| POST   | `/api/loans/calculate-rate`    | Rate, payment and full amortization schedule |
| GET    | `/api/loans/validation-rules`  | Form validation rules and messages           |

## Project structure

```
src/
  api/                  Typed fetch client, endpoint functions, DTO types
  components/           Reusable UI (accessible Field wrapper)
  features/loan-simulator/
    LoanSimulatorPage   Data loading, submit flow, error states
    LoanForm            Form built from server-provided rules
    ResultPanel         Eligibility and affordability results
    PaymentSchedule     Amortization table
    schema.ts           Zod schema built from validation rules
  lib/                  Pure loan maths and formatting (unit tested)
  mocks/                MSW handlers, mock data, eligibility engine
  test/                 Test setup
```

## Design decisions and assumptions

- **Validation from the API.** The Zod schema is built at runtime from `/validation-rules`, so changing a limit on the backend needs no front-end release. The `existingDebt` field is not covered by the rules endpoint, so it has a local rule.
- **Mock eligibility logic.** The mock engine lives in `src/mocks/loanEngine.ts` and stands in for a real backend. Interest rate is interpolated across the product's range by credit score (a missing score defaults to 600). An instalment may use at most 70% of disposable income after existing debt repayments. Unemployed applicants are declined.
- **`existingDebt`** is treated as the customer's monthly debt repayments.
- **`loanToIncomeRatio`** is the loan amount as a percentage of annual income.
- **Loan product** is derived from the selected purpose (vehicle purposes map to Vehicle Finance, everything else to Personal Loan), because the eligibility request has no product field.
- **Money maths** uses standard annuity formulas; the final instalment clears the remaining balance so the schedule always ends at exactly zero.
- **No sensitive data is persisted.** Form values stay in memory only and are never written to storage or logged.
- **Mocks in the container.** The static build ships MSW's service worker so the demo is self-contained. Set `VITE_USE_MOCKS=false` for a real backend.

## Possible next steps

- End-to-end tests (Playwright) for the main flow.
- Currency and locale switching.
- Saving and comparing multiple scenarios.
