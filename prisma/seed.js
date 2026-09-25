const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'kexi@example.com' },
    update: {},
    create: {
      email: 'kexi@example.com',
      name: 'Kexi',
    },
  });

  console.log('User created:', user);

  // Clear existing tasks and habits to avoid duplicates on re-run
  await prisma.task.deleteMany({});
  await prisma.habit.deleteMany({});

  // Seed Tasks
  await prisma.task.create({
    data: {
      title: '晨会总结与汇报',
      dueDate: new Date(new Date().setHours(9, 30, 0, 0)),
      isCompleted: true,
      userId: user.id,
    }
  });
  await prisma.task.create({
    data: {
      title: '整理产品需求文档 (FRD)',
      dueDate: new Date(new Date().setHours(14, 0, 0, 0)),
      isCompleted: false,
      userId: user.id,
    }
  });
  await prisma.task.create({
    data: {
      title: '下班去买咖啡豆 ☕',
      dueDate: new Date(new Date().setHours(18, 0, 0, 0)),
      isCompleted: false,
      userId: user.id,
    }
  });

  // Seed Habits
  await prisma.habit.create({
    data: {
      title: '喝水 8杯',
      icon: '💧',
      streak: 2,
      userId: user.id,
    }
  });
  await prisma.habit.create({
    data: {
      title: '阅读',
      icon: '📖',
      streak: 5,
      userId: user.id,
    }
  });
  await prisma.habit.create({
    data: {
      title: '冥想',
      icon: '🧘',
      streak: 0,
      userId: user.id,
    }
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
