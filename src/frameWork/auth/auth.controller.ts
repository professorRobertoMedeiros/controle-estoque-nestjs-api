import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
  @Post('register')
  register(@Body() body: { login: string; senha: string; nome: string }) {
    return this.authService.register(body.login, body.senha, body.nome);
  }

  @Post('login')
  login(@Body() body: { login: string; senha: string }) {
    return this.authService.login(body.login, body.senha);
  }
}
