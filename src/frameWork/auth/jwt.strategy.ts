import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service.js';
import { AuthPayloadDto } from './dto/auth.payload.dto.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AuthPayloadDto) {

    const user = await this.authService.getUserByUuid(payload.sub);
    if (!user?.ativo) {
      throw new Error('Usuário está inativo');
    }
    return { userId: payload.sub, login: user.login, nome: user.nome, ativo: user.ativo };
  }
}
