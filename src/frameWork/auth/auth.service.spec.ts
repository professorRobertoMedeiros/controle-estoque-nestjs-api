import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { vi, type Mock } from 'vitest';
import { AuthService } from './auth.service.js';
import { Usuarios } from './entitys/usuarios.entity.js';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersRepoMock = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
  };

  const jwtServiceMock = {
    sign: vi.fn(),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuarios),
          useValue: usersRepoMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('register should hash password and save user', async () => {
    (bcrypt.hash as unknown as Mock).mockResolvedValue('hashed-password');
    const createdUser = {
      login: 'roberto',
      senha: 'hashed-password',
      nome: 'Roberto',
      uuid: 'uuid-1',
      ativo: true,
    } as Usuarios;

    usersRepoMock.create.mockReturnValue(createdUser);
    usersRepoMock.save.mockResolvedValue(createdUser);

    const result = await service.register('roberto', '123456', 'Roberto');

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(usersRepoMock.create).toHaveBeenCalledWith({
      login: 'roberto',
      senha: 'hashed-password',
      nome: 'Roberto',
    });
    expect(usersRepoMock.save).toHaveBeenCalledWith(createdUser);
    expect(result).toEqual({ message: 'Usuário registrado com sucesso' });
  });

  it('validateUser should return user when credentials are valid', async () => {
    const user = {
      id: 1,
      uuid: 'uuid-1',
      login: 'roberto',
      senha: 'hashed-password',
      nome: 'Roberto',
      ativo: true,
    } as Usuarios;

    usersRepoMock.findOne.mockResolvedValue(user);
    (bcrypt.compare as unknown as Mock).mockResolvedValue(true);

    const result = await service.validateUser('roberto', '123456');

    expect(result).toEqual(user);
  });

  it('validateUser should return null when user does not exist', async () => {
    usersRepoMock.findOne.mockResolvedValue(null);

    const result = await service.validateUser('missing', '123456');

    expect(result).toBeNull();
  });

  it('login should return access token when credentials are valid', async () => {
    const user = {
      id: 1,
      uuid: 'uuid-1',
      login: 'roberto',
      senha: 'hashed-password',
      nome: 'Roberto',
      ativo: true,
    } as Usuarios;

    vi.spyOn(service, 'validateUser').mockResolvedValue(user);
    jwtServiceMock.sign.mockReturnValue('signed-token');

    const result = await service.login('roberto', '123456');

    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      username: 'Roberto',
      sub: 'uuid-1',
    });
    expect(result).toEqual({ access_token: 'signed-token' });
  });

  it('login should throw BadRequestException when credentials are invalid', async () => {
    vi.spyOn(service, 'validateUser').mockResolvedValue(null);

    await expect(service.login('roberto', 'wrong')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getUserByUuid should return user without senha', async () => {
    const user = {
      id: 1,
      uuid: 'uuid-1',
      login: 'roberto',
      senha: 'hashed-password',
      nome: 'Roberto',
      ativo: true,
    } as Usuarios;

    usersRepoMock.findOne.mockResolvedValue(user);

    const result = await service.getUserByUuid('uuid-1');

    expect(result).toEqual({
      id: 1,
      uuid: 'uuid-1',
      login: 'roberto',
      nome: 'Roberto',
      ativo: true,
    });
  });

  it('getUserByUuid should throw BadRequestException when user is not found', async () => {
    usersRepoMock.findOne.mockResolvedValue(null);

    await expect(service.getUserByUuid('unknown-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });
});
