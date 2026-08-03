import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN';
  };
}

describe('AuthController', () => {
  let controller: AuthController;

  const loginResult: LoginResult = {
    accessToken: 'test-access-token',
    user: {
      id: 'test-user-id',
      email: 'admin@euroatlascargo.com',
      firstName: 'Saleh',
      lastName: 'Alkarabubi',
      role: 'ADMIN',
    },
  };

  const authServiceMock = {
    login: jest.fn().mockResolvedValue(loginResult),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return login information', async () => {
    const result = await controller.login({
      email: 'admin@euroatlascargo.com',
      password: 'ChangeMe123!',
    });

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'admin@euroatlascargo.com',
      password: 'ChangeMe123!',
    });

    expect(result).toEqual(loginResult);
  });
});
