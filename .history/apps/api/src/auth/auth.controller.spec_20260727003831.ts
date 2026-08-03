import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController | undefined;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  afterEach(() => {
    controller = undefined;
  });
});
function afterEach(arg0: () => void) {
  throw new Error('Function not implemented.');
}

