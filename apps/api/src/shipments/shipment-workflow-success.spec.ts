import { ShipmentStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('Shipment successful workflow transitions', () => {
  let service: ShipmentsService;

  const shipmentFindUnique = jest.fn();
  const shipmentUpdate = jest.fn();
  const trackingCreate = jest.fn();
  const transaction = jest.fn();

  const transactionClient = {
    shipment: {
      update: shipmentUpdate,
    },

    shipmentTracking: {
      create: trackingCreate,
    },
  };

  const prismaMock = {
    shipment: {
      findUnique: shipmentFindUnique,
    },

    $transaction: transaction,
  };

  const baseShipment = {
    id: 'shipment-success-id',
    shipmentNo: 'EAC-SUCCESS-001',
    customerId: 'customer-success-id',
    originCountry: 'Germany',
    destinationCountry: 'Libya',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    transaction.mockImplementation(
      (callback: (tx: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );

    service = new ShipmentsService(prismaMock as unknown as PrismaService);

    jest
      .spyOn(
        service as unknown as {
          assertReadyForStatus: (
            id: string,
            status: ShipmentStatus,
          ) => Promise<void>;
        },
        'assertReadyForStatus',
      )
      .mockResolvedValue();
  });

  describe('markReadyForDelivery', () => {
    it('moves CUSTOMS_CLEARANCE to READY_FOR_DELIVERY and creates one tracking event', async () => {
      shipmentFindUnique.mockResolvedValue({
        ...baseShipment,
        status: ShipmentStatus.CUSTOMS_CLEARANCE,
      });

      const updatedShipment = {
        ...baseShipment,
        status: ShipmentStatus.READY_FOR_DELIVERY,
      };

      const trackingEvent = {
        id: 'tracking-ready-001',
        shipmentId: baseShipment.id,
        eventType: 'STATUS_CHANGED',
        status: ShipmentStatus.READY_FOR_DELIVERY,
        title: 'Shipment ready for delivery',
        description: 'Released for final delivery.',
        location: 'Tripoli Delivery Yard, Libya',
        createdBy: 'Delivery Operations',
        createdAt: new Date(),
      };

      shipmentUpdate.mockResolvedValue(updatedShipment);

      trackingCreate.mockResolvedValue(trackingEvent);

      const result = await service.markReadyForDelivery(baseShipment.id, {
        location: '  Tripoli Delivery Yard, Libya  ',
        releasedBy: '  Delivery Operations  ',
        releaseReference: '  REL-2026-TEST-001  ',
        notes: '  Released for final delivery.  ',
      });

      expect(transaction).toHaveBeenCalledTimes(1);

      expect(shipmentUpdate).toHaveBeenCalledTimes(1);

      expect(shipmentUpdate).toHaveBeenCalledWith({
        where: {
          id: baseShipment.id,
        },

        data: {
          status: ShipmentStatus.READY_FOR_DELIVERY,
        },

        include: {
          customer: true,
        },
      });

      expect(trackingCreate).toHaveBeenCalledTimes(1);

      expect(trackingCreate).toHaveBeenCalledWith({
        data: {
          shipmentId: baseShipment.id,
          eventType: 'STATUS_CHANGED',
          status: ShipmentStatus.READY_FOR_DELIVERY,
          title: 'Shipment ready for delivery',
          description: 'Released for final delivery.',
          location: 'Tripoli Delivery Yard, Libya',
          createdBy: 'Delivery Operations',
        },
      });

      expect(result.message).toBe(
        'Shipment marked ready for delivery successfully.',
      );

      expect(result.shipment).toEqual(updatedShipment);

      expect(result.trackingEvent).toEqual(trackingEvent);

      expect(result.releaseReference).toBe('REL-2026-TEST-001');

      expect(result.readyForDeliveryAt).toBeInstanceOf(Date);
    });
  });

  describe('markDelivered', () => {
    it('moves READY_FOR_DELIVERY to DELIVERED and creates one tracking event', async () => {
      shipmentFindUnique.mockResolvedValue({
        ...baseShipment,
        status: ShipmentStatus.READY_FOR_DELIVERY,
      });

      const updatedShipment = {
        ...baseShipment,
        status: ShipmentStatus.DELIVERED,
      };

      const trackingEvent = {
        id: 'tracking-delivery-001',
        shipmentId: baseShipment.id,
        eventType: 'STATUS_CHANGED',
        status: ShipmentStatus.DELIVERED,
        title: 'Shipment delivered',
        description: 'Delivered in good condition.',
        location: 'Tripoli Customer Delivery Point, Libya',
        createdBy: 'Authorized Customer',
        createdAt: new Date(),
      };

      shipmentUpdate.mockResolvedValue(updatedShipment);

      trackingCreate.mockResolvedValue(trackingEvent);

      const result = await service.markDelivered(baseShipment.id, {
        location: '  Tripoli Customer Delivery Point, Libya  ',
        deliveredTo: '  Authorized Customer  ',
        proofReference: '  POD-2026-TEST-001  ',
        notes: '  Delivered in good condition.  ',
      });

      expect(transaction).toHaveBeenCalledTimes(1);

      expect(shipmentUpdate).toHaveBeenCalledTimes(1);

      expect(shipmentUpdate).toHaveBeenCalledWith({
        where: {
          id: baseShipment.id,
        },

        data: {
          status: ShipmentStatus.DELIVERED,
        },

        include: {
          customer: true,
        },
      });

      expect(trackingCreate).toHaveBeenCalledTimes(1);

      expect(trackingCreate).toHaveBeenCalledWith({
        data: {
          shipmentId: baseShipment.id,
          eventType: 'STATUS_CHANGED',
          status: ShipmentStatus.DELIVERED,
          title: 'Shipment delivered',
          description: 'Delivered in good condition.',
          location: 'Tripoli Customer Delivery Point, Libya',
          createdBy: 'Authorized Customer',
        },
      });

      expect(result.message).toBe('Shipment delivered successfully.');

      expect(result.shipment).toEqual(updatedShipment);

      expect(result.trackingEvent).toEqual(trackingEvent);

      expect(result.deliveredTo).toBe('Authorized Customer');

      expect(result.proofReference).toBe('POD-2026-TEST-001');

      expect(result.deliveredAt).toBeInstanceOf(Date);
    });
  });
});
