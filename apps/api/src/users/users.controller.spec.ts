import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { UsersController } from './users.controller';
import type { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new UsersController(
      usersServiceMock as unknown as UsersService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires the ADMIN role', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, UsersController);

    expect(roles).toEqual(['ADMIN']);
  });

  it('delegates user listing to UsersService', async () => {
    const users = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    ];

    usersServiceMock.findAll.mockResolvedValue(users);

    const result = await controller.findAll();

    expect(usersServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(result).toBe(users);
  });

  it('delegates user creation to UsersService', async () => {
    const dto: CreateUserDto = {
      email: 'employee@example.com',
      firstName: 'John',
      lastName: 'Smith',
      password: 'StrongPassword123!',
      role: 'EMPLOYEE',
      isActive: true,
    };

    const createdUser = {
      id: 'user-2',
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      isActive: true,
    };

    usersServiceMock.create.mockResolvedValue(createdUser);

    const result = await controller.create(dto);

    expect(usersServiceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(createdUser);
  });
});
