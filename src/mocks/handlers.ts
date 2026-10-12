import { delay, http, HttpResponse } from 'msw';
import type { CalculateRateRequest, EligibilityRequest } from '../api/types';
import { products, validationRules } from './data';
import { calculateRate, evaluateEligibility } from './loanEngine';

/** Simulated network latency (ms). Disabled in tests via `setLatency(0)`. */
let latency = 400;
export const setLatency = (ms: number) => {
  latency = ms;
};

export const handlers = [
  http.get('*/api/loans/validation-rules', async () => {
    await delay(latency);
    return HttpResponse.json(validationRules);
  }),

  http.get('*/api/loans/products', async () => {
    await delay(latency);
    return HttpResponse.json({ products });
  }),

  http.post('*/api/loans/eligibility', async ({ request }) => {
    await delay(latency);
    const body = (await request.json()) as EligibilityRequest;
    if (!body?.personalInfo || !body.financialInfo || !body.loanDetails) {
      return HttpResponse.json({ message: 'Malformed eligibility request.' }, { status: 400 });
    }
    return HttpResponse.json(evaluateEligibility(body));
  }),

  http.post('*/api/loans/calculate-rate', async ({ request }) => {
    await delay(latency);
    const body = (await request.json()) as CalculateRateRequest;
    if (!(body?.loanAmount > 0) || !(body.loanTerm > 0)) {
      return HttpResponse.json({ message: 'Malformed rate request.' }, { status: 400 });
    }
    return HttpResponse.json(calculateRate(body));
  }),
];
