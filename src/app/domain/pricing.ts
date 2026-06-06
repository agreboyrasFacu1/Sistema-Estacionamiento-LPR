import { PricingRule, VehicleCategory } from '../types';

export const BASE_BILLING_MINUTES = 60;
export const BILLING_FRACTION_MINUTES = 10;
export const DEFAULT_FRACTION_PRICE_RATE = 0.15;
export const EXIT_GRACE_MINUTES = 3;

export const calculateDefaultFractionPrice = (basePrice: number): number => {
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  return Number((safeBasePrice * DEFAULT_FRACTION_PRICE_RATE).toFixed(2));
};

export const normalizePricingRule = (rule: PricingRule): PricingRule => {
  const basePrice = Number.isFinite(rule.basePrice) ? rule.basePrice : 0;
  const rawFractionPrice = (rule as PricingRule & { fractionPrice?: number }).fractionPrice;
  const fractionPrice = Number.isFinite(rawFractionPrice)
    ? rawFractionPrice
    : calculateDefaultFractionPrice(basePrice);

  return {
    ...rule,
    basePrice,
    fractionPrice,
    baseMinutes: BASE_BILLING_MINUTES,
    fraction: BILLING_FRACTION_MINUTES,
  };
};

export const calculateParkingFee = (
  category: VehicleCategory,
  durationMinutes: number,
  rules: PricingRule[]
): number => {
  const rule = rules.find((r) => r.category === category);
  if (!rule || durationMinutes <= 0) return 0;

  const normalized = normalizePricingRule(rule);
  if (durationMinutes <= normalized.baseMinutes) {
    return normalized.basePrice;
  }

  const extraMinutes = durationMinutes - normalized.baseMinutes;
  const extraFractions = Math.ceil(extraMinutes / normalized.fraction);
  const total = normalized.basePrice + extraFractions * normalized.fractionPrice;

  return Number(total.toFixed(2));
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
