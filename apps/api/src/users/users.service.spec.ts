import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const prismaServiceMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const bcryptHashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('normalizes email before querying Prisma', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'employee@example.com',
      };

      prismaServiceMock.user.findUnique.mockResolvedValue(existingUser);

      const result = await service.findByEmail('  EMPLOYEE@EXAMPLE.COM  ');

      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'employee@example.com',
        },
      });

      expect(result).toBe(existingUser);
    });
  });

  describe('findAll', () => {
    it('returns safe user fields ordered by newest first', async () => {
      prismaServiceMock.user.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prismaServiceMock.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: '  EMPLOYEE@EXAMPLE.COM  ',
      firstName: '  John  ',
      lastName: '  Smith  ',
      password: 'StrongPassword123!',
      role: 'EMPLOYEE',
      isActive: false,
    };

    it('rejects duplicate email addresses', async () => {
      prismaServiceMock.user.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(service.create(createUserDto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'employee@example.com',
        },
      });

      expect(bcryptHashMock).not.toHaveBeenCalled();
      expect(prismaServiceMock.user.create).not.toHaveBeenCalled();
    });

    it('hashes password and persists normalized user data', async () => {
      prismaServiceMock.user.findUnique.mockResolvedValue(null);

      bcryptHashMock.mockResolvedValue('hashed-password' as never);

      const createdUser = {
        id: 'user-2',
        email: 'employee@example.com',
        firstName: 'John',
        lastName: 'Smith',
        role: 'EMPLOYEE',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaServiceMock.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(bcryptHashMock).toHaveBeenCalledWith('StrongPassword123!', 12);

      expect(prismaServiceMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'employee@example.com',
          firstName: 'John',
          lastName: 'Smith',
          password: 'hashed-password',
          role: 'EMPLOYEE',
          isActive: false,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toBe(createdUser);
    });

    it('defaults isActive to true when omitted', async () => {
      prismaServiceMock.user.findUnique.mockResolvedValue(null);

      bcryptHashMock.mockResolvedValue('hashed-password' as never);

      prismaServiceMock.user.create.mockResolvedValue({
        id: 'user-3',
      });

      const dtoWithoutStatus: CreateUserDto = {
        email: 'customer@example.com',
        firstName: 'Customer',
        lastName: 'One',
        password: 'StrongPassword456!',
        role: 'CUSTOMER',
      };

      await service.create(dtoWithoutStatus);

      expect(prismaServiceMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'CUSTOMER',
            isActive: true,
          }),
        }),
      );
    });
  });
});
