import { Module } from '@nestjs/common';
import { DishesController } from './dishes.controller.js';
import { DishesService } from './dishes.service.js';

@Module({
  controllers: [DishesController],
  providers: [DishesService],
})
export class DishesModule {}
