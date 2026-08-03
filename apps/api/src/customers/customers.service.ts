import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { customerNo: createCustomerDto.customerNo },
          ...(createCustomerDto.email
            ? [{ email: createCustomerDto.email }]
            : []),
        ],
      },
    });

    if (existingCustomer) {
      throw new ConflictException(
        'A customer with this customer number or email already exists',
      );
    }

    return this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  async findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              {
                customerNo: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                firstName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                companyName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} was not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);

    if (updateCustomerDto.customerNo || updateCustomerDto.email) {
      const duplicateCustomer = await this.prisma.customer.findFirst({
        where: {
          id: {
            not: id,
          },
          OR: [
            ...(updateCustomerDto.customerNo
              ? [{ customerNo: updateCustomerDto.customerNo }]
              : []),
            ...(updateCustomerDto.email
              ? [{ email: updateCustomerDto.email }]
              : []),
          ],
        },
      });

      if (duplicateCustomer) {
        throw new ConflictException(
          'Another customer already uses this customer number or email',
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
