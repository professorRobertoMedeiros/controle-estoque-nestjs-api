import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from './entities/audit.entity.js';

type AuditListFilters = {
  entity?: string;
  entityId?: string;
  page?: string | number;
  limit?: string | number;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Audit)
    private readonly auditRepository: Repository<Audit>,
  ) {}

  async findAll(query: any) {
    const { page, limit, ...rawFilters } = query || {};
    const parsedPage = this.parsePositiveInt(page, 1, 'page');
    const parsedLimit = this.parsePositiveInt(limit, 10, 'limit');

    const queryBuilder = this.auditRepository.createQueryBuilder('audit');
    const validColumns = new Set(
      this.auditRepository.metadata.columns.map((column) => column.propertyName),
    );

    for (const [rawKey, rawValue] of Object.entries(rawFilters)) {
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        continue;
      }

      const key = rawKey === 'entity' ? 'entityName' : rawKey;
      if (!validColumns.has(key)) {
        continue;
      }

      queryBuilder.andWhere(`audit.${key} = :${key}`, { [key]: rawValue });
    }

    queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .skip((parsedPage - 1) * parsedLimit)
      .take(parsedLimit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    };

  }

  async getAuditedEntities() {
    const entities = await this.auditRepository
      .createQueryBuilder('audit')
      .select('DISTINCT audit.entityName', 'entityName')
      .orderBy('audit.entityName', 'ASC')
      .getRawMany();

    return {
      data: entities.map((e) => e.entityName),
      total: entities.length,
    };
  }

  async findById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('ID de auditoria inválido');
    }

    const audit = await this.auditRepository.findOneBy({ id });

    if (!audit) {
      throw new NotFoundException('Registro de auditoria não encontrado');
    }

    return audit;
  }

  private parsePositiveInt(
    value: string | number | undefined,
    defaultValue: number,
    fieldName: string,
  ) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    const parsedValue = typeof value === 'number' ? value : Number.parseInt(value, 10);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestException(`Parâmetro ${fieldName} deve ser um número inteiro positivo`);
    }

    return parsedValue;
  }
}