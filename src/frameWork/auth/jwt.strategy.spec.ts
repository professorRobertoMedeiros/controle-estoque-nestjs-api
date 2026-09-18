import { vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const authServiceMock = {
    getUserByUuid: vi.fn(),
  } as unknown as AuthService;

  const configServiceMock = {
    getOrThrow: vi.fn().mockReturnValue('test-secret'),
  };

  let strategy: JwtStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new JwtStrategy(authServiceMock, configServiceMock as any);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('validate should return mapped user data when user is active', async () => {
    authServiceMock.getUserByUuid = vi.fn().mockResolvedValue({
      uuid: 'uuid-1',
      login: 'roberto',
      nome: 'Roberto',
      ativo: true,
    });

    const result = await strategy.validate({ sub: 'uuid-1', username: 'Roberto' });

    expect(result).toEqual({
      userId: 'uuid-1',
      login: 'roberto',
      nome: 'Roberto',
      ativo: true,
    });
  });

  it('validate should throw when user is inactive', async () => {
    authServiceMock.getUserByUuid = vi.fn().mockResolvedValue({
      uuid: 'uuid-2',
      login: 'roberto.inativo',
      nome: 'Roberto Inativo',
      ativo: false,
    });

    await expect(strategy.validate({ sub: 'uuid-2', username: 'Roberto Inativo' })).rejects.toThrow(
      'Usuário está inativo',
    );
  });
});
