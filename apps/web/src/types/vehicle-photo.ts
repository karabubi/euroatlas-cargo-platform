export type VehiclePhotoCategory =
  | 'FRONT'
  | 'REAR'
  | 'LEFT_SIDE'
  | 'RIGHT_SIDE'
  | 'INTERIOR'
  | 'DASHBOARD'
  | 'VIN'
  | 'ENGINE'
  | 'DAMAGE'
  | 'OTHER';

export type VehiclePhoto = {
  id: string;
  vehicleId: string;
  category: VehiclePhotoCategory;
  title: string | null;
  description: string | null;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  isPrimary: boolean;
  sortOrder: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehiclePhotoResponse = {
  vehicle: {
    id: string;
    vehicleNo: string;
    vin: string | null;
    make: string;
    model: string;
  };
  photos: VehiclePhoto[];
};

export type UploadVehiclePhotoInput = {
  vehicleId: string;
  file: File;
  category: VehiclePhotoCategory;
  title?: string;
  description?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type UpdateVehiclePhotoInput = {
  category?: VehiclePhotoCategory;
  title?: string;
  description?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};
