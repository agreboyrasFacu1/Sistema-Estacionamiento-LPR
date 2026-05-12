import { PricingRule, VehicleCategory } from '../types';

export const BASE_BILLING_MINUTES = 60;
export const BILLING_FRACTION_MINUTES = 10;
export const EXIT_GRACE_MINUTES = 3;

export const normalizePricingRule = (rule: PricingRule): PricingRule => ({
  ...rule,
  baseMinutes: BASE_BILLING_MINUTES,
  fraction: BILLING_FRACTION_MINUTES,
});

export const calculateParkingFee = (
  category: VehicleCategory,
  durationMinutes: number,
  rules: PricingRule[]
): number => {
  const rule = rules.find((r) => r.category === category);
  if (!rule || durationMinutes <= 0) return 0;

  const normalized = normalizePricingRule(rule);
  if (durationMinutes <= normalized.baseMinutes) {
    return Math.min(normalized.basePrice, normalized.dailyMax);
  }

  const extraMinutes = durationMinutes - normalized.baseMinutes;
  const extraFractions = Math.ceil(extraMinutes / normalized.fraction);
  const fractionAmount =
    normalized.hourlyRate * (normalized.fraction / BASE_BILLING_MINUTES);
  const total = normalized.basePrice + extraFractions * fractionAmount;

  return Math.min(Number(total.toFixed(2)), normalized.dailyMax);
};

export const translateCategory = (category: VehicleCategory | string): string => {
  const translations: Record<string, string> = {
    auto: 'Auto',
    camioneta: 'Camioneta',
    moto: 'Moto',
  };
  return translations[category] || category;
};

export const getCategoryIcon = (category: VehicleCategory | string): string => {
  const icons: Record<string, string> = {
    auto: '🚗',
    camioneta: '🚙',
    moto: '🏍️',
  };
  return icons[category] || '🚗';
};
