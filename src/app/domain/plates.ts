import { VehicleCategory, VehicleEntry } from '../types';

export const PLATE_FORMATS = ['ABC123', 'AB123CD'] as const;

export const normalizePlate = (plate: string): string =>
  plate.toUpperCase().replace(/\s+/g, '').trim();

export const validatePlate = (plate: string): boolean => {
  const cleaned = normalizePlate(plate);
  const legacyFormat = /^[A-Z]{3}\d{3}$/.test(cleaned);
  const mercosurFormat = /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleaned);
  return legacyFormat || mercosurFormat;
};

export const plateValidationMessage =
  'Formato de patente invalido. Use ABC123 o AB123CD';

const categoryLabels: Record<VehicleCategory, string> = {
  auto: 'Auto',
  camioneta: 'Camioneta',
  moto: 'Moto',
};

export interface HistoricalPlateCategoryConflict {
  plate: string;
  registeredCategory: VehicleCategory;
  attemptedCategory: VehicleCategory;
}

export const findHistoricalPlateCategoryConflict = (
  vehicles: VehicleEntry[],
  plate: string,
  attemptedCategory: VehicleCategory
): HistoricalPlateCategoryConflict | null => {
  const normalizedPlate = normalizePlate(plate);
  const conflictingVehicle = vehicles.find(
    (vehicle) =>
      normalizePlate(vehicle.licensePlate) === normalizedPlate &&
      vehicle.category !== attemptedCategory
  );

  if (!conflictingVehicle) return null;

  return {
    plate: normalizedPlate,
    registeredCategory: conflictingVehicle.category,
    attemptedCategory,
  };
};

export const formatHistoricalPlateCategoryConflict = (
  conflict: HistoricalPlateCategoryConflict
): string =>
  `La patente ${conflict.plate} ya fue registrada historicamente como ${
    categoryLabels[conflict.registeredCategory]
  }. No puede ingresarse como ${categoryLabels[conflict.attemptedCategory]}.`;
