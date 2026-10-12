const currency = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number): string => currency.format(value);

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

export const titleCase = (value: string): string =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
