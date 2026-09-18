import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: vi.fn(),
    login: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

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

  it('register should call authService.register with body values', async () => {
    authServiceMock.register.mockResolvedValue({ message: 'Usuário registrado com sucesso' });

    const body = {
      login: 'roberto',
      senha: '123456',
      nome: 'Roberto',
    };

    const result = await controller.register(body);

    expect(authServiceMock.register).toHaveBeenCalledWith('roberto', '123456', 'Roberto');
    expect(result).toEqual({ message: 'Usuário registrado com sucesso' });
  });

  it('login should call authService.login with body values', async () => {
    authServiceMock.login.mockResolvedValue({ access_token: 'token' });

    const body = {
      login: 'roberto',
      senha: '123456',
    };

    const result = await controller.login(body);

    expect(authServiceMock.login).toHaveBeenCalledWith('roberto', '123456');
    expect(result).toEqual({ access_token: 'token' });
  });
});
