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

export type DispatchShipmentStatus = "LOADED" | "IN_TRANSIT";

export type DispatchShipmentInput = {
  status: DispatchShipmentStatus;
  location: string;
  dispatchedBy?: string;
  departureTime?: string;
  notes?: string;
};

export type DispatchShipmentResponse = {
  message: string;
  shipment: Shipment;
  trackingEvent: {
    id: string;
    shipmentId: string;
    eventType: string;
    status: string | null;
    title: string;
    description: string | null;
    location: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
  dispatchedAt: string;
};

export type ArrivalShipmentInput = {
  location: string;
  receivedBy?: string;
  arrivalTime?: string;
  notes?: string;
};

export type ArrivalShipmentResponse = {
  message: string;
  shipment: Shipment;
  trackingEvent: {
    id: string;
    shipmentId: string;
    eventType: string;
    status: string | null;
    title: string;
    description: string | null;
    location: string | null;
    createdBy: string | null;
    createdAt: string;
  };
  arrivedAt: string;
};

export type CustomsClearanceShipmentInput = {
  location: string;
  handledBy?: string;
  customsReference?: string;
  notes?: string;
};

export type CustomsClearanceShipmentResponse = {
  message: string;
  shipment: Shipment;
  trackingEvent: {
    id: string;
    shipmentId: string;
    eventType: string;
    status: string | null;
    title: string;
    description: string | null;
    location: string | null;
    createdBy: string | null;
    createdAt: string;
  };
  customsReference: string | null;
  customsStartedAt: string;
};
