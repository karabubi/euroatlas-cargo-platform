import { ConflictException } from '@nestjs/common';
import { ShipmentStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('Shipment workflow guards', () => {
  let service: ShipmentsService;

  const shipmentFindUnique = jest.fn();

  const transaction = jest.fn();

  const prismaMock = {
    shipment: {
      findUnique: shipmentFindUnique,
    },

    $transaction: transaction,
  };

  const baseShipment = {
    id: 'shipment-test-id',
    shipmentNo: 'EAC-TEST-001',
    customerId: 'customer-test-id',
    originCountry: 'Germany',
    destinationCountry: 'Libya',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ShipmentsService(prismaMock as unknown as PrismaService);
  });

  describe('markReadyForDelivery', () => {
    it('rejects a DRAFT shipment', async () => {
      shipmentFindUnique.mockResolvedValue({
        ...baseShipment,
        status: ShipmentStatus.DRAFT,
      });

      await expect(
        service.markReadyForDelivery(baseShipment.id, {
          location: 'Tripoli Delivery Yard',
          releasedBy: 'Test Operator',
          releaseReference: 'REL-TEST-001',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.markReadyForDelivery(baseShipment.id, {
          location: 'Tripoli Delivery Yard',
        }),
      ).rejects.toThrow(/must be in CUSTOMS_CLEARANCE/);

      expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects an already DELIVERED shipment', async () => {
      shipmentFindUnique.mockResolvedValue({
        ...baseShipment,
        status: ShipmentStatus.DELIVERED,
      });

      await expect(
        service.markReadyForDelivery(baseShipment.id, {
          location: 'Tripoli Delivery Yard',
        }),
      ).rejects.toThrow(/already ready for delivery or delivered/);

      expect(transaction).not.toHaveBeenCalled();
    });
  });

  describe('markDelivered', () => {
    it('rejects a DRAFT shipment', async () => {
      shipmentFindUnique.mockResolvedValue({
        ...baseShipment,
        status: ShipmentStatus.DRAFT,
      });

      await expect(
        service.markDelivered(baseShipment.id, {
          location: 'Tripoli Customer Delivery Point',
          deliveredTo: 'Test Customer',
          proofReference: 'POD-TEST-001',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.markDelivered(baseShipment.id, {
          location: 'Tripoli Customer Delivery Point',
        }),
      ).rejects.toThrow(/must be READY_FOR_DELIVERY/);

      expect(transaction).not.toHaveBeenCalled();
    });

    it('rejects duplicate delivery', async () => {
      shipmentFindUnique.mockResolvedValue({
        ...baseShipment,
        status: ShipmentStatus.DELIVERED,
      });

      await expect(
        service.markDelivered(baseShipment.id, {
          location: 'Tripoli Customer Delivery Point',
        }),
      ).rejects.toThrow(/has already been delivered/);

      expect(transaction).not.toHaveBeenCalled();
    });
  });
});
