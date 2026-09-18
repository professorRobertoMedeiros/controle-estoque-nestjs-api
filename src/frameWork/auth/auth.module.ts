import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuarios } from "./entitys/usuarios.entity.js";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "./jwt.strategy.js";
import { UserContextInterceptor } from "./user-context.interceptor.js";
import { AuthController } from "./auth.controller.js";
import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { StringValue } from "ms";


@Module({
  imports: [
    TypeOrmModule.forFeature([Usuarios]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rawExpiresIn = configService.get<string>('JWT_EXPIRES_IN');
        const expiresIn: number | StringValue = rawExpiresIn && /^\d+$/.test(rawExpiresIn)
          ? Number(rawExpiresIn)
          : (rawExpiresIn || '1d') as StringValue;

        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, UserContextInterceptor, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, UserContextInterceptor, JwtAuthGuard, PassportModule],
})
export class AuthModule {}
