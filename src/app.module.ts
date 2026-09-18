import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProdutoModule } from './useCases/produto/produto.module.js';
import { AuthModule } from './frameWork/auth/auth.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategy';
import { AuditModule } from './frameWork/audit/audit.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Deixa disponível em toda a aplicação
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST');

        return {
          type: 'postgres',
          host: dbHost,
          port: Number(configService.get<string>('DB_PORT') || '5432'),
          username: configService.get('DB_USERNAME'),
          database: configService.get('DB'),
          password: configService.get('DB_PASSWORD'),
          autoLoadEntities: true, // Carrega entidades sem precisar especifica-las
          synchronize: configService.get('DB_SYNCHRONIZE'), // Sincroniza com o BD. Não deve ser usado em produção
          logging: true,
          namingStrategy: new SnakeNamingStrategy(),
          
        };
      },
      inject: [ConfigService],
    }),
    ProdutoModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
