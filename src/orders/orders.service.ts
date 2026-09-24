import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { OrderStatus, Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

const round2 = (value: number) => Math.round(value * 100) / 100;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, user: JwtPayload) {
    const dishIds = dto.items.map((item) => item.dishId);
    const dishes = await this.prisma.dish.findMany({
      where: { id: { in: dishIds }, available: true },
    });

    const items = dto.items.map((item) => {
      const dish = dishes.find((d) => d.id === item.dishId);
      if (!dish) {
        throw new BadRequestException(
          `El plato ${item.dishId} no existe o no está disponible`,
        );
      }
      return {
        dishId: dish.id,
        quantity: item.quantity,
        unitPrice: Number(dish.price),
      };
    });

    const taxRate = parseFloat(process.env.TAX_RATE ?? '0');
    const subtotal = round2(
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
    const tax = round2(subtotal * taxRate);
    const total = round2(subtotal + tax);

    return this.prisma.order.create({
      data: {
        userId: user.sub,
        subtotal,
        tax,
        total,
        items: { create: items },
      },
      include: { items: { include: { dish: true } } },
    });
  }

  findAll(user: JwtPayload) {
    const isStaff = user.role === Role.ADMIN || user.role === Role.WAITER;
    return this.prisma.order.findMany({
      where: isStaff ? undefined : { userId: user.sub },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { dish: true } } },
    });
    if (!order) throw new NotFoundException(`Pedido ${id} no encontrado`);

    const isStaff = user.role === Role.ADMIN || user.role === Role.WAITER;
    if (!isStaff && order.userId !== user.sub) {
      throw new ForbiddenException('No puedes ver pedidos de otros usuarios');
    }
    return order;
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Pedido ${id} no encontrado`);
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
}
