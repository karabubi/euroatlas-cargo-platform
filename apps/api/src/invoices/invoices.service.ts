import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto) {
    await this.ensureCustomerExists(dto.customerId);
    await this.ensureShipmentExists(dto.shipmentId, dto.customerId);

    const invoiceNo = await this.generateInvoiceNumber();

    const items = dto.items.map((item, index) => {
      const quantity = new Prisma.Decimal(item.quantity);

      const unitPrice = new Prisma.Decimal(item.unitPrice);

      const amount = quantity.mul(unitPrice);

      return {
        description: item.description.trim(),
        quantity,
        unitPrice,
        amount,
        position: item.position ?? index,
      };
    });

    const subtotal = items.reduce(
      (sum, item) => sum.add(item.amount),
      new Prisma.Decimal(0),
    );

    const taxRate = new Prisma.Decimal(dto.taxRate ?? 0);

    const taxAmount = subtotal.mul(taxRate).div(100);

    const total = subtotal.add(taxAmount);

    return this.prisma.invoice.create({
      data: {
        invoiceNo,
        customerId: dto.customerId,
        shipmentId: dto.shipmentId,
        currency: dto.currency?.trim().toUpperCase() ?? 'EUR',
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        taxRate,
        subtotal,
        taxAmount,
        total,
        notes: dto.notes?.trim() || null,
        paymentTerms: dto.paymentTerms?.trim() || null,

        items: {
          create: items,
        },
      },

      include: {
        customer: true,
        shipment: true,
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  findAll(search?: string, status?: string) {
    const cleanSearch = search?.trim();
    const cleanStatus = status?.trim();

    return this.prisma.invoice.findMany({
      where: {
        isActive: true,

        ...(cleanStatus
          ? {
              status: cleanStatus as never,
            }
          : {}),

        ...(cleanSearch
          ? {
              OR: [
                {
                  invoiceNo: {
                    contains: cleanSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  customer: {
                    is: {
                      OR: [
                        {
                          firstName: {
                            contains: cleanSearch,
                            mode: 'insensitive',
                          },
                        },
                        {
                          lastName: {
                            contains: cleanSearch,
                            mode: 'insensitive',
                          },
                        },
                        {
                          companyName: {
                            contains: cleanSearch,
                            mode: 'insensitive',
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  shipment: {
                    is: {
                      shipmentNo: {
                        contains: cleanSearch,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        customer: true,
        shipment: true,
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id,
      },

      include: {
        customer: true,
        shipment: true,
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} was not found.`);
    }

    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    await this.findOne(id);

    return this.prisma.invoice.update({
      where: {
        id,
      },

      data: {
        ...(dto.status !== undefined && {
          status: dto.status,
        }),

        ...(dto.currency !== undefined && {
          currency: dto.currency.trim().toUpperCase(),
        }),

        ...(dto.issueDate !== undefined && {
          issueDate: new Date(dto.issueDate),
        }),

        ...(dto.dueDate !== undefined && {
          dueDate: new Date(dto.dueDate),
        }),

        ...(dto.paidAt !== undefined && {
          paidAt: new Date(dto.paidAt),
        }),

        ...(dto.taxRate !== undefined && {
          taxRate: new Prisma.Decimal(dto.taxRate),
        }),

        ...(dto.notes !== undefined && {
          notes: dto.notes.trim() || null,
        }),

        ...(dto.paymentTerms !== undefined && {
          paymentTerms: dto.paymentTerms.trim() || null,
        }),
      },

      include: {
        customer: true,
        shipment: true,
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.invoice.update({
      where: {
        id,
      },

      data: {
        isActive: false,
        status: 'CANCELLED',
      },
    });
  }

  private async generateInvoiceNumber() {
    const year = new Date().getFullYear();

    const invoiceCount = await this.prisma.invoice.count({
      where: {
        invoiceNo: {
          startsWith: `INV-${year}-`,
        },
      },
    });

    const sequence = String(invoiceCount + 1).padStart(6, '0');

    const invoiceNo = `INV-${year}-${sequence}`;

    const existing = await this.prisma.invoice.findUnique({
      where: {
        invoiceNo,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Could not generate a unique invoice number. Please try again.',
      );
    }

    return invoiceNo;
  }

  private async ensureCustomerExists(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} was not found.`);
    }
  }

  private async ensureShipmentExists(shipmentId: string, customerId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: {
        id: shipmentId,
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} was not found.`);
    }

    if (shipment.customerId !== customerId) {
      throw new ConflictException(
        'The selected shipment does not belong to the selected customer.',
      );
    }
  }
}
