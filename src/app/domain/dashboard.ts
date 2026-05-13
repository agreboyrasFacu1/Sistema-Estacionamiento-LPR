import { DashboardStats, VehicleEntry } from '../types';

export const calculateDashboardStats = (
  vehicles: VehicleEntry[],
  now: Date = new Date()
): DashboardStats => {
  const today = now.toDateString();
  const completedDurations = vehicles.filter((vehicle) => vehicle.duration);

  return {
    vehiclesInside: vehicles.filter((vehicle) => !vehicle.exitTime).length,
    todayEntries: vehicles.filter(
      (vehicle) => new Date(vehicle.entryTime).toDateString() === today
    ).length,
    todayRevenue: vehicles
      .filter((vehicle) => vehicle.isPaid && vehicle.paidAt)
      .filter(
        (vehicle) => new Date(vehicle.paidAt!).toDateString() === today
      )
      .reduce((sum, vehicle) => sum + (vehicle.amount || 0), 0),
    averageDuration: Math.round(
      completedDurations.reduce(
        (sum, vehicle) => sum + (vehicle.duration || 0),
        0
      ) / Math.max(completedDurations.length, 1)
    ),
  };
};
