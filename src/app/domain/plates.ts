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
