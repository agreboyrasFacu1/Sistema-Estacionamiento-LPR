export const calculateWhiteRunDifference = (
  systemAmount: number,
  manualAmount: number
): number => Number((systemAmount - manualAmount).toFixed(2));
