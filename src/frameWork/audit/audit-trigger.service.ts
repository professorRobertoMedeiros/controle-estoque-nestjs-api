/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AUDITABLE_KEY } from './audit.decorator.js';

@Injectable()
export class AuditTriggerService implements OnModuleInit {
  private readonly logger = new Logger(AuditTriggerService.name);
  private readonly TRIGGER_PREFIX = 'trg_audit_';

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.ensureAuditFunctionExists();
      await this.syncDatabaseTriggers();
    } catch (error) {
      this.logger.error('Erro ao sincronizar triggers de auditoria', error);
    }
  }

  private async ensureAuditFunctionExists(): Promise<void> {
    const query = `
      CREATE OR REPLACE FUNCTION fn_audit_trigger_log()
      RETURNS TRIGGER AS $$
      DECLARE
          old_data jsonb := NULL;
          new_data jsonb := NULL;
          entity_id_val text := NULL;
          pk_column text := COALESCE(TG_ARGV[0], 'id');
      BEGIN
          IF (TG_OP = 'INSERT') THEN
              new_data := to_jsonb(NEW);
              entity_id_val := (new_data ->> pk_column);
          ELSIF (TG_OP = 'UPDATE') THEN
              old_data := to_jsonb(OLD);
              new_data := to_jsonb(NEW);
              entity_id_val := (new_data ->> pk_column);
          ELSIF (TG_OP = 'DELETE') THEN
              old_data := to_jsonb(OLD);
              entity_id_val := (old_data ->> pk_column);
          END IF;

            INSERT INTO audit (uuid, entity_name, entity_id, user_id, action, old_state, new_state, created_at)
          VALUES (
              md5(random()::text || clock_timestamp()::text)::uuid,
              TG_TABLE_NAME,
              entity_id_val,
              NULLIF(current_setting('app.current_user_id', true), '')::integer,
              TG_OP,
              old_data,
              new_data,
              NOW()
          );

          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;
    await this.dataSource.query(query);
  }

  private async syncDatabaseTriggers(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    // 1. Mapeia entidades no TypeORM com o decorador @Auditable()
    const auditableEntitiesMap = new Map<string, string>(); // tableName -> primaryKeyName

    for (const metadata of this.dataSource.entityMetadatas) {
      const isAuditable = Boolean(Reflect.getMetadata(AUDITABLE_KEY, metadata.target));
      if (isAuditable) {
        const pkColumn = metadata.primaryColumns[0]?.databaseName || 'id';
        auditableEntitiesMap.set(metadata.tableName, pkColumn);
      }
    }

    // 2. Consulta as triggers de auditoria existentes no PostgreSQL
    const existingTriggersRaw: Array<{ trigger_name: string; table_name: string }> = await queryRunner.query(`
      SELECT tgname AS trigger_name, relname AS table_name
      FROM pg_trigger
      JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
      WHERE tgname LIKE '${this.TRIGGER_PREFIX}%';
    `);

    const existingTriggersMap = new Map(
      existingTriggersRaw.map((t) => [t.table_name, t.trigger_name])
    );

    // 3. CRIA ou ATUALIZA triggers para entidades com @Auditable()
    for (const [tableName, pkColumn] of auditableEntitiesMap.entries()) {
      const triggerName = `${this.TRIGGER_PREFIX}${tableName}`;

      // Garante que a trigger é recriada/atualizada para a tabela
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS ${triggerName} ON "${tableName}";
        CREATE TRIGGER ${triggerName}
        AFTER INSERT OR UPDATE OR DELETE ON "${tableName}"
        FOR EACH ROW
        EXECUTE FUNCTION fn_audit_trigger_log('${pkColumn}');
      `);

      this.logger.log(`Trigger de auditoria garantida para tabela: ${tableName}`);
    }

    // 4. REMOVE triggers de tabelas que NÃO possuem mais o decorador
    for (const [tableName, triggerName] of existingTriggersMap.entries()) {
      if (!auditableEntitiesMap.has(tableName)) {
        await queryRunner.query(`DROP TRIGGER IF EXISTS ${triggerName} ON "${tableName}";`);
        this.logger.warn(`Trigger removida da tabela não-auditável: ${tableName}`);
      }
    }

    await queryRunner.release();
  }
}