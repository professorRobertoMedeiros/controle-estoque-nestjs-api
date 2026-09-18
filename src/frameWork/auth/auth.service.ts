import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuarios } from './entitys/usuarios.entity.js';
import { AuthPayloadDto } from './dto/auth.payload.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuarios)
    private usersRepo: Repository<Usuarios>,
    private jwtService: JwtService,
  ) {}

  async register(login: string, senha: string, nome: string) {
    const hash = await bcrypt.hash(senha, 10);
    const user = this.usersRepo.create({ login, senha: hash, nome });
    await this.usersRepo.save(user);
    return { message: 'Usuário registrado com sucesso' };
  }

  async validateUser(login: string, senha: string): Promise<Usuarios | null> {
    const user = await this.usersRepo.findOne({ where: { login } });
    if (user && (await bcrypt.compare(senha, user.senha))) {
      return user;
    }
    return null;
  }

  async login(login: string, senha: string) {
    const user = await this.validateUser(login, senha);
    if (!user) throw new BadRequestException('Usuário ou senha inválidos');
    const payload:AuthPayloadDto = { username: user.nome, sub: user.uuid };
    return { access_token: this.jwtService.sign(payload) };
  }

  async getUserByUuid(uuid: string): Promise<Usuarios | null> {
    const user = await this.usersRepo.findOne({ where: { uuid } });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    const { senha, ...userWithoutSenha } = user; // Remove a senha antes de retornar o usuário
    
    return userWithoutSenha as Usuarios;
  }
}
