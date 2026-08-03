export const documentCategories = [
  'BILL_OF_LADING',
  'COMMERCIAL_INVOICE',
  'PACKING_LIST',
  'CUSTOMS_DOCUMENT',
  'VEHICLE_DOCUMENT',
  'INSURANCE_DOCUMENT',
  'PROOF_OF_DELIVERY',
  'OTHER',
] as const;

export type DocumentCategory =
  (typeof documentCategories)[number];

export type ShipmentDocument = {
  id: string;
  shipmentId: string;
  category: DocumentCategory;
  title: string;
  description: string | null;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentDocumentResponse = {
  shipment: {
    id: string;
    shipmentNo: string;
  };
  documents: ShipmentDocument[];
};

export type UploadShipmentDocumentInput = {
  shipmentId: string;
  title: string;
  category: DocumentCategory;
  description?: string;
  file: File;
};
