'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

import { getSession, createSession, clearSession, getUser } from '@/lib/session';
import { getEffectiveSession, getGuestId, resetGuestToInitialDemo } from '@/lib/guest-session';
import { getTaskSpanInfo } from '@/lib/task-utils';
import bcrypt from 'bcryptjs';

export { getUser };

export async function getEffectiveUserId(): Promise<string> {
  const { userId } = await getEffectiveSession();
  return userId;
}

export async function resetDemoSandbox() {
  const guestId = await getGuestId();
  if (guestId) {
    await resetGuestToInitialDemo(guestId);
    revalidatePath('/');
    revalidatePath('/stats');
    revalidatePath('/memos');
    revalidatePath('/task-center');
    revalidatePath('/data-center');
    revalidatePath('/journal');
    revalidatePath('/overdue');
    return { ok: true as const };
  }
  return { ok: false as const, error: '未处于访客演示状态' };
}

export async function getDashboardData() {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { tasks: [], habits: [], overdueCount: 0 };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // 1. 今天应做的普通任务（截止日在今天之内）
  const todayTasks = await prisma.task.findMany({
    where: { 
      userId: targetId,
      dueDate: { gte: todayStart, lte: todayEnd }
    },
    orderBy: { dueDate: 'asc' }
  });

  // 2. 过去创建且未完成的任务
  const pastIncompleteTasks = await prisma.task.findMany({
    where: {
      userId: targetId,
      dueDate: { lt: todayStart },
      isCompleted: false
    },
    orderBy: { dueDate: 'asc' }
  });

  // 3. 过去创建但在今天完成的跨度任务（保留在今日已完成列表中）
  const pastCompletedTodayTasks = await prisma.task.findMany({
    where: {
      userId: targetId,
      dueDate: { lt: todayStart },
      isCompleted: true,
      updatedAt: { gte: todayStart, lte: todayEnd }
    },
    orderBy: { dueDate: 'asc' }
  });

  const activeMultiDayTasks: typeof todayTasks = [];
  let overdueCount = 0;

  for (const task of pastIncompleteTasks) {
    const spanInfo = getTaskSpanInfo(task, todayStart);
    if (spanInfo.isWithinSpan) {
      // 仍然处于跨度周期内：自动加入今日任务，不属于逾期！
      activeMultiDayTasks.push(task);
    } else if (spanInfo.isOverdue) {
      // 已经超过跨度总天数且未完成：计入真正逾期
      overdueCount++;
    }
  }

  for (const task of pastCompletedTodayTasks) {
    const spanInfo = getTaskSpanInfo(task, todayStart);
    if (spanInfo.isMultiDay) {
      activeMultiDayTasks.push(task);
    }
  }

  // 合并今日任务与跨度期内的短期任务（去重）
  const taskMap = new Map<string, typeof todayTasks[0]>();
  for (const task of [...activeMultiDayTasks, ...todayTasks]) {
    taskMap.set(task.id, task);
  }
  const tasks = Array.from(taskMap.values());
  // 排序：未完成的在前（按 dueDate 升序），已完成的在后
  tasks.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const habits = await prisma.habit.findMany({
    where: { userId: targetId },
    include: {
      logs: {
        where: { date: { gte: todayStart, lte: todayEnd } }
      }
    }
  });

  return { tasks, habits, overdueCount };
}

export async function getStatsData() {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { todayTasks: 0, todayCompleted: 0, habits: [], summary: null };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 获取今日看板的任务集合以保证统计一致性
  const { tasks } = await getDashboardData();

  const habits = await prisma.habit.findMany({
    where: { userId: targetId },
    orderBy: { streak: 'desc' }
  });

  const summary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId: targetId,
        date: todayStart
      }
    }
  });

  return {
    todayTasks: tasks.length,
    todayCompleted: tasks.filter(t => t.isCompleted).length,
    habits,
    summary
  };
}

export async function saveDailySummary(content: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return;

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  await prisma.dailySummary.upsert({
    where: {
      userId_date: {
        userId: targetId,
        date: todayStart
      }
    },
    update: { content },
    create: {
      content,
      date: todayStart,
      userId: targetId
    }
  })
  revalidatePath('/stats')
}

export async function toggleTask(taskId: string, isCompleted: boolean) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return;

  await prisma.task.updateMany({ where: { id: taskId, userId: targetId }, data: { isCompleted } })
  revalidatePath('/')
  revalidatePath('/stats')
}

export async function updateTaskDetails(taskId: string, title: string, description: string, span?: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return;

  try {
    await prisma.task.updateMany({ 
      where: { id: taskId, userId: targetId }, 
      data: { 
        title, 
        description,
        ...(span !== undefined ? { span } : {})
      } 
    });
  } catch (e: any) {
    if (e?.message?.includes('Unknown argument `span`') || e?.message?.includes('Unknown argument "span"')) {
      await prisma.task.updateMany({ 
        where: { id: taskId, userId: targetId }, 
        data: { title, description } 
      });
    } else {
      throw e;
    }
  }
  revalidatePath('/');
  revalidatePath('/overdue');
  revalidatePath('/stats');
}

export async function createTask(data: { title: string; description: string; dueDate?: Date | string | null; span?: string }) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { ok: false as const, error: '无法获取用户标识' };

  // 保证 dueDate 绝对有效；没指定或无效时，默认当天全天 (23:59:00)
  let finalDueDate: Date;
  if (data.dueDate) {
    const parsed = new Date(data.dueDate);
    if (!isNaN(parsed.getTime())) {
      finalDueDate = parsed;
    } else {
      finalDueDate = new Date();
      finalDueDate.setHours(23, 59, 0, 0);
    }
  } else {
    finalDueDate = new Date();
    finalDueDate.setHours(23, 59, 0, 0);
  }

  try {
    await prisma.task.create({ 
      data: { 
        title: data.title,
        description: data.description || '',
        dueDate: finalDueDate,
        span: data.span || '当天',
        userId: targetId 
      } 
    });
  } catch (e: any) {
    if (e?.message?.includes('Unknown argument `span`') || e?.message?.includes('Unknown argument "span"')) {
      await prisma.task.create({ 
        data: { 
          title: data.title,
          description: data.description || '',
          dueDate: finalDueDate,
          userId: targetId 
        } 
      });
    } else {
      throw e;
    }
  }
  revalidatePath('/');
  revalidatePath('/stats');
  return { ok: true as const };
}

export async function createHabit(data: { title: string; icon: string }) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { ok: false as const, error: '无法获取用户标识' };
  await prisma.habit.create({ data: { ...data, userId: targetId } })
  revalidatePath('/')
  revalidatePath('/stats')
  return { ok: true as const }
}

export async function toggleHabitCheckIn(habitId: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return;
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const existingLog = await prisma.habitLog.findFirst({
    where: {
      habitId,
      habit: { userId: targetId },
      date: { gte: todayStart }
    }
  })
  if (existingLog) {
    await prisma.habitLog.delete({ where: { id: existingLog.id } })
    const habit = await prisma.habit.findUnique({ where: { id: habitId, userId: targetId } })
    if (habit && habit.streak > 0) {
      await prisma.habit.update({ where: { id: habitId }, data: { streak: { decrement: 1 } } })
    }
  } else {
    await prisma.habitLog.create({ data: { date: new Date(), habitId } })
    await prisma.habit.updateMany({ where: { id: habitId, userId: targetId }, data: { streak: { increment: 1 } } })
  }
  revalidatePath('/')
  revalidatePath('/stats')
}

export async function updateHabit(habitId: string, data: { title: string; icon: string }) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return;
  await prisma.habit.updateMany({ where: { id: habitId, userId: targetId }, data });
  revalidatePath('/');
  revalidatePath('/stats');
  revalidatePath('/profile');
}

export async function deleteHabit(habitId: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return;
  await prisma.habitLog.deleteMany({ where: { habitId, habit: { userId: targetId } } });
  await prisma.habit.deleteMany({ where: { id: habitId, userId: targetId } });
  revalidatePath('/');
  revalidatePath('/stats');
  revalidatePath('/profile');
}
  
export async function deleteTask(taskId: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return;

  await prisma.task.deleteMany({ where: { id: taskId, userId: targetId } })
  revalidatePath('/')
  revalidatePath('/stats')
}

export async function getWeeklySummary(year: number, week: number) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return null;
  return await prisma.weeklySummary.findUnique({
    where: { userId_year_week: { userId: targetId, year, week } }
  });
}

export async function saveWeeklySummary(year: number, week: number, content: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return;
  await prisma.weeklySummary.upsert({
    where: { userId_year_week: { userId: targetId, year, week } },
    update: { content },
    create: { userId: targetId, year, week, content }
  });
  revalidatePath('/stats');
}

export async function getOverdueTasks() {
  const targetId = await getEffectiveUserId();
  if (!targetId) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const pastIncompleteTasks = await prisma.task.findMany({
    where: { 
      userId: targetId, 
      isCompleted: false, 
      dueDate: { lt: todayStart } 
    },
    orderBy: { dueDate: 'asc' }
  });

  // 只有超过跨度天数且未完成的才算真正逾期
  return pastIncompleteTasks.filter(task => {
    const spanInfo = getTaskSpanInfo(task, todayStart);
    return spanInfo.isOverdue;
  });
}

export async function getDataCenterData() {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { futureTasks: [], weeklySummaries: [], dailySummaries: [], completedTasks: [] };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const futureTasks = await prisma.task.findMany({
    where: { userId: targetId, isCompleted: false, dueDate: { gte: todayStart } },
    orderBy: { dueDate: 'asc' }
  });
  const weeklySummaries = await prisma.weeklySummary.findMany({
    where: { userId: targetId },
    orderBy: [{ year: 'desc' }, { week: 'desc' }]
  });
  const dailySummaries = await prisma.dailySummary.findMany({
    where: { userId: targetId },
    orderBy: { date: 'desc' }
  });
  const completedTasks = await prisma.task.findMany({
    where: { userId: targetId, isCompleted: true },
    orderBy: { updatedAt: 'desc' }
  });
  return { futureTasks, weeklySummaries, dailySummaries, completedTasks };
}


export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (!username || !password) return { error: '请填写完整信息' };
  
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { error: '账号或密码错误' };
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: '账号或密码错误' };
  
  await createSession(user.id);
  return { success: true };
}

export async function register(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  
  if (!username || !password) return { error: '请填写完整信息' };
  
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: '该账号已被注册' };
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name: name || username
    }
  });
  
  await createSession(user.id);
  return { success: true };
}

export async function logout() {
  await clearSession();
}



// ==========================================
// 灵感速记 (Memo) & 习惯矩阵 (Habit Matrix) Actions
// ==========================================

export async function getMemos() {
  const targetId = await getEffectiveUserId();
  if (!targetId) return [];
  return await prisma.memo.findMany({
    where: { userId: targetId },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function getMemoCount() {
  const targetId = await getEffectiveUserId();
  if (!targetId) return 0;
  return await prisma.memo.count({
    where: { userId: targetId }
  });
}

export async function createMemo(data: { id?: string; content: string; tags: string[] }) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { ok: false as const, error: "无法识别用户" };
  const trimmed = data.content?.trim();
  if (!trimmed) return { ok: false as const, error: "内容不能为空" };
  if (trimmed.length > 1000) return { ok: false as const, error: "内容不能超过1000字" };

  const memoId = data.id || crypto.randomUUID();
  const tagsArr = Array.isArray(data.tags) ? data.tags : [];
  const category = tagsArr[0] === "灵感" ? "INSPIRATION" : "TRIVIA";

  const existing = await prisma.memo.findUnique({ where: { id: memoId } });
  if (existing) {
    if (existing.userId !== targetId) {
      return { ok: false as const, error: "无权操作他人记录" };
    }
    const updated = await prisma.memo.update({
      where: { id: memoId },
      data: {
        content: trimmed,
        tags: JSON.stringify(tagsArr),
        category
      }
    });
    revalidatePath("/");
    revalidatePath("/memos");
    revalidatePath("/stats");
    return { ok: true as const, memo: updated };
  }

  const created = await prisma.memo.create({
    data: {
      id: memoId,
      content: trimmed,
      tags: JSON.stringify(tagsArr),
      category,
      userId: targetId
    }
  });
  revalidatePath("/");
  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const, memo: created };
}

export async function deleteMemo(memoId: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { ok: false as const, error: "无法识别用户" };

  const res = await prisma.memo.deleteMany({
    where: { id: memoId, userId: targetId }
  });
  if (res.count === 0) {
    return { ok: false as const, error: "无权删除或记录不存在" };
  }
  revalidatePath("/");
  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const };
}

export async function getHabitMatrixData(days = 84) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { habits: [], logs: [] };

  const habits = await prisma.habit.findMany({
    where: { userId: targetId },
    orderBy: { createdAt: "asc" }
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const logs = await prisma.habitLog.findMany({
    where: {
      habit: { userId: targetId },
      date: { gte: startDate }
    },
    select: {
      id: true,
      habitId: true,
      date: true,
      isCompleted: true
    }
  });

  return { habits, logs };
}


// ==========================================
// 持久化标签 (Persistent Tag) 核心 Actions
// ==========================================

export async function getTags() {
  const targetId = await getEffectiveUserId();
    if (!targetId) return [];
  let tags = await prisma.tag.findMany({
    where: { userId: targetId },
    orderBy: { createdAt: "asc" }
  });

  // 初次使用自动初始化 3 个默认标签
  if (tags.length === 0) {
    const defaultPresets = [
      { name: "灵感", color: "#A78BFA" },
      { name: "杂记", color: "#60A5FA" },
      { name: "备忘", color: "#FBBF24" }
    ];
    for (const p of defaultPresets) {
      await prisma.tag.upsert({
        where: { userId_name: { userId: targetId, name: p.name } },
        update: {},
        create: { name: p.name, color: p.color, userId: targetId }
      }).catch(() => {});
    }
    tags = await prisma.tag.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: "asc" }
    });
  }
  return tags;
}

export async function createTag(name: string, color = "#A78BFA") {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { ok: false as const, error: "无法识别用户" };
  const trimmed = name?.trim().replace(/^#+/, "");
  if (!trimmed) return { ok: false as const, error: "标签名不能为空" };
  if (trimmed.length > 20) return { ok: false as const, error: "标签名不能超过20个字符" };

  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId: targetId, name: trimmed } }
  });
  if (existing) {
    return { ok: true as const, tag: existing };
  }

  const tag = await prisma.tag.create({
    data: {
      name: trimmed,
      color: color || "#A78BFA",
      userId: targetId
    }
  });

  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const, tag };
}

export async function updateTag(tagId: string, name: string, color: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { ok: false as const, error: "无法识别用户" };
  const trimmed = name?.trim().replace(/^#+/, "");
  if (!trimmed) return { ok: false as const, error: "标签名不能为空" };
  if (trimmed.length > 20) return { ok: false as const, error: "标签名不能超过20个字符" };

  const existing = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!existing || existing.userId !== targetId) {
    return { ok: false as const, error: "标签不存在或无权修改" };
  }

  const oldName = existing.name;
  if (oldName !== trimmed) {
    const conflict = await prisma.tag.findUnique({
      where: { userId_name: { userId: targetId, name: trimmed } }
    });
    if (conflict) {
      return { ok: false as const, error: "已存在名为 #" + trimmed + " 的标签" };
    }
  }

  const updatedTag = await prisma.tag.update({
    where: { id: tagId },
    data: { name: trimmed, color }
  });

  // 级联重命名：同步更新所有引用此标签的 Memo 记录
  if (oldName !== trimmed) {
    const userMemos = await prisma.memo.findMany({ where: { userId: targetId } });
    for (const m of userMemos) {
      try {
        const arr = JSON.parse(m.tags || "[]");
        if (Array.isArray(arr) && arr.includes(oldName)) {
          const nextArr = arr.map(t => (t === oldName ? trimmed : t));
          await prisma.memo.update({
            where: { id: m.id },
            data: { tags: JSON.stringify(nextArr) }
          });
        }
      } catch (err) {
        console.error("Cascade update memo error:", err);
      }
    }
  }

  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const, tag: updatedTag };
}

export async function deleteTag(tagId: string) {
  const targetId = await getEffectiveUserId();
  if (!targetId) return { ok: false as const, error: "无法识别用户" };

  const existing = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!existing || existing.userId !== targetId) {
    return { ok: false as const, error: "标签不存在或无权删除" };
  }

  const tagName = existing.name;
  await prisma.tag.delete({ where: { id: tagId } });

  // 级联清理：从用户的所有 Memo 中移除该标签
  const userMemos = await prisma.memo.findMany({ where: { userId: targetId } });
  for (const m of userMemos) {
    try {
      const arr = JSON.parse(m.tags || "[]");
      if (Array.isArray(arr) && arr.includes(tagName)) {
        const nextArr = arr.filter(t => t !== tagName);
        await prisma.memo.update({
          where: { id: m.id },
          data: { tags: JSON.stringify(nextArr) }
        });
      }
    } catch (err) {
      console.error("Cascade delete memo tag error:", err);
    }
  }

  revalidatePath("/memos");
  revalidatePath("/stats");
  return { ok: true as const };
}


export async function getJournalData() {
  const targetId = await getEffectiveUserId();
    if (!targetId) return { weeklySummaries: [], dailySummaries: [] };
  const weeklySummaries = await prisma.weeklySummary.findMany({
    where: { userId: targetId },
    orderBy: [{ year: 'desc' }, { week: 'desc' }]
  });
  const dailySummaries = await prisma.dailySummary.findMany({
    where: { userId: targetId },
    orderBy: { date: 'desc' }
  });
  return { weeklySummaries, dailySummaries };
}


export async function updateProfile(name: string, avatar: string) {
  const user = await getUser();
  if (!user) throw new Error("未登录");
  await prisma.user.update({
    where: { id: user.id },
    data: { name, avatar } as any,
  });
  return { success: true };
}

export async function changePassword(oldPass: string, newPass: string) {
  const user = await getUser();
  if (!user) throw new Error("未登录");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { ok: false, error: "用户不存在" };
  const isValid = await bcrypt.compare(oldPass, dbUser.password);
  if (!isValid) return { ok: false, error: "旧密码错误" };
  const hashedPassword = await bcrypt.hash(newPass, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
  return { ok: true };
}

export async function deleteAccount() {
  const user = await getUser();
  if (!user) throw new Error("未登录");
  await prisma.user.delete({
    where: { id: user.id }
  });
  await clearSession();
  return { ok: true };
}




export async function getAllTasks() {
  const targetId = await getEffectiveUserId();
  if (!targetId) return [];
  const tasks = await prisma.task.findMany({
    where: { userId: targetId },
    orderBy: { dueDate: "asc" }
  });
  return tasks;
}



















