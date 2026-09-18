/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier

import { SetMetadata } from "@nestjs/common";

export const AUDITABLE_KEY = 'AUDIT_ENTITY';

export const Audit = () => SetMetadata(AUDITABLE_KEY, true);
