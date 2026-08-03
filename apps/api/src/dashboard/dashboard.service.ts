import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type ShipmentStatusResult = {
  status: string;
  total: number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalCustomers,
      totalShipments,
      totalVehicles,
      activeShipments,
      groupedStatuses,
    ] = await Promise.all([
      this.prisma.customer.count(),

      this.prisma.shipment.count(),

      this.prisma.vehicle.count(),

      this.prisma.shipment.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.shipment.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
        orderBy: {
          status: 'asc',
        },
      }),
    ]);

    const shipmentStatuses: ShipmentStatusResult[] = groupedStatuses.map(
      (item) => ({
        status: String(item.status),
        total: item._count._all,
      }),
    );

    return {
      totals: {
        customers: totalCustomers,
        shipments: totalShipments,
        vehicles: totalVehicles,
        activeShipments,
      },
      shipmentStatuses,
      generatedAt: new Date().toISOString(),
    };
  }
}
