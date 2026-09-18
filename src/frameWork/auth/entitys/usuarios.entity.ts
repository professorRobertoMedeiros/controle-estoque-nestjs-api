import { BeforeInsert, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Audit } from '../../audit/audit.decorator.js';

@Entity()
@Audit()
export class Usuarios {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  uuid: string;

  @Column({ unique: true })
  login: string;

  @Column({ nullable: false })
  senha: string;

  @Column({ nullable: false })
  nome: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  ativo: boolean;

  @BeforeInsert()
  ensureUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }
}
