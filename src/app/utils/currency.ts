export const formatCurrencyARS = (
  amount: number,
  options: Intl.NumberFormatOptions = {}
): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);

export const formatCurrencyARSWithCents = (amount: number): string =>
  formatCurrencyARS(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
