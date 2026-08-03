export type ShipmentStatus =
  | "DRAFT"
  | "BOOKED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "CUSTOMS_CLEARANCE"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type ShipmentCustomer = {
  id: string;
  customerNo?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
};

export type Shipment = {
  id: string;
  shipmentNo: string;
  customerId: string;
  status: ShipmentStatus;
  originCountry: string;
  originCity?: string | null;
  originPort?: string | null;
  destinationCountry: string;
  destinationCity?: string | null;
  destinationPort?: string | null;
  isActive: boolean;
  customer?: ShipmentCustomer;
};
