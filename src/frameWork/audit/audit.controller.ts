import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AuditService } from './audit.service.js';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.auditService.findAll(query);
  }

  @Get('entities/list')
  getAuditedEntities() {
    return this.auditService.getAuditedEntities();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findById(id);
  }
}