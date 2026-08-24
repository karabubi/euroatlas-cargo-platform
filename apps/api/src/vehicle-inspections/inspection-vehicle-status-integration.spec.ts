import {
  InspectionApprovalStatus,
  InspectionStatus,
  InspectionType,
  VehicleStatus,
} from '../../generated/prisma/enums';
import { VehicleInspectionsService } from './vehicle-inspections.service';

describe('Vehicle inspection approval vehicle-status integration', () => {
  const user = {
    id: 'admin-1',
    email: 'admin@euroatlascargo.com',
    firstName: 'Admin',
    lastName: 'User',
  };

  const baseInspection = {
    id: 'inspection-1',
    inspectionNo: 'INS-2026-0001',
    vehicleId: 'vehicle-1',
    type: InspectionType.RECEIVING,
    status: InspectionStatus.COMPLETED,
    approvalStatus: InspectionApprovalStatus.PENDING,
    approvalNote: null,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
  };

  let transaction: {
    vehicle: {
      updateMany: jest.Mock;
    };
    inspectionApprovalHistory: {
      create: jest.Mock;
    };
    vehicleInspection: {
      update: jest.Mock;
    };
  };

  let prisma: {
    vehicleInspection: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let service: VehicleInspectionsService;

  beforeEach(() => {
    transaction = {
      vehicle: {
        updateMany: jest.fn().mockResolvedValue({
          count: 1,
        }),
      },
      inspectionApprovalHistory: {
        create: jest.fn().mockResolvedValue({
          id: 'history-1',
        }),
      },
      vehicleInspection: {
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({
              ...baseInspection,
              ...data,
            }),
          ),
      },
    };

    prisma = {
      vehicleInspection: {
        findUnique: jest.fn().mockResolvedValue(baseInspection),
      },
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    service = new VehicleInspectionsService(prisma as never);
  });

  it('advances RECEIVED vehicle when a RECEIVING inspection is approved', async () => {
    const result = await service.approve(
      baseInspection.id,
      user,
      'Receiving inspection approved.',
    );

    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        id: baseInspection.vehicleId,
        status: VehicleStatus.RECEIVED,
      },
      data: {
        status: VehicleStatus.INSPECTED,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        approvalStatus: InspectionApprovalStatus.APPROVED,
      }),
    );
  });

  it('uses one transaction for vehicle advancement and approval', async () => {
    await service.approve(baseInspection.id, user);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.inspectionApprovalHistory.create).toHaveBeenCalledTimes(
      1,
    );

    expect(transaction.vehicleInspection.update).toHaveBeenCalledTimes(1);
  });

  it('advances INSPECTED vehicle to READY_FOR_LOADING when PRE_LOADING inspection is approved', async () => {
    prisma.vehicleInspection.findUnique.mockResolvedValue({
      ...baseInspection,
      type: InspectionType.PRE_LOADING,
    });

    await service.approve(baseInspection.id, user);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        id: baseInspection.vehicleId,
        status: VehicleStatus.INSPECTED,
      },
      data: {
        status: VehicleStatus.READY_FOR_LOADING,
      },
    });

    expect(transaction.inspectionApprovalHistory.create).toHaveBeenCalled();

    expect(transaction.vehicleInspection.update).toHaveBeenCalled();
  });

  it('uses INSPECTED as the compare-and-set guard for PRE_LOADING approval', async () => {
    prisma.vehicleInspection.findUnique.mockResolvedValue({
      ...baseInspection,
      type: InspectionType.PRE_LOADING,
    });

    transaction.vehicle.updateMany.mockResolvedValue({
      count: 0,
    });

    const result = await service.approve(baseInspection.id, user);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        id: baseInspection.vehicleId,
        status: VehicleStatus.INSPECTED,
      },
      data: {
        status: VehicleStatus.READY_FOR_LOADING,
      },
    });

    expect(transaction.inspectionApprovalHistory.create).toHaveBeenCalled();

    expect(transaction.vehicleInspection.update).toHaveBeenCalled();

    expect(result).toEqual(
      expect.objectContaining({
        approvalStatus: InspectionApprovalStatus.APPROVED,
      }),
    );
  });

  it('does not advance vehicle for GENERAL approval', async () => {
    prisma.vehicleInspection.findUnique.mockResolvedValue({
      ...baseInspection,
      type: InspectionType.GENERAL,
    });

    await service.approve(baseInspection.id, user);

    expect(transaction.vehicle.updateMany).not.toHaveBeenCalled();
  });

  it('guards advancement with current vehicle status RECEIVED', async () => {
    transaction.vehicle.updateMany.mockResolvedValue({
      count: 0,
    });

    await service.approve(baseInspection.id, user);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        id: baseInspection.vehicleId,
        status: VehicleStatus.RECEIVED,
      },
      data: {
        status: VehicleStatus.INSPECTED,
      },
    });

    expect(transaction.vehicleInspection.update).toHaveBeenCalled();
  });

  it('does not touch vehicle when inspection type is not RECEIVING', async () => {
    prisma.vehicleInspection.findUnique.mockResolvedValue({
      ...baseInspection,
      type: InspectionType.ARRIVAL,
    });

    await service.approve(baseInspection.id, user);

    expect(transaction.vehicle.updateMany).not.toHaveBeenCalled();

    expect(transaction.inspectionApprovalHistory.create).toHaveBeenCalled();
  });

  it('propagates vehicle update failure before approval writes', async () => {
    transaction.vehicle.updateMany.mockRejectedValue(
      new Error('vehicle update failed'),
    );

    await expect(service.approve(baseInspection.id, user)).rejects.toThrow(
      'vehicle update failed',
    );

    expect(transaction.inspectionApprovalHistory.create).not.toHaveBeenCalled();

    expect(transaction.vehicleInspection.update).not.toHaveBeenCalled();
  });
});

describe('Vehicle inspection approval integration edge cases', () => {
  const user = {
    id: 'admin-1',
    email: 'admin@euroatlascargo.com',
    firstName: 'Admin',
    lastName: 'User',
  };

  const rejectedReceivingInspection = {
    id: 'inspection-rejected',
    inspectionNo: 'INS-2026-0001',
    vehicleId: 'vehicle-1',
    type: InspectionType.RECEIVING,
    status: InspectionStatus.COMPLETED,
    approvalStatus: InspectionApprovalStatus.REJECTED,
    approvalNote: 'Previous rejection',
    approvedBy: null,
    approvedAt: null,
    rejectedBy: 'reviewer@example.com',
    rejectedAt: new Date(),
  };

  function createHarness(
    inspection = rejectedReceivingInspection,
    vehicleUpdateCount = 1,
  ) {
    const transaction = {
      vehicle: {
        updateMany: jest.fn().mockResolvedValue({
          count: vehicleUpdateCount,
        }),
      },
      inspectionApprovalHistory: {
        create: jest.fn().mockResolvedValue({
          id: 'history-edge',
        }),
      },
      vehicleInspection: {
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({
              ...inspection,
              ...data,
            }),
          ),
      },
    };

    const prisma = {
      vehicleInspection: {
        findUnique: jest.fn().mockResolvedValue(inspection),
      },
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    const service = new VehicleInspectionsService(prisma as never);

    return {
      service,
      prisma,
      transaction,
    };
  }

  it('allows a previously REJECTED completed RECEIVING inspection to be approved', async () => {
    const { service, transaction } = createHarness();

    const result = await service.approve(
      rejectedReceivingInspection.id,
      user,
      'Reviewed again and approved.',
    );

    expect(transaction.inspectionApprovalHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        inspectionId: rejectedReceivingInspection.id,
        fromStatus: InspectionApprovalStatus.REJECTED,
        toStatus: InspectionApprovalStatus.APPROVED,
      }),
    });

    expect(result).toEqual(
      expect.objectContaining({
        approvalStatus: InspectionApprovalStatus.APPROVED,
        rejectedBy: null,
        rejectedAt: null,
      }),
    );
  });

  it('still approves when vehicle guarded update matches zero rows', async () => {
    const { service, transaction } = createHarness(
      rejectedReceivingInspection,
      0,
    );

    const result = await service.approve(rejectedReceivingInspection.id, user);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.inspectionApprovalHistory.create).toHaveBeenCalledTimes(
      1,
    );

    expect(transaction.vehicleInspection.update).toHaveBeenCalledTimes(1);

    expect(result).toEqual(
      expect.objectContaining({
        approvalStatus: InspectionApprovalStatus.APPROVED,
      }),
    );
  });

  it('uses RECEIVED as a compare-and-set guard before INSPECTED', async () => {
    const { service, transaction } = createHarness(
      rejectedReceivingInspection,
      0,
    );

    await service.approve(rejectedReceivingInspection.id, user);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        id: rejectedReceivingInspection.vehicleId,
        status: VehicleStatus.RECEIVED,
      },
      data: {
        status: VehicleStatus.INSPECTED,
      },
    });
  });

  it('keeps approval transaction atomic when approval history fails', async () => {
    const { service, transaction } = createHarness();

    transaction.inspectionApprovalHistory.create.mockRejectedValue(
      new Error('approval history failed'),
    );

    await expect(
      service.approve(rejectedReceivingInspection.id, user),
    ).rejects.toThrow('approval history failed');

    expect(transaction.vehicleInspection.update).not.toHaveBeenCalled();
  });
});

describe('PRE_LOADING approval integration edge cases', () => {
  const user = {
    id: 'admin-preload',
    email: 'admin@euroatlascargo.com',
    firstName: 'Admin',
    lastName: 'User',
  };

  const preLoadingInspection = {
    id: 'inspection-preloading',
    inspectionNo: 'INS-PRELOAD-0001',
    vehicleId: 'vehicle-preloading',
    type: InspectionType.PRE_LOADING,
    status: InspectionStatus.COMPLETED,
    approvalStatus: InspectionApprovalStatus.PENDING,
    approvalNote: null,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
  };

  function createHarness(vehicleUpdateCount = 1) {
    const transaction = {
      vehicle: {
        updateMany: jest.fn().mockResolvedValue({
          count: vehicleUpdateCount,
        }),
      },
      inspectionApprovalHistory: {
        create: jest.fn().mockResolvedValue({
          id: 'preloading-history',
        }),
      },
      vehicleInspection: {
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({
              ...preLoadingInspection,
              ...data,
            }),
          ),
      },
    };

    const prisma = {
      vehicleInspection: {
        findUnique: jest.fn().mockResolvedValue(preLoadingInspection),
      },
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    const service = new VehicleInspectionsService(prisma as never);

    return {
      service,
      prisma,
      transaction,
    };
  }

  it('PRE_LOADING approval remains atomic when vehicle update fails', async () => {
    const { service, transaction } = createHarness();

    transaction.vehicle.updateMany.mockRejectedValue(
      new Error('PRE_LOADING vehicle update failed'),
    );

    await expect(
      service.approve(preLoadingInspection.id, user),
    ).rejects.toThrow('PRE_LOADING vehicle update failed');

    expect(transaction.inspectionApprovalHistory.create).not.toHaveBeenCalled();

    expect(transaction.vehicleInspection.update).not.toHaveBeenCalled();
  });

  it('PRE_LOADING approval still succeeds when the guarded vehicle update matches zero rows', async () => {
    const { service, transaction } = createHarness(0);

    const result = await service.approve(preLoadingInspection.id, user);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        id: preLoadingInspection.vehicleId,
        status: VehicleStatus.INSPECTED,
      },
      data: {
        status: VehicleStatus.READY_FOR_LOADING,
      },
    });

    expect(transaction.inspectionApprovalHistory.create).toHaveBeenCalledTimes(
      1,
    );

    expect(transaction.vehicleInspection.update).toHaveBeenCalledTimes(1);

    expect(result).toEqual(
      expect.objectContaining({
        approvalStatus: InspectionApprovalStatus.APPROVED,
      }),
    );
  });

  it('PRE_LOADING approval uses the same transaction as approval history and inspection update', async () => {
    const { service, prisma, transaction } = createHarness();

    await service.approve(preLoadingInspection.id, user);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.inspectionApprovalHistory.create).toHaveBeenCalledTimes(
      1,
    );

    expect(transaction.vehicleInspection.update).toHaveBeenCalledTimes(1);
  });
});
