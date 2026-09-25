'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const USER_EMAIL = 'kexi@example.com'

async function getUser() {
  return await prisma.user.findUnique({ where: { email: USER_EMAIL } })
}

export async function getDashboardData() {
  const user = await getUser()
  if (!user) return { tasks: [], habits: [] }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const tasks = await prisma.task.findMany({
    where: { 
      userId: user.id,
      OR: [
        { dueDate: { gte: todayStart, lte: todayEnd } },
        { dueDate: { lt: todayStart }, isCompleted: false }
      ]
    },
    orderBy: { dueDate: 'asc' }
  })

  const habits = await prisma.habit.findMany({
    where: { userId: user.id },
    include: {
      logs: {
        where: { date: { gte: todayStart, lte: todayEnd } }
      }
    }
  })

  return { tasks, habits }
}

export async function getStatsData() {
  const user = await getUser()
  if (!user) return { todayTasks: 0, todayCompleted: 0, habits: [], summary: null }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const todayTasksList = await prisma.task.findMany({
    where: { 
      userId: user.id,
      dueDate: { gte: todayStart, lte: todayEnd }
    }
  })

  const habits = await prisma.habit.findMany({
    where: { userId: user.id },
    orderBy: { streak: 'desc' }
  })

  const summary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: todayStart
      }
    }
  })

  return {
    todayTasks: todayTasksList.length,
    todayCompleted: todayTasksList.filter(t => t.isCompleted).length,
    habits,
    summary
  }
}

export async function saveDailySummary(content: string) {
  const user = await getUser()
  if (!user) return

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  await prisma.dailySummary.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: todayStart
      }
    },
    update: { content },
    create: {
      content,
      date: todayStart,
      userId: user.id
    }
  })
  revalidatePath('/stats')
}

// ... other existing functions unchanged ...
export async function toggleTask(taskId: string, isCompleted: boolean) {
  await prisma.task.update({ where: { id: taskId }, data: { isCompleted } })
  revalidatePath('/')
  revalidatePath('/stats')
}
export async function updateTaskDetails(taskId: string, title: string, description: string) {
  await prisma.task.update({ where: { id: taskId }, data: { title, description } })
  revalidatePath('/')
}
export async function createTask(data: { title: string; description: string; dueDate: Date }) {
  const user = await getUser()
  if (!user) return
  await prisma.task.create({ data: { ...data, userId: user.id } })
  revalidatePath('/')
  revalidatePath('/stats')
}
export async function createHabit(data: { title: string; icon: string }) {
  const user = await getUser()
  if (!user) return
  await prisma.habit.create({ data: { ...data, userId: user.id } })
  revalidatePath('/')
  revalidatePath('/stats')
}
export async function toggleHabitCheckIn(habitId: string) {
  const user = await getUser()
  if (!user) return
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const existingLog = await prisma.habitLog.findFirst({ where: { habitId, date: { gte: todayStart } } })
  if (existingLog) {
    await prisma.habitLog.delete({ where: { id: existingLog.id } })
    const habit = await prisma.habit.findUnique({ where: { id: habitId } })
    if (habit && habit.streak > 0) {
      await prisma.habit.update({ where: { id: habitId }, data: { streak: { decrement: 1 } } })
    }
  } else {
    await prisma.habitLog.create({ data: { date: new Date(), habitId } })
    await prisma.habit.update({ where: { id: habitId }, data: { streak: { increment: 1 } } })
  }
  revalidatePath('/')
  revalidatePath('/stats')
}

  export async function updateHabit(habitId: string, data: { title: string; icon: string }) {
    await prisma.habit.update({ where: { id: habitId }, data });
    revalidatePath('/');
    revalidatePath('/stats');
    revalidatePath('/profile');
  }
  export async function deleteHabit(habitId: string) {
    await prisma.habitLog.deleteMany({ where: { habitId } });
    await prisma.habit.delete({ where: { id: habitId } });
    revalidatePath('/');
    revalidatePath('/stats');
    revalidatePath('/profile');
  }
  
export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath('/')
  revalidatePath('/stats')
}

export async function getWeeklySummary(year: number, week: number) {
  const user = await getUser();
  if (!user) return null;
  return await prisma.weeklySummary.findUnique({
    where: { userId_year_week: { userId: user.id, year, week } }
  });
}

export async function saveWeeklySummary(year: number, week: number, content: string) {
  const user = await getUser();
  if (!user) return;
  await prisma.weeklySummary.upsert({
    where: { userId_year_week: { userId: user.id, year, week } },
    update: { content },
    create: { userId: user.id, year, week, content }
  });
  revalidatePath('/stats');
}

export async function getOverdueTasks() {
  const user = await getUser();
  if (!user) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return await prisma.task.findMany({
    where: { 
      userId: user.id, 
      isCompleted: false, 
      dueDate: { lt: todayStart } 
    },
    orderBy: { dueDate: 'asc' }
  });
}
