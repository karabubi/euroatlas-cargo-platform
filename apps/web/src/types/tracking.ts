export type TrackingEvent = {
  id: string;
  shipmentId: string;
  eventType: string;
  status?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  createdBy?: string | null;
  createdAt: string;
};

export type ShipmentTrackingResponse = {
  shipment: {
    id: string;
    shipmentNo: string;
  };

  tracking: TrackingEvent[];
};

export type CreateTrackingEventInput = {
  shipmentId: string;
  eventType: string;
  status?: string;
  title: string;
  description?: string;
  location?: string;
  createdBy?: string;
};
