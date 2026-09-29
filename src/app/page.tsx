import React from 'react';
import { getDashboardData, getTags } from './actions';
import { prisma } from '@/lib/prisma';
import { getEffectiveSession } from '@/lib/guest-session';
import HomeClient from '@/components/HomeClient';

export default async function Dashboard() {
  const { user, userId, isDemo } = await getEffectiveSession();

  const [{ tasks, habits, overdueCount }, tags] = await Promise.all([
    getDashboardData(),
    getTags()
  ]);

  const memos = await prisma.memo.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <HomeClient
      user={user}
      tasks={tasks}
      habits={habits}
      memos={memos}
      tags={tags}
      overdueCount={overdueCount}
      isDemo={isDemo}
    />
  );
}
