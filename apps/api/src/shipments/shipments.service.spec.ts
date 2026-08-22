import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const prismaServiceMock = {
    shipment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
    sendShipmentTrackingWhatsApp: jest.fn(),
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

  describe('automatic shipment number generation', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('starts a new year with EAC-2027-0001', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'));

      prismaServiceMock.shipment.findFirst.mockResolvedValue(null);

      await expect(service.getNextShipmentNumber()).resolves.toEqual({
        shipmentNo: 'EAC-2027-0001',
      });

      expect(prismaServiceMock.shipment.findFirst).toHaveBeenCalledWith({
        where: {
          shipmentNo: {
            startsWith: 'EAC-2027-',
          },
        },
        orderBy: {
          shipmentNo: 'desc',
        },
        select: {
          shipmentNo: true,
        },
      });
    });

    it('increments the latest number in the same year', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-23T12:00:00.000Z'));

      prismaServiceMock.shipment.findFirst.mockResolvedValue({
        shipmentNo: 'EAC-2026-0042',
      });

      await expect(service.getNextShipmentNumber()).resolves.toEqual({
        shipmentNo: 'EAC-2026-0043',
      });
    });

    it('does not continue the 2026 sequence in 2027', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2027-01-01T00:00:01.000Z'));

      prismaServiceMock.shipment.findFirst.mockResolvedValue(null);

      await expect(service.getNextShipmentNumber()).resolves.toEqual({
        shipmentNo: 'EAC-2027-0001',
      });
    });

    it('rejects sequence numbers above 9999', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-12-31T23:59:59.000Z'));

      prismaServiceMock.shipment.findFirst.mockResolvedValue({
        shipmentNo: 'EAC-2026-9999',
      });

      await expect(service.getNextShipmentNumber()).rejects.toThrow(
        'Shipment number sequence for 2026 is exhausted.',
      );
    });

    it('retries after a shipmentNo P2002 collision', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-23T12:00:00.000Z'));

      prismaServiceMock.customer.findUnique.mockResolvedValue({
        id: 'customer-1',
      });

      prismaServiceMock.shipment.findFirst
        .mockResolvedValueOnce({
          shipmentNo: 'EAC-2026-0002',
        })
        .mockResolvedValueOnce({
          shipmentNo: 'EAC-2026-0003',
        });

      prismaServiceMock.shipment.create
        .mockRejectedValueOnce({
          code: 'P2002',
          meta: {
            target: ['shipmentNo'],
          },
        })
        .mockResolvedValueOnce({
          id: 'shipment-new',
          shipmentNo: 'EAC-2026-0004',
          customerId: 'customer-1',
        });

      const dto = {
        customerId: 'customer-1',
        status: 'DRAFT',
      } as never;

      const result = await service.create(dto);

      expect(prismaServiceMock.shipment.create).toHaveBeenCalledTimes(2);

      expect(prismaServiceMock.shipment.findFirst).toHaveBeenCalledTimes(2);

      expect(result).toEqual(
        expect.objectContaining({
          shipmentNo: 'EAC-2026-0004',
        }),
      );
    });

    it('does not retry a non-shipmentNo Prisma error', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-23T12:00:00.000Z'));

      prismaServiceMock.customer.findUnique.mockResolvedValue({
        id: 'customer-1',
      });

      prismaServiceMock.shipment.findFirst.mockResolvedValue({
        shipmentNo: 'EAC-2026-0002',
      });

      const prismaError = {
        code: 'P2002',
        meta: {
          target: ['bookingReference'],
        },
      };

      prismaServiceMock.shipment.create.mockRejectedValue(prismaError);

      const dto = {
        customerId: 'customer-1',
        status: 'DRAFT',
      } as never;

      await expect(service.create(dto)).rejects.toBe(prismaError);

      expect(prismaServiceMock.shipment.create).toHaveBeenCalledTimes(1);
    });
  });

  it('rejects tracking email when the customer has no email', async () => {
    prismaServiceMock.shipment.findUnique.mockResolvedValue({
      id: 'shipment-1',
      shipmentNo: 'EAC-2026-0001',
      status: 'DRAFT',
      customer: {
        companyName: 'Example Logistics',
        firstName: 'Test',
        lastName: 'Customer',
        email: null,
        mobile: '+491701234567',
        phone: null,
      },
    });

    await expect(service.sendTrackingEmail('shipment-1')).rejects.toThrow(
      'This customer has no email address. Please add one in Customers before sending tracking updates.',
    );

    expect(
      notificationsServiceMock.sendShipmentTrackingEmail,
    ).not.toHaveBeenCalled();

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).not.toHaveBeenCalled();
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
        notificationType: 'TRACKING_EMAIL_SENT',
        provider: 'GMAIL_API',
        sentAt: expect.any(Date),
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        message: 'Tracking email sent to Example Logistics.',
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
      'Failed to send tracking email. Please try again.',
    );

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'shipment-1',
        recipient: 'customer@example.com',
        notificationType: 'TRACKING_EMAIL_FAILED',
        provider: 'GMAIL_API',
        errorMessage:
          'Tracking email provider returned an unsuccessful result.',
      }),
    });
  });

  it('records SENT history when the WhatsApp provider succeeds', async () => {
    const shipment = {
      id: 'shipment-1',
      shipmentNo: 'EAC-2026-0001',
      status: 'DRAFT',
      customer: {
        companyName: null,
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@example.com',
        mobile: '+491701234567',
        phone: '+492281234567',
      },
    };

    prismaServiceMock.shipment.findUnique.mockResolvedValue(shipment);
    notificationsServiceMock.sendShipmentTrackingWhatsApp.mockResolvedValue(
      true,
    );

    prismaServiceMock.shipmentNotificationHistory.create.mockResolvedValue({
      id: 'whatsapp-history-1',
    });

    const result = await service.sendTrackingWhatsApp('shipment-1');

    expect(
      notificationsServiceMock.sendShipmentTrackingWhatsApp,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        shipmentId: 'shipment-1',
        shipmentNo: 'EAC-2026-0001',
        customerPhone: '+491701234567',
        status: 'DRAFT',
      }),
    );

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'shipment-1',
        channel: 'WHATSAPP',
        recipient: '+491701234567',
        notificationType: 'TRACKING',
        shipmentStatus: 'DRAFT',
        deliveryStatus: 'SENT',
        provider: 'WHATSAPP',
        sentAt: expect.any(Date),
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        recipient: '+491701234567',
        status: 'DRAFT',
        notificationHistoryId: 'whatsapp-history-1',
      }),
    );
  });

  it('records FAILED history when the WhatsApp provider returns false', async () => {
    const shipment = {
      id: 'shipment-1',
      shipmentNo: 'EAC-2026-0001',
      status: 'DRAFT',
      customer: {
        companyName: null,
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@example.com',
        mobile: null,
        phone: '+492281234567',
      },
    };

    prismaServiceMock.shipment.findUnique.mockResolvedValue(shipment);
    notificationsServiceMock.sendShipmentTrackingWhatsApp.mockResolvedValue(
      false,
    );

    prismaServiceMock.shipmentNotificationHistory.create.mockResolvedValue({
      id: 'whatsapp-history-failed',
    });

    await expect(service.sendTrackingWhatsApp('shipment-1')).rejects.toThrow(
      'Tracking WhatsApp message could not be sent.',
    );

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).toHaveBeenCalledWith({
      data: {
        shipmentId: 'shipment-1',
        channel: 'WHATSAPP',
        recipient: '+492281234567',
        notificationType: 'TRACKING',
        shipmentStatus: 'DRAFT',
        deliveryStatus: 'FAILED',
        provider: 'WHATSAPP',
        errorMessage:
          'Tracking WhatsApp provider returned an unsuccessful result.',
      },
    });
  });

  it('records FAILED history when the WhatsApp provider throws an exception', async () => {
    const shipment = {
      id: 'shipment-1',
      shipmentNo: 'EAC-2026-0001',
      status: 'IN_TRANSIT',
      customer: {
        companyName: 'Example Logistics',
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@example.com',
        mobile: '+491701234567',
        phone: null,
      },
    };

    prismaServiceMock.shipment.findUnique.mockResolvedValue(shipment);

    notificationsServiceMock.sendShipmentTrackingWhatsApp.mockRejectedValue(
      new Error('WhatsApp network failure'),
    );

    prismaServiceMock.shipmentNotificationHistory.create.mockResolvedValue({
      id: 'whatsapp-history-exception',
    });

    await expect(service.sendTrackingWhatsApp('shipment-1')).rejects.toThrow(
      'WhatsApp network failure',
    );

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).toHaveBeenCalledWith({
      data: {
        shipmentId: 'shipment-1',
        channel: 'WHATSAPP',
        recipient: '+491701234567',
        notificationType: 'TRACKING',
        shipmentStatus: 'IN_TRANSIT',
        deliveryStatus: 'FAILED',
        provider: 'WHATSAPP',
        errorMessage: 'WhatsApp network failure',
      },
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

  it('rejects an invalid customer email before calling the provider', async () => {
    prismaServiceMock.shipment.findUnique.mockResolvedValue({
      id: 'shipment-1',
      shipmentNo: 'EAC-2026-0001',
      status: 'DRAFT',
      originCity: 'Hamburg',
      originCountry: 'Germany',
      destinationCity: 'Tripoli',
      destinationCountry: 'Libya',
      estimatedArrival: null,
      customer: {
        id: 'customer-1',
        companyName: 'logistk GMBH',
        firstName: 'Saleh',
        lastName: 'Alkarabubi',
        email: 'not-an-email',
        phone: null,
      },
    } as never);

    await expect(service.sendTrackingEmail('shipment-1')).rejects.toThrow(
      'Customer email address appears invalid. Please check and correct it.',
    );

    expect(
      notificationsServiceMock.sendShipmentTrackingEmail,
    ).not.toHaveBeenCalled();

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).not.toHaveBeenCalled();
  });

  it('records the authenticated administrator in tracking email history', async () => {
    prismaServiceMock.shipment.findUnique.mockResolvedValue({
      id: 'shipment-audit',
      shipmentNo: 'EAC-2026-0001',
      customerId: 'customer-1',
      status: 'DRAFT',
      originCity: 'Hamburg',
      originCountry: 'Germany',
      destinationCity: 'Tripoli',
      destinationCountry: 'Libya',
      estimatedArrival: null,
      customer: {
        id: 'customer-1',
        companyName: 'logistk GMBH',
        firstName: 'Saleh',
        lastName: 'Alkarabubi',
        email: 'customer@example.com',
        phone: null,
        mobile: null,
      },
    } as never);

    notificationsServiceMock.sendShipmentTrackingEmail.mockResolvedValue(true);

    prismaServiceMock.shipmentNotificationHistory.create.mockResolvedValue({
      id: 'history-audit',
    } as never);

    await service.sendTrackingEmail('shipment-audit', {
      id: 'admin-1',
      email: 'admin@euroatlas.example',
      firstName: 'EuroAtlas',
      lastName: 'Administrator',
    });

    expect(
      prismaServiceMock.shipmentNotificationHistory.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shipmentId: 'shipment-audit',
        customerId: 'customer-1',
        recipient: 'customer@example.com',
        notificationType: 'TRACKING_EMAIL_SENT',
        sentById: 'admin-1',
        sentByEmail: 'admin@euroatlas.example',
        sentByName: 'EuroAtlas Administrator',
        sentAt: expect.any(Date),
      }),
    });
  });
});
