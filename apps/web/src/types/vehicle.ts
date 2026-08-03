export type VehicleStatus =
  | 'REGISTERED'
  | 'RECEIVED'
  | 'INSPECTED'
  | 'READY_FOR_LOADING'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'CUSTOMS_CLEARANCE'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface VehicleShipment {
  id: string;
  shipmentNo: string;
}

export interface Vehicle {
  id: string;
  vehicleNo: string;
  shipmentId: string;

  shipment?: VehicleShipment;

  vin?: string | null;

  make: string;
  model: string;
  year?: number | null;

  color?: string | null;
  vehicleType?: string | null;
  fuelType?: string | null;
  transmission?: string | null;

  purchasePrice?: string | number | null;
  declaredValue?: string | number | null;

  hasKeys: boolean;
  isRunning: boolean;
  hasDamage: boolean;

  damageDescription?: string | null;

  status: VehicleStatus;

  notes?: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  shipmentId: string;

  vin?: string;

  make: string;
  model: string;

  year?: number;

  color?: string;
  vehicleType?: string;
  fuelType?: string;
  transmission?: string;

  purchasePrice?: number;
  declaredValue?: number;

  hasKeys?: boolean;
  isRunning?: boolean;
  hasDamage?: boolean;

  damageDescription?: string;
  notes?: string;

  isActive?: boolean;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput> & {
  status?: VehicleStatus;
};
