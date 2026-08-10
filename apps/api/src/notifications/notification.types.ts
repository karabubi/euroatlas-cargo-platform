export type ShipmentNotificationChannel = 'EMAIL' | 'WHATSAPP';

export interface ShipmentTrackingNotification {
  shipmentId: string;
  shipmentNo: string;
  trackingNumber: string;
  status: string;

  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;

  trackingUrl: string;
}
