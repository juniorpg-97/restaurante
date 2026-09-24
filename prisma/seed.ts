import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);

  await prisma.user.upsert({
    where: { email: 'admin@restaurante.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@restaurante.com',
      password: await bcrypt.hash('admin123', saltRounds),
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'mesero@restaurante.com' },
    update: {},
    create: {
      name: 'Mesero',
      email: 'mesero@restaurante.com',
      password: await bcrypt.hash('mesero123', saltRounds),
      role: 'WAITER',
    },
  });

  const menu = {
    Entradas: [
      { name: 'Empanadas salteñas', price: 8 },
      { name: 'Ensalada fresca', price: 15 },
    ],
    'Platos de fondo': [
      { name: 'Pique macho', price: 55 },
      { name: 'Silpancho', price: 40 },
      { name: 'Pollo a la brasa', price: 45 },
    ],
    Bebidas: [
      { name: 'Limonada', price: 10 },
      { name: 'Mocochinchi', price: 8 },
    ],
  };

  for (const [categoryName, dishes] of Object.entries(menu)) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    const existing = await prisma.dish.count({
      where: { categoryId: category.id },
    });
    if (existing === 0) {
      await prisma.dish.createMany({
        data: dishes.map((dish) => ({ ...dish, categoryId: category.id })),
      });
    }
  }

  console.log('🌱 Seed completado');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
