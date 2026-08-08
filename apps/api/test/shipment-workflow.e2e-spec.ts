import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { ShipmentStatus } from '../generated/prisma/enums';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { ShipmentsController } from '../src/shipments/shipments.controller';
import { ShipmentsService } from '../src/shipments/shipments.service';

describe('Shipment workflow HTTP routes (e2e)', () => {
  let app: INestApplication<App>;

  const dispatch = jest.fn();

  const markArrived = jest.fn();

  const startCustomsClearance = jest.fn();

  const markReadyForDelivery = jest.fn();

  const markDelivered = jest.fn();

  const cancel = jest.fn();

  const shipmentsServiceMock = {
    dispatch,
    markArrived,
    startCustomsClearance,
    markReadyForDelivery,
    markDelivered,
    cancel,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ShipmentsController],

      providers: [
        {
          provide: ShipmentsService,
          useValue: shipmentsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

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
    await app.close();
  });

  it('POST /api/shipments/:id/dispatch forwards a valid LOADED request', async () => {
    dispatch.mockResolvedValue({
      message: 'Shipment dispatched successfully.',
    });

    const body = {
      status: ShipmentStatus.LOADED,
      location: 'Hamburg Port',
      dispatchedBy: 'Operations Team',
    };

    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/dispatch')
      .send(body)
      .expect(201);

    expect(dispatch).toHaveBeenCalledWith('shipment-001', body);
  });

  it('rejects an illegal dispatch DTO status before the service is called', async () => {
    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/dispatch')
      .send({
        status: ShipmentStatus.DELIVERED,
        location: 'Hamburg Port',
      })
      .expect(400);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('rejects dispatch without location', async () => {
    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/dispatch')
      .send({
        status: ShipmentStatus.LOADED,
      })
      .expect(400);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('POST /api/shipments/:id/arrival forwards a valid request', async () => {
    markArrived.mockResolvedValue({
      message: 'Shipment arrival recorded successfully.',
    });

    const body = {
      location: 'Tripoli Port',
      receivedBy: 'Arrival Team',
    };

    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/arrival')
      .send(body)
      .expect(201);

    expect(markArrived).toHaveBeenCalledWith('shipment-001', body);
  });

  it('POST /api/shipments/:id/customs-clearance forwards a valid request', async () => {
    startCustomsClearance.mockResolvedValue({
      message: 'Customs clearance started successfully.',
    });

    const body = {
      location: 'Tripoli Customs',
      handledBy: 'Customs Team',
      customsReference: 'CUS-001',
    };

    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/customs-clearance')
      .send(body)
      .expect(201);

    expect(startCustomsClearance).toHaveBeenCalledWith('shipment-001', body);
  });

  it('POST /api/shipments/:id/ready-for-delivery forwards a valid request', async () => {
    markReadyForDelivery.mockResolvedValue({
      message: 'Shipment marked ready for delivery.',
    });

    const body = {
      location: 'Tripoli Warehouse',
      releasedBy: 'Delivery Team',
      releaseReference: 'REL-001',
    };

    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/ready-for-delivery')
      .send(body)
      .expect(201);

    expect(markReadyForDelivery).toHaveBeenCalledWith('shipment-001', body);
  });

  it('POST /api/shipments/:id/delivery forwards a valid request', async () => {
    markDelivered.mockResolvedValue({
      message: 'Shipment delivered successfully.',
    });

    const body = {
      location: 'Tripoli Customer Address',
      deliveredTo: 'Customer',
      proofReference: 'POD-001',
    };

    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/delivery')
      .send(body)
      .expect(201);

    expect(markDelivered).toHaveBeenCalledWith('shipment-001', body);
  });

  it('POST /api/shipments/:id/cancel forwards a valid cancellation request', async () => {
    cancel.mockResolvedValue({
      message: 'Shipment cancelled successfully.',
    });

    const body = {
      reason: 'Customer cancelled shipment.',
      cancelledBy: 'Operations Team',
      location: 'Bonn Office',
    };

    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/cancel')
      .send(body)
      .expect(201);

    expect(cancel).toHaveBeenCalledWith('shipment-001', body);
  });

  it('rejects cancellation without a reason', async () => {
    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/cancel')
      .send({
        cancelledBy: 'Operations Team',
      })
      .expect(400);

    expect(cancel).not.toHaveBeenCalled();
  });

  it('rejects non-whitelisted fields', async () => {
    await request(app.getHttpServer())
      .post('/api/shipments/shipment-001/cancel')
      .send({
        reason: 'Customer request',
        maliciousStatus: ShipmentStatus.DELIVERED,
      })
      .expect(400);

    expect(cancel).not.toHaveBeenCalled();
  });
});
