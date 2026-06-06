import { DashboardStats, TicketOperation, VehicleEntry } from '../types';

export const calculateDashboardStats = (
  vehicles: VehicleEntry[],
  tickets: TicketOperation[] = [],
  now: Date = new Date()
): DashboardStats => {
  const today = now.toDateString();
  const completedDurations = vehicles.filter((vehicle) => vehicle.duration);
  const parkingRevenue = vehicles
    .filter((vehicle) => vehicle.isPaid && vehicle.paidAt)
    .filter(
      (vehicle) => new Date(vehicle.paidAt!).toDateString() === today
    )
    .reduce((sum, vehicle) => sum + (vehicle.amount || 0), 0);
  const subscriptionRevenue = tickets
    .filter((ticket) => ticket.operationType === 'subscription_renewal')
    .filter((ticket) => new Date(ticket.paidAt).toDateString() === today)
    .reduce((sum, ticket) => sum + ticket.amount, 0);

  return {
    vehiclesInside: vehicles.filter((vehicle) => !vehicle.exitTime).length,
    todayEntries: vehicles.filter(
      (vehicle) => new Date(vehicle.entryTime).toDateString() === today
    ).length,
    todayRevenue: parkingRevenue + subscriptionRevenue,
    averageDuration: Math.round(
      completedDurations.reduce(
        (sum, vehicle) => sum + (vehicle.duration || 0),
        0
      ) / Math.max(completedDurations.length, 1)
    ),
  };
};
