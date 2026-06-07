import { EXIT_GRACE_MINUTES } from './pricing';
import { VehicleEntry } from '../types';

export const calculateDurationMinutes = (
  entryTime: string,
  endTime: Date = new Date()
): number => {
  const diffMs = endTime.getTime() - new Date(entryTime).getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60)));
};

export const createExitGraceUntil = (paidAt: string): string => {
  const graceUntil = new Date(paidAt);
  graceUntil.setMinutes(graceUntil.getMinutes() + EXIT_GRACE_MINUTES);
  return graceUntil.toISOString();
};

export const isWithinExitGrace = (
  exitGraceUntil: string | undefined,
  now: Date = new Date()
): boolean => {
  if (!exitGraceUntil) return false;
  return now.getTime() <= new Date(exitGraceUntil).getTime();
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

export const sortVehiclesByLatestEntry = (
  vehicles: VehicleEntry[]
): VehicleEntry[] =>
  [...vehicles].sort(
    (first, second) =>
      new Date(second.entryTime).getTime() - new Date(first.entryTime).getTime()
  );
