import { Module } from '@nestjs/common';
import { ProdutoService } from './produto.service.js';
import { ProdutoController } from './produto.controller.js';

@Module({
  controllers: [ProdutoController],
  providers: [ProdutoService],
})
export class ProdutoModule {}
