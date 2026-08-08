import {
  InspectionApprovalStatus,
  InspectionStatus,
  InspectionType,
  ShipmentStatus,
  VehicleStatus,
} from '../generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import { ShipmentsService } from '../src/shipments/shipments.service';

describe('Shipment workflow database integration', () => {
  let prisma: PrismaService;
  let shipmentsService: ShipmentsService;

  const testPrefix = 'PHASE40B-';

  let customerId: string;
  let shipmentId: string;
  let vehicleId: string;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || !databaseUrl.includes('euroatlas_cargo_test')) {
      throw new Error(
        'Refusing to run database integration tests outside euroatlas_cargo_test.',
      );
    }

    prisma = new PrismaService();

    await prisma.$connect();

    shipmentsService = new ShipmentsService(prisma);
  });

  beforeEach(async () => {
    await cleanup();

    const customer = await prisma.customer.create({
      data: {
        customerNo: `${testPrefix}CUSTOMER`,
        firstName: 'Integration',
        lastName: 'Test',
        email: 'phase40b@example.test',
        isActive: true,
      },
    });

    customerId = customer.id;

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNo: `${testPrefix}SHIPMENT`,
        customerId,
        status: ShipmentStatus.RECEIVED,
        originCountry: 'Germany',
        originCity: 'Bonn',
        originPort: 'Hamburg',
        destinationCountry: 'Libya',
        destinationCity: 'Tripoli',
        destinationPort: 'Tripoli Port',
        bookingReference: 'BOOK-40B',
        isActive: true,
      },
    });

    shipmentId = shipment.id;

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNo: `${testPrefix}VEHICLE`,
        shipmentId,
        vin: 'WVWZZZ1JZXW000040',
        make: 'Volkswagen',
        model: 'Golf',
        year: 2024,
        status: VehicleStatus.READY_FOR_LOADING,
        isActive: true,
      },
    });

    vehicleId = vehicle.id;

    await prisma.vehicleInspection.create({
      data: {
        inspectionNo: `${testPrefix}INSPECTION`,
        vehicleId,
        type: InspectionType.PRE_LOADING,
        status: InspectionStatus.COMPLETED,
        approvalStatus: InspectionApprovalStatus.APPROVED,
        approvedBy: 'Phase 40B Test',
        approvedAt: new Date(),
        condition: 'GOOD',
        location: 'Hamburg',
        inspectorName: 'Integration Tester',
        hasKeys: true,
        isRunning: true,
        hasVisibleDamage: false,
      },
    });

    await prisma.shipmentDocument.create({
      data: {
        shipmentId,
        category: 'TEST_DOCUMENT',
        title: 'Integration test document',
        originalName: 'test-document.pdf',
        storedName: `${testPrefix}document.pdf`,
        mimeType: 'application/pdf',
        size: 1024,
        uploadedBy: 'Phase 40B Test',
      },
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    if (!prisma) {
      return;
    }

    const shipments = await prisma.shipment.findMany({
      where: {
        shipmentNo: {
          startsWith: testPrefix,
        },
      },
      select: {
        id: true,
      },
    });

    const shipmentIds = shipments.map((shipment) => shipment.id);

    if (shipmentIds.length > 0) {
      await prisma.vehicle.deleteMany({
        where: {
          shipmentId: {
            in: shipmentIds,
          },
        },
      });

      await prisma.shipment.deleteMany({
        where: {
          id: {
            in: shipmentIds,
          },
        },
      });
    }

    await prisma.customer.deleteMany({
      where: {
        customerNo: {
          startsWith: testPrefix,
        },
      },
    });
  }

  it('moves a real shipment through the operational workflow and writes tracking history', async () => {
    const initialReadiness = await shipmentsService.getReadiness(shipmentId);

    expect(initialReadiness.isReady).toBe(true);

    await shipmentsService.dispatch(shipmentId, {
      status: ShipmentStatus.LOADED,
      location: 'Hamburg Port',
      dispatchedBy: 'Phase 40B',
    });

    await shipmentsService.dispatch(shipmentId, {
      status: ShipmentStatus.IN_TRANSIT,
      location: 'Hamburg Port',
      dispatchedBy: 'Phase 40B',
    });

    await shipmentsService.markArrived(shipmentId, {
      location: 'Tripoli Port',
      receivedBy: 'Phase 40B',
    });

    await shipmentsService.startCustomsClearance(shipmentId, {
      location: 'Tripoli Customs',
      handledBy: 'Phase 40B',
      customsReference: 'CUSTOMS-40B',
    });

    await shipmentsService.markReadyForDelivery(shipmentId, {
      location: 'Tripoli Warehouse',
      releasedBy: 'Phase 40B',
      releaseReference: 'RELEASE-40B',
    });

    await shipmentsService.markDelivered(shipmentId, {
      location: 'Tripoli',
      deliveredTo: 'Integration Customer',
      proofReference: 'POD-40B',
    });

    const shipment = await prisma.shipment.findUniqueOrThrow({
      where: {
        id: shipmentId,
      },
    });

    expect(shipment.status).toBe(ShipmentStatus.DELIVERED);

    expect(shipment.actualDeparture).not.toBeNull();

    expect(shipment.actualArrival).not.toBeNull();

    const tracking = await prisma.shipmentTracking.findMany({
      where: {
        shipmentId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(tracking.map((event) => event.status)).toEqual([
      ShipmentStatus.LOADED,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.ARRIVED,
      ShipmentStatus.CUSTOMS_CLEARANCE,
      ShipmentStatus.READY_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ]);

    expect(
      tracking.every((event) => event.eventType === 'STATUS_CHANGED'),
    ).toBe(true);
  });

  it('rejects dispatch when the real database fixture is not ready', async () => {
    await prisma.shipmentDocument.deleteMany({
      where: {
        shipmentId,
      },
    });

    const readiness = await shipmentsService.getReadiness(shipmentId);

    expect(readiness.isReady).toBe(false);

    expect(
      readiness.blockers.some(
        (blocker) => blocker.key === 'documents-uploaded',
      ),
    ).toBe(true);

    await expect(
      shipmentsService.dispatch(shipmentId, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).rejects.toMatchObject({
      status: 409,
    });

    const unchangedShipment = await prisma.shipment.findUniqueOrThrow({
      where: {
        id: shipmentId,
      },
    });

    expect(unchangedShipment.status).toBe(ShipmentStatus.RECEIVED);

    const trackingCount = await prisma.shipmentTracking.count({
      where: {
        shipmentId,
      },
    });

    expect(trackingCount).toBe(0);
  });
});
