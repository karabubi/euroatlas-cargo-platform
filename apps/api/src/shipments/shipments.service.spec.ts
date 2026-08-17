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
        provider: 'RESEND',
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
        provider: 'RESEND',
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
