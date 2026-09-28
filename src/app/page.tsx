import React from 'react';
import { getUser, getDashboardData } from './actions';
import { prisma } from '@/lib/prisma';
import HomeClient from '@/components/HomeClient';

export default async function Dashboard() {
  const user = await getUser();
  
  let targetUserId = user?.id;
  let isDemo = false;
  
  if (!user) {
    const kexi = await prisma.user.findUnique({ where: { username: 'kexi' } });
    if (kexi) {
      targetUserId = kexi.id;
      isDemo = true;
    }
  }

  const { tasks, habits } = await getDashboardData();
  
  let memos: any[] = [];
  if (targetUserId) {
    memos = await prisma.memo.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  return <HomeClient user={user} tasks={tasks} habits={habits} memos={memos} isDemo={isDemo} />;
}
