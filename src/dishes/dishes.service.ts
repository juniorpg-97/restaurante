import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDishDto } from './dto/create-dish.dto.js';
import { UpdateDishDto } from './dto/update-dish.dto.js';

@Injectable()
export class DishesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDishDto) {
    return this.prisma.dish.create({ data: dto });
  }

  findAll(categoryId?: number) {
    return this.prisma.dish.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!dish) throw new NotFoundException(`Plato ${id} no encontrado`);
    return dish;
  }

  async update(id: number, dto: UpdateDishDto) {
    await this.findOne(id);
    return this.prisma.dish.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.dish.delete({ where: { id } });
  }
}
