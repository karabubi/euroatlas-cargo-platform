import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';

import { ShipmentStatus, TrackingEventType } from '../generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import { TrackingController } from '../src/tracking/tracking.controller';
import { TrackingService } from '../src/tracking/tracking.service';

describe('Tracking workflow protection HTTP API (e2e)', () => {
  let app: INestApplication<App>;

  const shipmentFindUnique = jest.fn();

  const trackingCreate = jest.fn();

  const trackingFindUnique = jest.fn();

  const trackingUpdate = jest.fn();

  const trackingDelete = jest.fn();

  const prismaMock = {
    shipment: {
      findUnique: shipmentFindUnique,
    },

    shipmentTracking: {
      create: trackingCreate,

      findUnique: trackingFindUnique,

      update: trackingUpdate,

      delete: trackingDelete,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'publicTracking',
            ttl: 60_000,
            limit: 20,
          },
        ]),
      ],
      controllers: [TrackingController],

      providers: [
        TrackingService,

        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('allows a normal NOTE_ADDED tracking event', async () => {
    shipmentFindUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
    });

    trackingCreate.mockResolvedValue({
      id: 'tracking-001',
      shipmentId: '11111111-1111-4111-8111-111111111111',
      eventType: TrackingEventType.NOTE_ADDED,
      status: null,
      title: 'Operations note',
    });

    await request(app.getHttpServer())
      .post('/api/tracking')
      .send({
        shipmentId: '11111111-1111-4111-8111-111111111111',
        eventType: TrackingEventType.NOTE_ADDED,
        title: 'Operations note',
      })
      .expect(201);

    expect(trackingCreate).toHaveBeenCalledTimes(1);
  });

  it('rejects STATUS_CHANGED through generic tracking HTTP API', async () => {
    shipmentFindUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
    });

    const response = await request(app.getHttpServer())
      .post('/api/tracking')
      .send({
        shipmentId: '11111111-1111-4111-8111-111111111111',
        eventType: TrackingEventType.STATUS_CHANGED,
        status: ShipmentStatus.DELIVERED,
        title: 'Fake delivery',
      })
      .expect(400);

    const responseBody = response.body as {
      message?: string | string[];
    };

    expect(String(responseBody.message)).toContain(
      'dedicated shipment workflow endpoints',
    );

    expect(trackingCreate).not.toHaveBeenCalled();
  });

  it('rejects shipment status even with NOTE_ADDED', async () => {
    shipmentFindUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
    });

    await request(app.getHttpServer())
      .post('/api/tracking')
      .send({
        shipmentId: '11111111-1111-4111-8111-111111111111',
        eventType: TrackingEventType.NOTE_ADDED,
        status: ShipmentStatus.CANCELLED,
        title: 'Invalid status payload',
      })
      .expect(400);

    expect(trackingCreate).not.toHaveBeenCalled();
  });

  it('rejects editing a workflow-generated status event', async () => {
    trackingFindUnique.mockResolvedValue({
      id: 'tracking-status-001',
      shipmentId: '11111111-1111-4111-8111-111111111111',
      eventType: TrackingEventType.STATUS_CHANGED,
      status: ShipmentStatus.ARRIVED,
      shipment: {
        id: '11111111-1111-4111-8111-111111111111',
        shipmentNo: 'EAC-HTTP-001',
        status: ShipmentStatus.ARRIVED,
      },
    });

    await request(app.getHttpServer())
      .patch('/api/tracking/tracking-status-001')
      .send({
        title: 'Tampered title',
      })
      .expect(400);

    expect(trackingUpdate).not.toHaveBeenCalled();
  });

  it('rejects deleting a workflow-generated status event', async () => {
    trackingFindUnique.mockResolvedValue({
      id: 'tracking-status-001',
      shipmentId: '11111111-1111-4111-8111-111111111111',
      eventType: TrackingEventType.STATUS_CHANGED,
      status: ShipmentStatus.ARRIVED,
      shipment: {
        id: '11111111-1111-4111-8111-111111111111',
        shipmentNo: 'EAC-HTTP-001',
        status: ShipmentStatus.ARRIVED,
      },
    });

    await request(app.getHttpServer())
      .delete('/api/tracking/tracking-status-001')
      .expect(400);

    expect(trackingDelete).not.toHaveBeenCalled();
  });
});
