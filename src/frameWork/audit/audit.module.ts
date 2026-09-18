import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Audit } from "./entities/audit.entity.js";
import { AuditController } from "./audit.controller.js";
import { AuditService } from "./audit.service.js";
import { AuditTriggerService } from "./audit-trigger.service.js";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuthModule } from "../auth/auth.module.js";
import { UserContextInterceptor } from "../auth/user-context.interceptor.js";


@Module({
    imports: [
        TypeOrmModule.forFeature([Audit]),
        AuthModule,
    ],
    controllers: [AuditController],
    providers: [
        AuditService,
        AuditTriggerService, 
        {
            provide: APP_INTERCEPTOR,
            useClass: UserContextInterceptor,
        }
    ],
    exports: [TypeOrmModule],
})
export class AuditModule {}