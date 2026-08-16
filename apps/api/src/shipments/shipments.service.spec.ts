import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const prismaServiceMock = {
    shipment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    shipmentNotificationHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const notificationsServiceMock = {
    sendShipmentTrackingEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: NotificationsService,
          useValue: notificationsServiceMock,
        },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends tracking email to the customer attached to the shipment and records SENT history', async () => {
    prismaServiceMock.shipment.findUnique.mockResolvedValue({
      id: 'shipment-1',
      shipmentNo: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customer: {
        companyName: 'Example Logistics',
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@example.com',
        mobile: null,
        phone: null,
      },
    });

    notificationsServiceMock.sendShipmentTrackingEmail.mockResolvedValue(true);

    prismaServiceMock.shipmentNotificationHistory.create.mockResolvedValue({
      id: 'history-1',
    });

    const result = await service.sendTrackingEmail('shipment-1');

    expect(
      notificationsServiceMock.sendShipmentTrackingEmail,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        shipmentId: 'shipment-1',
        shipmentNo: 'EAC-2026-0001',
        customerEmail: 'customer@example.com',
        status: 'IN_TRANSIT',
      }),
    );

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'shipment-1',
        recipient: 'customer@example.com',
        notificationType: 'TRACKING',
        provider: 'RESEND',
        sentAt: expect.any(Date),
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        message: 'Tracking email sent successfully.',
        recipient: 'customer@example.com',
        notificationHistoryId: 'history-1',
      }),
    );
  });

  it('records FAILED history when the email provider returns false', async () => {
    prismaServiceMock.shipment.findUnique.mockResolvedValue({
      id: 'shipment-1',
      shipmentNo: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customer: {
        companyName: 'Example Logistics',
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@example.com',
        mobile: null,
        phone: null,
      },
    });

    notificationsServiceMock.sendShipmentTrackingEmail.mockResolvedValue(false);

    prismaServiceMock.shipmentNotificationHistory.create.mockResolvedValue({
      id: 'history-failed',
    });

    await expect(service.sendTrackingEmail('shipment-1')).rejects.toThrow(
      'Tracking email could not be sent.',
    );

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'shipment-1',
        recipient: 'customer@example.com',
        notificationType: 'TRACKING',
        provider: 'RESEND',
        errorMessage:
          'Tracking email provider returned an unsuccessful result.',
      }),
    });
  });

  it('returns notification history newest first', async () => {
    prismaServiceMock.shipment.findUnique.mockResolvedValue({
      id: 'shipment-1',
    });

    prismaServiceMock.shipmentNotificationHistory.findMany.mockResolvedValue([
      {
        id: 'history-2',
        recipient: 'customer@example.com',
      },
      {
        id: 'history-1',
        recipient: 'customer@example.com',
      },
    ]);

    const history = await service.getNotificationHistory('shipment-1');

    expect(
      prismaServiceMock.shipmentNotificationHistory.findMany,
    ).toHaveBeenCalledWith({
      where: {
        shipmentId: 'shipment-1',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(history).toHaveLength(2);
  });
});
