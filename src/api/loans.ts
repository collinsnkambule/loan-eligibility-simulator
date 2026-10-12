import { http } from './client';
import type {
  CalculateRateRequest,
  CalculateRateResponse,
  EligibilityRequest,
  EligibilityResponse,
  ProductsResponse,
  ValidationRules,
} from './types';

export const loansApi = {
  checkEligibility: (body: EligibilityRequest) =>
    http.post<EligibilityResponse>('/api/loans/eligibility', body),
  getProducts: () => http.get<ProductsResponse>('/api/loans/products'),
  calculateRate: (body: CalculateRateRequest) =>
    http.post<CalculateRateResponse>('/api/loans/calculate-rate', body),
  getValidationRules: () => http.get<ValidationRules>('/api/loans/validation-rules'),
};
