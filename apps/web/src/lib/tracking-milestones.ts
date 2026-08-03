export type ShipmentMilestone = {
  eventType: string;
  label: string;
  description: string;
};

export const shipmentMilestones: ShipmentMilestone[] = [
  {
    eventType: 'BOOKING_CONFIRMED',
    label: 'Booking confirmed',
    description: 'The shipping booking has been confirmed.',
  },
  {
    eventType: 'VEHICLE_RECEIVED',
    label: 'Vehicle received',
    description: 'The vehicle or cargo has been received.',
  },
  {
    eventType: 'CUSTOMS_PROCESSING',
    label: 'Customs processing',
    description: 'Export customs processing is underway.',
  },
  {
    eventType: 'LOADED',
    label: 'Loaded',
    description: 'The cargo has been loaded for transport.',
  },
  {
    eventType: 'DEPARTED',
    label: 'Departed',
    description: 'The vessel or transport has departed.',
  },
  {
    eventType: 'IN_TRANSIT',
    label: 'In transit',
    description: 'The shipment is currently in transit.',
  },
  {
    eventType: 'ARRIVED',
    label: 'Arrived',
    description: 'The shipment has arrived at its destination.',
  },
  {
    eventType: 'DELIVERED',
    label: 'Delivered',
    description: 'The shipment has been delivered successfully.',
  },
];
