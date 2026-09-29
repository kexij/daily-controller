import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/session';
import { getInitialDemoData } from '@/lib/demo-data';

export const GUEST_COOKIE_NAME = 'guest_session';

/**
 * 获取当前访客的沙盒 ID
 */
export async function getGuestId(): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  if (fromCookie) return fromCookie;

  try {
    const headerStore = await headers();
    const fromHeader = headerStore.get('x-guest-session');
    if (fromHeader) return fromHeader;
  } catch (e) {
    // 忽略 headers 异常
  }

  return null;
}

/**
 * 将指定访客的数据完全还原/重置为固定模版初始数据集
 */
export async function resetGuestToInitialDemo(guestId: string) {
  // 1. 确保该访客用户在 User 表中存在
  await prisma.user.upsert({
    where: { id: guestId },
    update: {},
    create: {
      id: guestId,
      username: guestId,
      password: 'guest_ephemeral_account',
      name: '访客演示',
    },
  });

  // 2. 清除该访客已有的全部沙盒数据
  await prisma.task.deleteMany({ where: { userId: guestId } });
  await prisma.habitLog.deleteMany({ where: { habit: { userId: guestId } } });
  await prisma.habit.deleteMany({ where: { userId: guestId } });
  await prisma.memo.deleteMany({ where: { userId: guestId } });
  await prisma.tag.deleteMany({ where: { userId: guestId } });
  await prisma.dailySummary.deleteMany({ where: { userId: guestId } });
  await prisma.weeklySummary.deleteMany({ where: { userId: guestId } });

  // 3. 读取不可变的固定模板种子数据
  const demo = getInitialDemoData(guestId);

  // 4. 写入固定任务
  for (const task of demo.tasks) {
    try {
      await prisma.task.create({ data: task as any });
    } catch (e: any) {
      if (e?.message?.includes('Unknown argument `span`') || e?.message?.includes('Unknown argument "span"')) {
        const { span, ...taskWithoutSpan } = task as any;
        await prisma.task.create({ data: taskWithoutSpan });
      } else {
        throw e;
      }
    }
  }

  // 5. 写入固定习惯及历史打卡记录
  const now = new Date();
  for (let i = 0; i < demo.habitDefinitions.length; i++) {
    const def = demo.habitDefinitions[i];
    const createdHabit = await prisma.habit.create({
      data: {
        title: def.title,
        icon: def.icon,
        streak: def.streak,
        userId: guestId,
      },
    });

    // 为每个习惯生成近 14 天内有真实感的打卡记录（模拟全景矩阵图效果）
    const logDates: Date[] = [];
    // 第一个和第三个习惯今天已打卡，其他习惯今天待打卡
    const checkToday = i % 2 === 0;

    for (let d = (checkToday ? 0 : 1); d < 14; d++) {
      // 隔几天打卡以显得自然
      if ((d + i) % 3 !== 0) {
        const logDate = new Date(now);
        logDate.setDate(logDate.getDate() - d);
        logDate.setHours(8 + (i * 2), 30, 0, 0);
        logDates.push(logDate);
      }
    }

    for (const d of logDates) {
      await prisma.habitLog.create({
        data: {
          habitId: createdHabit.id,
          date: d,
          isCompleted: true,
        },
      });
    }
  }

  // 6. 写入固定标签
  for (const tag of demo.tags) {
    await prisma.tag.create({ data: tag });
  }

  // 7. 写入固定灵感速记
  for (const memo of demo.memos) {
    await prisma.memo.create({ data: memo });
  }

  // 8. 写入今日心得
  await prisma.dailySummary.create({ data: demo.summary });
}

/**
 * 确保访客账号和模版数据已就绪
 */
export async function ensureGuestUser(guestId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { id: guestId },
  });

  if (!existingUser) {
    await resetGuestToInitialDemo(guestId);
    return;
  }

  // 若用户存在但数据为空（可能异常丢失），重新补齐模版数据
  const taskCount = await prisma.task.count({ where: { userId: guestId } });
  const habitCount = await prisma.habit.count({ where: { userId: guestId } });
  if (taskCount === 0 && habitCount === 0) {
    await resetGuestToInitialDemo(guestId);
  }
}

/**
 * 核心方法：获取当前有效的会话与用户 ID
 * 1. 若有真实登录用户 -> 返回该用户，isDemo: false
 * 2. 若未登录 -> 返回访客沙盒 ID，isDemo: true，并确保沙盒数据已生成
 */
export async function getEffectiveSession(): Promise<{
  user: any;
  userId: string;
  isDemo: boolean;
}> {
  // 检查是否已登录真实账号
  const user = await getUser();
  if (user) {
    return { user, userId: user.id, isDemo: false };
  }

  // 获取访客沙盒 ID
  let guestId = await getGuestId();

  if (!guestId) {
    // 首次无 cookie/header 时，临时生成一个标准沙盒 ID
    guestId = `guest_${crypto.randomUUID()}`;
  }

  // 确保沙盒数据存在
  await ensureGuestUser(guestId);

  return {
    user: null,
    userId: guestId,
    isDemo: true,
  };
}
