import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TrackingService } from './tracking.service';

describe('Public shipment tracking', () => {
  function createService(shipment: Record<string, unknown> | null) {
    const prisma = {
      shipment: {
        findUnique: jest.fn().mockResolvedValue(shipment),
      },
    };

    const service = new TrackingService(prisma as never);

    return {
      service,
      prisma,
    };
  }

  it('rejects an empty shipment number', async () => {
    const { service } = createService(null);

    await expect(service.findPublicByShipmentNo('   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects excessively long shipment numbers', async () => {
    const { service } = createService(null);

    await expect(
      service.findPublicByShipmentNo('A'.repeat(65)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects malformed shipment numbers', async () => {
    const { service } = createService(null);

    await expect(
      service.findPublicByShipmentNo('EAC/2026/0001'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes public shipment numbers', async () => {
    const shipment = {
      shipmentNo: 'EAC-2026-0001',

      status: 'IN_TRANSIT',

      tracking: [],
    };

    const { service, prisma } = createService(shipment);

    await service.findPublicByShipmentNo(' eac-2026-0001 ');

    expect(prisma.shipment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          shipmentNo: 'EAC-2026-0001',
        },
      }),
    );
  });

  it('returns only public shipment tracking information', async () => {
    const shipment = {
      shipmentNo: 'EAC-2026-0001',

      status: 'IN_TRANSIT',

      originCountry: 'Germany',

      destinationCountry: 'Libya',

      tracking: [],
    };

    const { service, prisma } = createService(shipment);

    const result = await service.findPublicByShipmentNo(' EAC-2026-0001 ');

    expect(result).toBe(shipment);

    expect(prisma.shipment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          shipmentNo: 'EAC-2026-0001',
        },

        select: expect.any(Object),
      }),
    );

    const call = prisma.shipment.findUnique.mock.calls[0][0];

    expect(call.select.customer).toBeUndefined();
  });

  it('returns not found for an unknown shipment', async () => {
    const { service } = createService(null);

    await expect(
      service.findPublicByShipmentNo('DOES-NOT-EXIST'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
